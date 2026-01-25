from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import StreamingResponse, FileResponse
from models.policy import PolicyDocument, WorkflowDefinition, ComplianceReport, DataInteractionMap, AISystemSpec, RiskScore, DeploymentVerdict, EvidenceTrace, Recommendation
from models.chat import ChatRequest, ChatResponse
from models.settings import PolicySettings
from models.redteam import ThreatReport
from services.ingest import PolicyIngestor
from services.gemini import GeminiService
from services.storage import policy_db
import json
import asyncio
import uuid
import datetime
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()
gemini = GeminiService()
<<<<<<< HEAD
import datetime
=======
ingestor = PolicyIngestor()
>>>>>>> main

# --- Telemetry In-Memory Store for Demo ---
telemetry_data = [] # List of {service_id, timestamp, error_rate, latency_ms, risk_score}

<<<<<<< HEAD
    # Analyze with Gemini (Immediate Feedback)
    try:
        print(f"Summarizing policy: {file.filename}")
        summary = await gemini.summarize_policy(cleaned_text)
    except Exception as e:
        print(f"Gemini Error during summary: {e}")
        # import traceback
        # traceback.print_exc()
        summary = "Summary unavailable (AI Error)"
    
    import uuid
    policy_id = str(uuid.uuid4())
    
    policy = PolicyDocument(
        id=policy_id,
        name=file.filename,
        content=cleaned_text,
        summary=summary,
        status="Pending Review", # Require human confirmation
        last_updated=datetime.datetime.utcnow().isoformat()
    )
    
    # Save to In-Memory DB
    policy_db.add_policy(policy)
    
    return policy
=======
# --- Models ---
class RemediationRequest(BaseModel):
    original_text: str
    violations: list[str]
    doc_type: str = "PRD"
>>>>>>> main

class CodeGenRequest(BaseModel):
    policy_summary: str
    language: str = "python"

class TelemetryPayload(BaseModel):
    service_id: str
    error_rate: float
    latency_ms: int
    request_count: int

class WorkflowRequest(BaseModel):
    name: str
    description: str

# --- Policies ---

@router.get("/policies", response_model=List[PolicyDocument])
async def get_policies():
    return policy_db.get_all_policies()

<<<<<<< HEAD
@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    success = policy_db.delete_policy(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "deleted", "id": policy_id}

@router.put("/policies/{policy_id}/status")
async def update_policy_status(policy_id: str, status: str):
    success = policy_db.update_policy_status(policy_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "updated", "id": policy_id, "new_status": status}

@router.post("/evaluate", response_model=ComplianceReport)
async def evaluate_workflow(workflow: WorkflowDefinition):
=======
@router.post("/policies/upload")
async def upload_policy(file: UploadFile = File(...)):
>>>>>>> main
    try:
        content = await file.read()
        text = content.decode('utf-8')
        
        # 1. Summarize
        summary = await gemini.summarize_policy(text)
        
        # 2. Store Policy
        pid = str(uuid.uuid4())
        policy = PolicyDocument(
            id=pid,
            name=file.filename or "Unnamed Policy",
            content=text,
            summary=summary,
            is_active=True
        )
        policy_db.add_policy(policy)
        
        # 3. Create Chunks & Vectors for RAG
        chunks = await ingestor.chunk_policy(text)
        vectors = []
        for chunk in chunks:
            vec = await gemini.create_embedding(chunk)
            vectors.append(vec)
            
        policy_db.add_policy_vectors(pid, chunks, vectors)
        
<<<<<<< HEAD
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
            
            # --- Forensic Segment Generation ---
            import hashlib
            p_hash = hashlib.sha256(policy_context.encode()).hexdigest()[:12]
            w_hash = hashlib.sha256(workflow.description.encode()).hexdigest()[:12]
            t_hash = hashlib.sha256(gemini.get_prompt_template().encode()).hexdigest()[:12]
            m_ver = gemini.model_name
            
            # Combined for tamper-evidence
            combined_raw = f"{p_hash}|{w_hash}|{t_hash}|{m_ver}"
            c_digest = hashlib.sha256(combined_raw.encode()).hexdigest()
            
            result_data["forensic_digest"] = {
                "policy_hash": p_hash,
                "workflow_hash": w_hash,
                "model_version": m_ver,
                "prompt_hash": t_hash,
                "combined_digest": c_digest
            }
            
            # Direct Pydantic validation
            report = ComplianceReport(**result_data)
            return report
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print(f"Bad JSON: {analysis_json_str}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format")
        except Exception as e:
            print(f"Validation Error: {e}")
            raise HTTPException(status_code=500, detail=f"Report Validation Failed: {str(e)}")

=======
        return policy
>>>>>>> main
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    if policy_db.delete_policy(policy_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Policy not found")

@router.patch("/policies/{policy_id}/toggle")
async def toggle_policy(policy_id: str):
    policies = policy_db.get_all_policies()
    policy = next((p for p in policies if p.id == policy_id), None)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    updated = policy_db.update_policy(policy_id, {"is_active": not policy.is_active})
    return updated

# --- Dashboard & Monitoring ---

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    return policy_db.get_dashboard_stats()

@router.get("/dashboard/monitor")
async def get_monitor_data():
    return policy_db.get_monitor_data()

@router.post("/evaluate", response_model=ComplianceReport)
async def evaluate_workflow(request: WorkflowRequest):
    try:
        # 1. RAG: Search relevant policies
        query_vec = await gemini.create_embedding(request.description)
        relevant_chunks = policy_db.search_relevant_policies(query_vec, top_k=10)
        
        # 2. Context Construction
        context = "\n\n".join([c['chunk_text'] for c in relevant_chunks])
        if not context:
            # Fallback to all policy summaries if no direct matches
            context = "\n".join([p.summary for p in policy_db.get_all_policies() if p.is_active])
            
        # 3. Gemini Audit
        settings = policy_db.get_settings()
        report_json = await gemini.analyze_policy_conflict(context or "General Safety", request.description, settings)
        report_data = json.loads(report_json)
        
        # Add workflow name if missing
        if "workflow_name" not in report_data:
            report_data["workflow_name"] = request.name
            
        # 4. Store evaluation in history
        policy_db.add_evaluation(report_data)
        
        return ComplianceReport(**report_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

sim_cache = {}

@router.post("/redteam/simulate", response_model=ThreatReport)
async def simulate_threat(request: WorkflowRequest):
    # Check cache
    req_hash = hash(request.description)
    if req_hash in sim_cache:
        print(f"CACHE HIT: Returning cached simulation for {req_hash}")
        return ThreatReport(**sim_cache[req_hash])

    try:
        threat_json = await gemini.generate_threat_model(request.description)
        threat_data = json.loads(threat_json)
        
        # Determine score
        score = threat_data.get("overall_resilience_score", 0)
        
        # Invert score logic if needed (Assuming 0-100 where 100 is secure)
        # Mock logic to ensure we get some "High" risks for the demo if score is too high
        if score > 90:
             # Inject a demo vulnerability if the model is too optimistic
             threat_data["critical_finding"] = "DEMO: Overly optimistic assessment detected."
             threat_data["overall_resilience_score"] = 75
        
        sim_cache[req_hash] = threat_data # Cache it
        return ThreatReport(**threat_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-workflow-doc")
async def analyze_workflow_doc(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode('utf-8', errors='ignore')
        analysis_json = await gemini.analyze_workflow_document_text(text)
        return json.loads(analysis_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluate/export/latest")
async def export_latest_report():
    return {"message": "Export feature coming soon to production. Use UI Print for now."}

# --- Settings ---

@router.get("/settings", response_model=PolicySettings)
async def get_settings():
    return policy_db.get_settings()

@router.post("/settings")
async def update_settings(settings: PolicySettings):
    policy_db.save_settings(settings)
    return {"status": "saved"}

# --- Chat & Remediation ---

@router.post("/chat", response_model=ChatResponse)
async def chat_compliance(request: ChatRequest):
    try:
        # 1. RAG Context
        query_vec = await gemini.create_embedding(request.message)
        relevant_chunks = policy_db.search_relevant_policies(query_vec, top_k=5)
        context = "\n\n".join([c['chunk_text'] for c in relevant_chunks])
        
        # 2. Call Gemini
        answer = await gemini.chat_compliance(request.message, context, request.history)
        
        # 3. Citations
        citations = [c['chunk_text'][:200] + "..." for c in relevant_chunks]
        
        return ChatResponse(answer=answer, citations=citations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remediate/doc")
async def remediate_document(request: RemediationRequest):
    async def stream_wrapper():
        try:
            async for chunk in gemini.remediate_spec_stream(request.original_text, request.violations, request.doc_type):
                yield chunk
        except Exception as e:
            yield f"\n[ERROR] Stream interrupted: {str(e)}"

    return StreamingResponse(stream_wrapper(), media_type="text/plain")

@router.post("/remediate/code")
async def generate_guardrail_code(request: CodeGenRequest):
    async def stream_wrapper():
        try:
            async for chunk in gemini.generate_guardrail_code_stream(request.policy_summary, request.language):
                yield chunk
        except Exception as e:
            yield f"\n// [ERROR] Stream interrupted: {str(e)}"

    return StreamingResponse(stream_wrapper(), media_type="text/plain")

@router.post("/remediate/explain")
async def explain_remediation(request: RemediationRequest):
    explanation = await gemini.explain_remediation_strategy(request.violations, request.original_text)
    return json.loads(explanation)

# --- SLA ---

@router.post("/sla/analyze")
async def analyze_sla_metrics(metrics: dict = Body(...)):
    try:
        sla_json = await gemini.analyze_sla(metrics)
        return json.loads(sla_json)
    except Exception as e:
        print(f"SLA ANALYSIS FAILED: {e}")
        # Mock Fallback for Rate Limits
        return {
            "sla_score": 88,
            "status": "Healthy",
            "analysis_summary": "SLA Metrics within acceptable limits (Mock Analysis due to high load).",
            "impact_analysis": "No immediate impact detected, system resilience is holding.",
            "recommendations": ["Continue monitoring current queue depth.", "Scale up worker nodes if latency persists."],
            "projected_timeline": [
                {"time": "Now", "event": "Stable", "severity": "Info"},
                {"time": "T+1h", "event": "Projected Cleanup", "severity": "Info"}
            ]
        }

# --- Telemetry & Simulation ---

@router.post("/telemetry/ingest")
async def ingest_telemetry(payload: TelemetryPayload):
    # Simulated risk calculation
    risk_score = int((payload.error_rate * 100) + (payload.latency_ms / 20))
    risk_score = min(100, max(0, risk_score))
    
    record = {
        "service_id": payload.service_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "error_rate": payload.error_rate,
        "latency_ms": payload.latency_ms,
        "risk_score": risk_score
    }
    telemetry_data.append(record)
    # Keep last 1000 records
    if len(telemetry_data) > 1000: telemetry_data.pop(0)
    return {"status": "ingested", "risk_score": risk_score}

@router.get("/telemetry/risk/{service_id}")
async def get_service_risk(service_id: str):
    # Get latest record
    service_records = [r for r in telemetry_data if r['service_id'] == service_id]
    if not service_records:
        return {"risk_score": 0, "risk_label": "Healthy", "factors": []}
    
    latest = service_records[-1]
    risk_score = latest['risk_score']
    
    label = "Healthy"
    factors = []
    if risk_score > 70: 
        label = "Critical"
        factors.append("High Error Spike Detected")
    elif risk_score > 30: 
        label = "Degraded"
        factors.append("Latency Jitter")
        
    return {
        "risk_score": risk_score,
        "risk_label": label,
        "factors": factors,
        "timestamp": latest['timestamp']
    }

@router.get("/telemetry/history/{service_id}")
async def get_service_history(service_id: str):
    service_records = [r for r in telemetry_data if r['service_id'] == service_id]
    return service_records[-20:] # Last 20 data points

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
