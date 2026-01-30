from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Body
import asyncio
from config import settings
from fastapi.responses import StreamingResponse, FileResponse
from models.policy import PolicyDocument, WorkflowDefinition, ComplianceReport, DataInteractionMap, AISystemSpec, RiskScore, DeploymentVerdict, EvidenceTrace, Recommendation
from models.chat import ChatRequest, ChatResponse
from models.settings import PolicySettings
from models.redteam import ThreatReport
from services.ingest import PolicyIngestor
from services.gemini import GeminiService
from services.storage import policy_db
import json
import uuid
import datetime
import time
from pydantic import BaseModel
from typing import List, Optional
from utils.cache import SimpleTTLCache

router = APIRouter()
gemini = GeminiService()
ingestor = PolicyIngestor()

# --- Cache (Replaces global dict) ---
# 500 items max, 1 hour TTL for simulations
simulation_cache = SimpleTTLCache(max_size=500, default_ttl=3600)

# --- Telemetry In-Memory Store for Demo ---
telemetry_data = [] # List of {service_id, timestamp, error_rate, latency_ms, risk_score}

# --- Models ---
class RemediationRequest(BaseModel):
    original_text: str
    violations: list[str]
    doc_type: str = "PRD"

class CodeGenRequest(BaseModel):
    policy_summary: str
    language: str = "python"

class TelemetryPayload(BaseModel):
    service_id: str
    error_rate: float
    latency_ms: int
    request_count: int


# --- Evaluation & Red Team ---

class WorkflowRequest(BaseModel):
    name: str
    description: str

# --- Policies ---

@router.get("/policies", response_model=List[PolicyDocument])
async def get_policies():
    return await asyncio.to_thread(policy_db.get_all_policies)

@router.post("/policies/upload")
async def upload_policy(file: UploadFile = File(...)):
    try:
        content = await file.read()
        try:
            # Run CPU-bound extraction in thread to avoid blocking loop
            text = await asyncio.wait_for(
                asyncio.to_thread(ingestor.extract_text, content, file.filename),
                timeout=20.0
            )
        except asyncio.TimeoutError:
             raise HTTPException(status_code=408, detail="File processing timed out (20s). Try a smaller file.")
        except ValueError as ve:
             raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=400, detail="Could not read file. Ensure it is a valid text, markdown, PDF, or DOCX file.")
        
        # 1. Summarize with timeout to prevent hanging
        try:
            summary = await asyncio.wait_for(
                gemini.summarize_policy(text),
                timeout=30.0  # Increased to 30s
            )
        except asyncio.TimeoutError:
            print("[WARN] Summarization timed out after 30s")
            summary = "Summary unavailable (timeout)"
        except Exception as e:
            print(f"[WARN] Summarization failed: {e}")
            summary = f"Summary unavailable: {str(e)[:50]}"
        
        # 2. Store Policy with timeout
        pid = str(uuid.uuid4())
        policy = PolicyDocument(
            id=pid,
            name=file.filename or "Unnamed Policy",
            content=text,
            summary=summary,
            is_active=True
        )
        try:
            await asyncio.wait_for(
                asyncio.to_thread(policy_db.add_policy, policy),
                timeout=20.0 # Increased to 20s
            )
        except asyncio.TimeoutError:
            print("[WARN] Policy save to Firebase timed out, but policy added to memory")
        except Exception as e:
            print(f"[WARN] Policy save to Firebase failed: {e}")
        
        # 3. Create Chunks & Vectors for RAG with timeout
        try:
            chunks = await asyncio.wait_for(
                asyncio.to_thread(ingestor.chunk_policy, text),
                timeout=10.0
            ) 
            
            vectors = []
            chunk_start_time = time.time()
            for chunk in chunks:
                if time.time() - chunk_start_time > 45: # Max 45s for embeddings
                     print("[WARN] Embedding generation time limit reached (45s)")
                     break
                     
                try:
                    vec = await asyncio.wait_for(
                        gemini.create_embedding(chunk),
                        timeout=10.0
                    )
                    vectors.append(vec)
                except asyncio.TimeoutError:
                    print(f"[WARN] Embedding generation timed out for chunk")
                    break  # Skip remaining chunks if one times out
                except Exception as e:
                    print(f"[WARN] Embedding generation failed: {e}")
                    break
            
            if vectors:  # Only save if we have some vectors
                try:
                    # Use asyncio.to_thread for sync Firebase call with timeout
                    await asyncio.wait_for(
                        asyncio.to_thread(policy_db.add_policy_vectors, pid, chunks[:len(vectors)], vectors),
                        timeout=20.0
                    )
                except asyncio.TimeoutError:
                    print("[WARN] Vector storage timed out")
                except Exception as e:
                    print(f"[WARN] Vector storage failed: {e}")
        except asyncio.TimeoutError:
            print("[WARN] Chunking timed out")
        except Exception as e:
            print(f"[WARN] RAG processing failed: {e}")
        
        return policy
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    # Use to_thread for sync DB operations
    success = await asyncio.to_thread(policy_db.delete_policy, policy_id)
    if success:
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Policy not found")

@router.post("/policies/{policy_id}/toggle")
async def toggle_policy(policy_id: str):
    policies = policy_db.get_all_policies()
    policy = next((p for p in policies if p.id == policy_id), None)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Use to_thread for sync DB operations
    updated = await asyncio.to_thread(policy_db.update_policy, policy_id, {"is_active": not policy.is_active})
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
        # 1. RAG: Search relevant policies (CPU Bound - Run in Thread)
        query_vec = await gemini.create_embedding(request.description)
        relevant_chunks = await asyncio.to_thread(
            policy_db.search_relevant_policies, 
            query_vec, 
            top_k=10
        )
        
        # 2. Context Construction
        context = "\n\n".join([c['chunk_text'] for c in relevant_chunks])
        if not context:
            # Fallback to all policy summaries if no direct matches
            context = "\n".join([p.summary for p in policy_db.get_all_policies() if p.is_active])
            
        # 3. Gemini Audit
        user_settings = policy_db.get_settings()
        report_json = await gemini.analyze_policy_conflict(context or "General Safety", request.description, user_settings)
        report_data = json.loads(report_json)
        
        # 4. Generate Forensic Metadata
        import hashlib
        report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.datetime.now().isoformat()
        
        # Create a simplified forensic digest for the hackathon MVP
        policy_hash = hashlib.sha256(context.encode()).hexdigest()[:12]
        workflow_hash = hashlib.sha256(request.description.encode()).hexdigest()[:12]
        combined_payload = f"{policy_hash}{workflow_hash}{timestamp}"
        combined_digest = hashlib.sha256(combined_payload.encode()).hexdigest()
        
        report_data.update({
            "report_id": report_id,
            "timestamp": timestamp,
            "forensic_digest": {
                "policy_hash": policy_hash,
                "workflow_hash": workflow_hash,
                "model_version": settings.GEMINI_MODEL,
                "prompt_hash": "audit-v2.1",
                "combined_digest": combined_digest
            }
        })

        # Add workflow name if missing
        if "workflow_name" not in report_data:
            report_data["workflow_name"] = request.name
            
        # 5. Store evaluation in history
        await asyncio.to_thread(policy_db.add_evaluation, report_data)
        
        return ComplianceReport(**report_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/redteam/simulate", response_model=ThreatReport)
async def simulate_threat(request: WorkflowRequest):
    # Check cache
    req_hash = str(hash(request.description))
    cached_report = simulation_cache.get(req_hash)
    
    if cached_report:
        print(f"CACHE HIT: Returning cached simulation for {req_hash}")
        return ThreatReport(**cached_report)

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
        
        simulation_cache.set(req_hash, threat_data) # Cache it
        return ThreatReport(**threat_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/redteam/attack")
async def redteam_attack(request: dict = Body(...)):
    system_spec = request.get("system_spec", {})
    policy_matrix = request.get("policy_matrix", [])
    
    return StreamingResponse(
        gemini.generate_redteam_attack_stream(system_spec, policy_matrix),
        media_type="text/event-stream"
    )

@router.post("/analyze-workflow-doc")
async def analyze_workflow_doc(file: UploadFile = File(...)):
    try:
        content = await file.read()
        try:
            # Run CPU-bound extraction in thread
            text = await asyncio.wait_for(
                asyncio.to_thread(ingestor.extract_text, content, file.filename),
                timeout=20.0
            ) 
        except ValueError as ve:
             raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            print(f"Extraction Error: {e}") 
            raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
            
        analysis_json = await gemini.analyze_workflow_document_text(text)
        return json.loads(analysis_json)
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Workflow Analysis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/evaluate/export/latest")
async def export_latest_report():
    return {"message": "Export feature coming soon to production. Use UI Print for now."}

# --- Settings ---

@router.get("/settings", response_model=PolicySettings)
async def get_settings():
    return await asyncio.to_thread(policy_db.get_settings)

@router.post("/settings")
async def update_settings(settings: PolicySettings):
    await policy_db.save_settings(settings)
    return {"status": "saved"}

# --- Chat & Remediation ---

@router.post("/chat", response_model=ChatResponse)
async def chat_compliance(request: ChatRequest):
    try:
        # 1. RAG Context
        query_vec = await gemini.create_embedding(request.message)
        relevant_chunks = await asyncio.to_thread(
            policy_db.search_relevant_policies,
            query_vec,
            top_k=5
        )
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
async def analyze_sla():
    """Get Gemini-powered SLA risk analysis and recommendations"""
    from services.sla_analyzer import sla_analyzer
    analysis = await sla_analyzer.analyze_sla_risk()
    return analysis

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


# --- SLA Monitoring Endpoints ---

from services.metrics import metrics_store

@router.post("/sla/metrics")
async def get_sla_metrics():
    """Get current SLA metrics snapshot"""
    return metrics_store.get_current_metrics()

@router.post("/sla/history")
async def get_sla_history(hours: int = Body(24, embed=True)):
    """Get historical SLA metrics"""
    return {
        "period_hours": hours,
        "data_points": metrics_store.get_history(hours=hours)
    }

@router.post("/sla/uptime")
async def get_uptime_stats():
    """Get detailed uptime statistics"""
    return metrics_store.get_uptime_stats()
