from fastapi import APIRouter, UploadFile, File, HTTPException
from models.policy import PolicyDocument, WorkflowDefinition, ComplianceReport
from models.chat import ChatRequest, ChatResponse
from models.settings import PolicySettings
from services.ingest import PolicyIngestor
from services.gemini import GeminiService
from services.storage import policy_db
import json

router = APIRouter()
ingestor = PolicyIngestor()
gemini = GeminiService()

@router.post("/policies/upload", response_model=PolicyDocument)
async def upload_policy(file: UploadFile = File(...)):
    if not file.filename.endswith(('.txt', '.pdf', '.docx', '.md', '.json')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    content = await file.read()
    # Basic decoding
    text_content = content.decode('utf-8', errors='ignore')
    
    # Ingest
    print(f"Ingesting policy: {file.filename}")
    cleaned_text = await ingestor.ingest_text(file.filename, text_content)

    # Analyze with Gemini (Immediate Feedback)
    try:
        print(f"Summarizing policy: {file.filename}")
        summary = await gemini.summarize_policy(cleaned_text)
        
        # --- RAG Ingestion ---
        print("Chunking policy...")
        chunks = await ingestor.chunk_policy(cleaned_text)
        
        vectors = []
        if chunks:
            print(f"Generating embeddings for {len(chunks)} chunks...")
            for chunk in chunks:
                vec = await gemini.create_embedding(chunk)
                vectors.append(vec)
            
    except Exception as e:
        print(f"Gemini Error during summary/embedding: {e}")
        # import traceback
        # traceback.print_exc()
        summary = "Summary unavailable (AI Error)"
        chunks = []
        vectors = []
    
    import uuid
    policy_id = str(uuid.uuid4())
    
    policy = PolicyDocument(
        id=policy_id,
        name=file.filename,
        content=cleaned_text,
        summary=summary
    )
    
    # Save to In-Memory DB & Persistence
    policy_db.add_policy(policy)
    
    # Save Vectors
    if chunks and vectors:
        policy_db.add_policy_vectors(policy_id, chunks, vectors)
        print(f"Saved {len(chunks)} vector chunks for {file.filename}")
    
    return policy

@router.get("/policies", response_model=list[PolicyDocument])
async def get_policies():
    return policy_db.get_all_policies()

@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    success = policy_db.delete_policy(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "deleted", "id": policy_id}

@router.patch("/policies/{policy_id}/toggle")
async def toggle_policy(policy_id: str):
    # Find current status
    policies = policy_db.get_all_policies()
    target = next((p for p in policies if p.id == policy_id), None)
    
    if not target:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    new_status = not target.is_active
    updated_policy = policy_db.update_policy(policy_id, {"is_active": new_status})
    
    return updated_policy

@router.post("/evaluate", response_model=ComplianceReport)
async def evaluate_workflow(workflow: WorkflowDefinition):
    try:
        print(f"Evaluating workflow: {workflow.name}")
        
        # --- RAG Retrieval ---
        print("Generating query embedding...")
        query_vec = await gemini.create_embedding(workflow.description)
        
        relevant_chunks = []
        if query_vec:
            print("Searching vector store...")
            relevant_items = policy_db.search_relevant_policies(query_vec, top_k=5)
            relevant_chunks = [item['chunk_text'] for item in relevant_items]
            
            # Debug Print
            print("\n--- RELEVANT POLICY SECTIONS FOUND ---")
            for item in relevant_items:
                print(f"Doc: {item['policy_id']} | Chunk ID: {item['chunk_id']} | Score (Sim): N/A")
            print("--------------------------------------\n")
        
        # Fallback if no vectors (or empty DB) -> Use all active policies raw text (Legacy mode)
        # But wait, search_relevant_policies checks 'is_active'.
        # If relevant_chunks is empty, maybe we should just use full text of active policies?
        # Let's be smart: if we have NO relevant chunks, either query is weird or DB is empty.
        
        all_policies = policy_db.get_all_policies()
        active_policies = [p for p in all_policies if p.is_active]
        
        if not active_policies:
             raise HTTPException(status_code=400, detail="No active policies found. Please upload a policy first.")

        if relevant_chunks:
            # RAG Mode
            policy_context = "\n\n--- RELEVANT POLICY EXCERPTS ---\n" + "\n\n".join(relevant_chunks)
        else:
            # Fallback Mode (Full Text)
            print("No vector matches found. Falling back to full text analysis.")
            policy_context = "\n\n".join([f"Policy '{p.name}':\n{p.content}" for p in active_policies])
        
        # Real Gemini Analysis
        print("Calling Gemini...")
        print(f"Workflow Desc: {workflow.description[:100]}...")
        
        # Fetch current settings to perform dynamic analysis
        settings = policy_db.get_settings()
        
        try:
            analysis_json_str = await gemini.analyze_policy_conflict(policy_context, workflow.description, settings)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise HTTPException(status_code=503, detail=f"AI Service Unavailable: {str(e)}")
            
        print(f"Gemini Response Length: {len(analysis_json_str)}")
        
        # Clean JSON string (remove markdown fences if present - though handled by SDK mostly)
        # Robust cleaning using regex
        import re
        # Find the first JSON object or array
        match = re.search(r'(\{.*\}|\[.*\])', analysis_json_str, re.DOTALL)
        if match:
            clean_json = match.group(1)
        else:
            clean_json = analysis_json_str.strip()
            
        print(f"Cleaned JSON Preview: {clean_json[:100]}...")
        
        try:
            result_data = json.loads(clean_json)
            # Direct Pydantic validation
            report = ComplianceReport(**result_data)
            
            # Save Report to History
            policy_db.add_evaluation(report.model_dump())
            
            return report
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print(f"Bad JSON: {analysis_json_str}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format")
        except Exception as e:
            print(f"Validation Error: {e}")
            raise HTTPException(status_code=500, detail=f"Report Validation Failed: {str(e)}")

    except Exception as e:
        print(f"Server Error during evaluation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    return policy_db.get_dashboard_stats()

@router.get("/evaluate/export/{report_id}")
async def export_report_pdf(report_id: str):
    # 1. Fetch Report (For MVP, we use the in-memory list or mock based on ID)
    # The current persistence is simple. We'll search evaluations.
    all_evals = policy_db._evaluations # Access directly for speed in Hackathon
    
    # Simple match (In real app, use UUID)
    target_report = None
    if all_evals:
        target_report = all_evals[-1] # Default to latest for demo
    
    if not target_report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # 2. Generate PDF
    from services.report_generator import PDFGenerator
    from fastapi.responses import Response
    
    generator = PDFGenerator()
    try:
        pdf_bytes = generator.create_compliance_certificate(target_report)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=compliance_certificate_{report_id}.pdf"}
        )
    except Exception as e:
        print(f"PDF Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")

from services.sla_predictor import sla_predictor
from pydantic import BaseModel

class TelemetryData(BaseModel):
    service_id: str
    error_rate: float
    latency_ms: float
    request_count: int

@router.post("/telemetry/ingest")
async def ingest_telemetry(data: TelemetryData):
    sla_predictor.ingest_metrics(data.service_id, data.model_dump())
    return {"status": "ingested"}

@router.get("/telemetry/risk/{service_id}")
async def get_risk_prediction(service_id: str):
    return sla_predictor.predict_risk(service_id)

@router.get("/telemetry/history/{service_id}")
async def get_risk_history(service_id: str):
    return sla_predictor.get_risk_history(service_id)

@router.get("/dashboard/monitor")
async def get_monitor_data():
    return policy_db.get_monitor_data()

@router.get("/settings", response_model=PolicySettings)
async def get_settings():
    return policy_db.get_settings()

@router.post("/settings", response_model=PolicySettings)
async def update_settings(settings: PolicySettings):
    policy_db.save_settings(settings)
    return settings

@router.post("/simulate")
async def run_simulation():
    # In a real scenario, this would trigger a test eval against a known "bad" input
    # For the MVP, we mock the delay and return the structured result for the frontend
    import asyncio
    await asyncio.sleep(2) # Simulate processing time
    
    return {
        "status": "completed",
        "risks_found": 2,
        "details": [
            "Data Privacy Violation: PII detected in prompt template without encryption flag.",
            "Region Mismatch: Accessing EU user data from US server region."
        ]
    }

class SLAMetricsInput(BaseModel):
    latency_ms: float
    error_rate_percent: float
    uptime_percent: float
    support_response_time_hours: float
    service_name: str = "My AI Service"

@router.post("/sla/analyze")
async def analyze_sla_metrics(metrics: SLAMetricsInput):
    try:
        # Call Gemini
        analysis = await gemini.analyze_sla(metrics.model_dump())
        
        # Clean JSON
        import re
        match = re.search(r'(\{.*\}|\[.*\])', analysis, re.DOTALL)
        if match:
            clean_json = match.group(1)
        else:
            clean_json = analysis.strip()
            
        result = json.loads(clean_json)
        return result
    except Exception as e:
        print(f"SLA Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat_with_policy(request: ChatRequest):
    print(f"Chat Request: {request.message[:50]}...")
    
    # 1. Generate Context via RAG
    query_vec = await gemini.create_embedding(request.message)
    context_text = ""
    citations = []
    
    if query_vec:
        # Search relevant policies
        # Use top_k=3 to keep context concise
        relevant_items = policy_db.search_relevant_policies(query_vec, top_k=3)
        relevant_chunks = [item['chunk_text'] for item in relevant_items]
        
        # Build Citations
        for item in relevant_items:
            citations.append(f"Policy Doc: {item.get('policy_id', 'Unknown')}")
            
        if relevant_chunks:
            context_text = "\n\n".join(relevant_chunks)
            print(f"Chat Context: Found {len(relevant_chunks)} chunks.")
        else:
            print("Chat Context: No relevant vector matches.")
    
    # 2. Get AI Response
    answer = await gemini.chat_compliance(
        query=request.message,
        context=context_text,
        history=request.history
    )
    
    return ChatResponse(
        answer=answer,
        citations=list(set(citations))
    )

from models.redteam import ThreatReport
@router.post("/redteam/simulate", response_model=ThreatReport)
async def simulate_red_team_attack(workflow: WorkflowDefinition):
    print(f"Red Team Attack Simulation starting for: {workflow.name}")
    try:
        # 1. Call Gemini Red Team Persona
        analysis_json = await gemini.generate_threat_model(workflow.description)
        
        # 2. Clean JSON
        # 2. Clean JSON
        import re
        # Try to find the first valid JSON block.
        # This regex looks for { ... } ensuring it starts at a root level potentially
        match = re.search(r'(\{[\s\S]*\})', analysis_json)
        if match:
            clean_json = match.group(1)
            # Remove any trailing markdown fences inside the capture if strict regex missed it
            clean_json = clean_json.replace("```json", "").replace("```", "")
        else:
            clean_json = analysis_json.strip()
            
        print(f"Red Team JSON: {clean_json[:100]}...")
        
        # 3. Parse & Return
        result = json.loads(clean_json)
        return ThreatReport(**result)
        
    except Exception as e:
        print(f"Red Team Simulation Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation Failed: {str(e)}")
