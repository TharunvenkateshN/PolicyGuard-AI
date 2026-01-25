from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from models.policy import PolicyDocument, WorkflowDefinition, ComplianceReport
from models.chat import ChatRequest, ChatResponse
from models.settings import PolicySettings
from services.ingest import PolicyIngestor
from services.gemini import GeminiService
from services.storage import policy_db
import json
import asyncio
from pydantic import BaseModel


router = APIRouter()
gemini = GeminiService()

class RemediationRequest(BaseModel):
    original_text: str
    violations: list[str]
    doc_type: str = "PRD" # Default to PRD

class CodeGenRequest(BaseModel):
    policy_summary: str
    language: str = "python"

class EvaluationRequest(BaseModel):
    name: str
    description: str

@router.post("/analyze-workflow-doc")
async def analyze_workflow_doc(file: UploadFile = File(...)):
    try:
        content_bytes = await file.read()
        text_content = content_bytes.decode("utf-8", errors="ignore")
        
        # Call Gemini logic to extract technical specs
        analysis_json = await gemini.analyze_workflow_document_text(text_content)
        return json.loads(analysis_json)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
async def evaluate_workflow(request: EvaluationRequest):
    try:
        # 1. Fetch active policies
        active_policies = [p for p in policy_db.get_all_policies() if p.is_active]
        policy_context = "\n\n".join([f"POLICY: {p.name}\n{p.content}" for p in active_policies])
        
        if not policy_context:
            policy_context = "No specific policies provided. Use general ethical AI guidelines."
            
        settings = policy_db.get_settings()
        
        # 2. Run analysis
        report_json = await gemini.analyze_policy_conflict(policy_context, request.description, settings)
        report_data = json.loads(report_json)
        
        # 3. Store in history for dashboard
        policy_db.add_evaluation({
            "workflow_name": request.name,
            "timestamp": "Now", # In a real app use datetime
            "policy_matrix": report_data.get("policy_matrix", []),
            "risk_assessment": report_data.get("risk_assessment", {}),
            "evidence": report_data.get("evidence", []),
            "verdict": report_data.get("verdict", {})
        })
        
        return report_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/redteam/simulate")
async def redteam_simulate(request: EvaluationRequest):
    try:
        threat_model_json = await gemini.generate_threat_model(request.description)
        return json.loads(threat_model_json)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remediate/doc")
async def remediate_document(request: RemediationRequest):
    async def stream_wrapper():
        try:
            async for chunk in gemini.remediate_spec_stream(request.original_text, request.violations, request.doc_type):
                yield chunk
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Stream Error (Doc): {e}")
            yield f"\n[ERROR] Stream interrupted: {str(e)}"

    return StreamingResponse(stream_wrapper(), media_type="text/plain")

@router.post("/remediate/code")
async def generate_guardrail_code(request: CodeGenRequest):
    async def stream_wrapper():
        try:
            async for chunk in gemini.generate_guardrail_code_stream(request.policy_summary, request.language):
                yield chunk
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Stream Error (Code): {e}")
            yield f"\n// [ERROR] Stream interrupted: {str(e)}"

    return StreamingResponse(stream_wrapper(), media_type="text/plain")

@router.post("/remediate/explain")
async def explain_remediation(request: RemediationRequest):
    try:
        explanation = await gemini.explain_remediation_strategy(request.violations, request.original_text)
        return json.loads(explanation)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Explanation Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat_with_policies(request: ChatRequest):
    try:
        # 1. Generate Embedding
        query_vec = await gemini.create_embedding(request.message)
        
        # 2. RAG Retrieval
        relevant_chunks = policy_db.search_relevant_policies(query_vec, top_k=3)
        context_text = "\n\n".join([c['chunk_text'] for c in relevant_chunks])
        
        # 3. Chat with LLM
        answer = await gemini.chat_compliance(request.message, context_text, request.history)
        
        # 4. Citations
        citations = list(set([f"Policy: {c['policy_id']}" for c in relevant_chunks]))
        
        return ChatResponse(answer=answer, citations=citations)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# --- POLICY MANAGEMENT ---

@router.get("/policies", response_model=list[PolicyDocument])
async def list_policies():
    return policy_db.get_all_policies()

@router.post("/policies/upload")
async def upload_policy(file: UploadFile = File(...)):
    try:
        content_bytes = await file.read()
        text_content = content_bytes.decode("utf-8", errors="ignore")
        
        # 1. Ingest
        ingestor = PolicyIngestor()
        clean_text = await ingestor.ingest_text(file.filename, text_content)
        
        # 2. Summarize (LLM)
        summary = await gemini.summarize_policy(clean_text)
        
        # 3. Create Policy Object
        import uuid
        import datetime
        policy_id = str(uuid.uuid4())
        
        new_policy = PolicyDocument(
            id=policy_id,
            name=file.filename,
            content=clean_text,
            summary=summary,
            source="Upload",
            version="1.0",
            timestamp=datetime.datetime.now().isoformat(),
            is_active=True
        )
        
        # 4. Chunk & Embed
        chunks = await ingestor.chunk_policy(clean_text)
        vectors = []
        for chunk in chunks:
            vec = await gemini.create_embedding(chunk)
            vectors.append(vec)
            
        # 5. Save
        policy_db.add_policy(new_policy)
        policy_db.add_policy_vectors(policy_id, chunks, vectors)
        
        return new_policy
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    success = policy_db.delete_policy(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "deleted"}

@router.patch("/policies/{policy_id}/toggle")
async def toggle_policy(policy_id: str):
    policy = next((p for p in policy_db.get_all_policies() if p.id == policy_id), None)
    if not policy:
         raise HTTPException(status_code=404, detail="Policy not found")
    
    updated = policy_db.update_policy(policy_id, {"is_active": not policy.is_active})
    return updated

# --- DASHBOARD & MONITORING ---

@router.get("/settings", response_model=PolicySettings)
async def get_settings():
    return policy_db.get_settings()

@router.post("/settings")
async def save_settings(settings: PolicySettings):
    policy_db.save_settings(settings)
    return {"status": "saved"}

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    return policy_db.get_dashboard_stats()

@router.get("/monitor/traces")
async def get_traces():
    data = policy_db.get_monitor_data()
    return data["traces"]

@router.post("/simulate")
async def run_simulation():
    # Mock Simulation Logic
    import random
    
    # Simulate processing time
    await asyncio.sleep(2)
    
    risks_found = random.randint(1, 5)
    risk_types = [
        "Data Sovereignty Violation: US data found in EU storage",
        "PII Exposure: Unmasked email in prompt logs",
        "Guardrail Bypass: Jailbreak attempt detected",
        "Latency Spike: Response time > 2000ms",
        "Model Hallucination: Fact-check failed"
    ]
    
    details = random.sample(risk_types, risks_found)
    
    return {
        "risks_found": risks_found,
        "details": details
    }
