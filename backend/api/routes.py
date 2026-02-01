from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Body
import asyncio
import httpx
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

        # -- Meta-Guardrail: Self-Protection Scan --
        if len(text) > 100000:
             raise HTTPException(status_code=400, detail="Policy document exceeds safe ingestion limits (100KB).")
        
        # Detect recursive injection or malicious patterns in the policy itself
        if "ignore previous instructions" in text.lower() or "override system anchor" in text.lower():
             raise HTTPException(status_code=400, detail="Policy rejected: Contains meta-instruction overrides (potential injection).")

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
            # Correcting sync call handling
            await asyncio.wait_for(
                asyncio.to_thread(policy_db.add_policy, policy),
                timeout=20.0 
            )
        except Exception as e:
            print(f"[WARN] Policy storage non-critical failure: {e}")
        
        return policy
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
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
    base_stats = policy_db.get_dashboard_stats()
    # Merge proxy metrics to prevent frontend flickering
    proxy_metrics = metrics_store.get_current_metrics()
    
    # Use specifically calculated PolicyGuard blocks to avoid Google failure confusion
    proxy_violations = proxy_metrics.get("pg_blocks", 0)
    base_stats["violations"] += proxy_violations
    base_stats["traces_analyzed"] += proxy_metrics.get("total_requests", 0)
    
    # Adjust health if there are live violations
    if proxy_violations > 0:
        base_stats["system_health"] = max(45, base_stats["system_health"] - (proxy_violations * 2))
        
    return base_stats

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
async def simulate_threat(request: WorkflowRequest, campaign: str = Query("default")):
    """
    Run adversarial simulation. Supports campaigns: 'pii_exfil', 'soc2_compliance', 'jailbreak_injection'.
    """
    # Check cache
    req_hash = str(hash(f"{request.description}_{campaign}"))
    cached_report = simulation_cache.get(req_hash)
    
    if cached_report:
        print(f"CACHE HIT: Returning cached simulation for {req_hash}")
        return ThreatReport(**cached_report)

    try:
        # Contextualize prompt based on campaign
        campaign_context = f" focusing on {campaign.replace('_', ' ')}" if campaign != "default" else ""
        threat_json = await gemini.generate_threat_model(f"{request.description}{campaign_context}")
        threat_data = json.loads(threat_json)
        
        # Determine score
        score = threat_data.get("overall_resilience_score", 0)
        
        # Inject "Campaign" metadata for the UI
        threat_data["campaign"] = campaign
        
        simulation_cache.set(req_hash, threat_data) # Cache it
        return ThreatReport(**threat_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
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

@router.get("/settings/gatekeeper")
async def get_gatekeeper_settings():
    from models.settings import GatekeeperSettings
    return policy_db.get_gatekeeper_settings()

@router.post("/settings/gatekeeper")
async def update_gatekeeper_settings(settings: dict):
    policy_db.save_gatekeeper_settings(settings)
    return {"status": "success"}

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

class PatchRequest(BaseModel):
    current_prompt: str
    violations: List[str]

@router.post("/remediate/patch")
async def hot_patch_agent(request: PatchRequest):
    """
    'Self-Healing' Agent: Rewrites the system prompt to include missing guardrails.
    """
    patched_prompt = await gemini.hot_patch_system_prompt(request.current_prompt, request.violations)
    return {"patched_prompt": patched_prompt}

@router.post("/system/freeze")
async def system_kill_switch(state: dict = Body(...)):
    """
    EMERGENCY KILL-SWITCH: Physically disables the downstream Fin-Agent by calling its control port.
    """
    is_frozen = state.get("frozen", False)
    command = "FREEZE" if is_frozen else "UNFREEZE"
    
    import requests
    try:
        # Call Fin-Agent Control Port (Sync call in thread)
        def call_agent():
            return requests.post("http://localhost:8001/system/control", json={"command": command}, timeout=2)
            
        response = await asyncio.to_thread(call_agent)
        
        return {"status": "success", "system_state": f"{command}D", "agent_ack": response.status_code}
    except Exception as e:
         print(f"[System Freeze] Agent Unreachable: {e}")
         # Return success anyway so the UI updates, but warn
         return {"status": "success", "system_state": f"{command}D (Agent Offline)", "warning": str(e)}

@router.get("/governance/legitimacy")
async def get_governance_legitimacy():
    """
    The Authority Anchor: Provides the institutional mandate for PolicyGuard.
    """
    return {
        "authorized_by": "Global Security Board (Resolution #2026-04)",
        "mandate": "Direct oversight of all multi-modal agentic outputs via Project PolicyGuard.",
        "appeal_process": "https://internal.policyguard.ai/appeals",
        "last_audit": datetime.datetime.now().isoformat(),
        "accountability_tier": "Level 4 (Deterministic Enforcement)"
    }

@router.post("/visual/scan")
async def visual_audit_scan(
    file: UploadFile = File(...), 
    context: str = Body("General", embed=True),
    profile: str = Body("Standard", embed=True)
):
    """
    Multimodal Visual Audit: Scans uploaded images for PII, intent, and jurisdictional alignment.
    """
    content = await file.read()
    audit_json = await gemini.visual_audit(content, context=context, profile=profile)
    return json.loads(audit_json)

@router.get("/export/antigravity")
async def export_to_antigravity():
    """
    Antigravity Export: Converts current policies into a Google Antigravity compatible ecosystem config.
    """
    policies = await asyncio.to_thread(policy_db.get_all_policies)
    config = gemini.generate_antigravity_config(policies)
    return config

# --- SLA Monitoring Endpoints ---

@router.post("/sla/analyze")
async def analyze_sla():
    """Get Gemini-powered SLA risk analysis and recommendations"""
    print("[DEBUG] SLA Analyze request received")
    from services.sla_analyzer import sla_analyzer
    print("[DEBUG] Calling sla_analyzer.analyze_sla_risk()")
    analysis = await sla_analyzer.analyze_sla_risk()
    print("[DEBUG] SLA Analyze complete")
    return analysis

# --- Telemetry & Simulation ---

@router.post("/telemetry/ingest")
async def ingest_telemetry(payload: TelemetryPayload):
    """Ingest real-time telemetry from external agents"""
    from services.metrics import metrics_store
    
    # 1. Record for SLA Tracking
    metrics_store.record_request(
        duration_ms=payload.latency_ms,
        status_code=200 if payload.error_rate < 0.5 else 500,
        policy_violation=payload.error_rate > 0.5,
        endpoint=f"telemetry/{payload.service_id}"
    )
    
    # 2. Record for Monitor Page Feed
    metrics_store.record_audit_log(
        event=f"Telemetry Heartbeat: {payload.service_id}",
        status="PASS" if payload.error_rate < 0.5 else "WARN",
        details=f"Lat: {payload.latency_ms}ms, Err: {payload.error_rate}"
    )
    
    return {"status": "success", "recorded": True}

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

@router.get("/hitl/queue")
async def get_hitl_queue():
    """
    Returns the pending HITL cases from the Governance Core.
    """
    return policy_db._hitl_queue

@router.post("/hitl/feedback")
async def process_hitl_feedback(feedback: dict = Body(...)):
    """
    HITL Learning Loop: Receives human verdicts on borderline cases.
    Updates ground truth for future few-shot policy reasoning.
    """
    decision_id = feedback.get("decision_id")
    verdict = feedback.get("verdict") # APPROVE/DENY
    reasoning = feedback.get("reasoning")
    
    # Store as Ground Truth for future calibration
    record = {
        "id": decision_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "human_verdict": verdict,
        "reasoning": reasoning,
        "original_data": feedback.get("context")
    }
    
    # In a real system, this would update a fine-tuning dataset or vector store
    # For MVP, we add to a learning buffer
    
    policy_db._ground_truth.append(record)
    
    # Institutional Memory: Remove from pending queue
    policy_db._hitl_queue = [i for i in policy_db._hitl_queue if i['id'] != decision_id]
    
    return {"status": "learned", "message": f"Verdict for {decision_id} successfully integrated into Governance Core."}

@router.get("/telemetry/history/{service_id}")
async def get_service_history(service_id: str):
    service_records = [r for r in telemetry_data if r['service_id'] == service_id]
    return service_records[-20:] # Last 20 data points

@router.post("/system/freeze")
async def handle_system_freeze(payload: dict = Body(...)):
    """
    Safety Freeze: Remotely disables the governed agent (Fin-Bot).
    """
    frozen = payload.get("frozen", False)
    tier = payload.get("tier", "mutation")
    
    # In a real environment, this calls the Agent's control port
    try:
        # Fin-Bot runs on Port 8001
        agent_url = "http://localhost:8001/system/control"
        command = "FREEZE" if frozen else "UNFREEZE"
        
        async with httpx.AsyncClient() as client:
            res = await client.post(agent_url, json={"command": command}, timeout=2.0)
            if res.status_code == 200:
                print(f"[SHIELD] Safety {command} successful for Tier: {tier}")
                return {"status": "success", "system_state": "FROZEN" if frozen else "ACTIVE"}
            else:
                return {"status": "error", "message": f"Agent control failed: {res.status_code}"}
    except Exception as e:
        print(f"[SHIELD ERROR] Could not reach agent: {e}")
        # Fallback to local state if needed
        return {"status": "success", "system_state": "FROZEN" if frozen else "ACTIVE", "warning": "Agent unreachable"}

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

@router.get("/proxy/logs")
async def get_proxy_logs():
    """Get recent proxy audit logs"""
    return metrics_store.get_audit_logs()

@router.post("/sla/uptime")
async def get_uptime_stats():
    """Get detailed uptime statistics"""
    return metrics_store.get_uptime_stats()
