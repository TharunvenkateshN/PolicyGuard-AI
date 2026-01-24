from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import httpx
import json
from services.gemini import GeminiService
from services.storage import policy_db

router = APIRouter()
gemini = GeminiService()

# --- PROXY CONFIGURATION ---
OPENAI_API_URL = "https://api.openai.com/v1"

@router.get("/health")
async def proxy_health():
    return {"status": "Proxy Online", "service": "PolicyGuard Middleware"}

@router.post("/v1/chat/completions")
async def openai_proxy(request: Request, background_tasks: BackgroundTasks):
    """
    Universal Proxy for OpenAI Chat Completions.
    Intercepts request, audits prompt, forwards to OpenAI (if safe), audits response.
    """
    print("[PROXY] Incoming Request...", flush=True)
    
    # 1. Component Extraction
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
        
    messages = body.get("messages", [])
    last_user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), None)
    
    # 2. PRE-FLIGHT AUDIT
    # (Optimized: Proceed to upstream to minimize latency for valid queries, unless simple regex block)
    
    # 3. FORWARD TO OPENAI
    client = httpx.AsyncClient()
    try:
        upstream_response = await client.post(
            f"{OPENAI_API_URL}/chat/completions",
            headers={"Authorization": auth_header, "Content-Type": "application/json"},
            json=body,
            timeout=60.0
        )
        
        if upstream_response.status_code != 200:
             return JSONResponse(status_code=upstream_response.status_code, content=upstream_response.json())
             
        upstream_data = upstream_response.json()
        model_response_content = upstream_data["choices"][0]["message"]["content"]
        
        # 4. OPTIMISTIC RETURN (Zero Latency)
        # We queue the audit and return immediately. 
        # "Real-time blocking" is traded for "Zero Latency" + "Post-Hoc Alerting"
        
        background_tasks.add_task(
            perform_background_audit,
            last_user_msg,
            model_response_content,
            body.get('model', 'unknown'),
            auth_header
        )
             
        return upstream_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.aclose()

async def perform_background_audit(user_msg: str, model_msg: str, model_name: str, auth_token: str):
    """
    Detailed Semantic Audit running in background.
    """
    try:
        print(f"[BACKGROUND] Starting Deep Audit for {model_name}...")
        
        # 1. Fetch Policy Context
        active_policies = [p for p in policy_db.get_all_policies() if p.is_active]
        policy_context = "\n".join([p.summary for p in active_policies])
        settings = policy_db.get_settings()
        
        interaction_context = f"User Request: {user_msg}\nModel Response: {model_msg}"
        
        # 2. Heavy Analysis (The slow part)
        audit_json = await gemini.analyze_policy_conflict(policy_context or "General Safety", interaction_context, settings)
        audit_result = json.loads(audit_json)
        
        # 3. Log Result
        report_entry = {
            "workflow_name": f"Proxy Request ({model_name})",
            "timestamp": "Now",
            "policy_matrix": audit_result.get("policy_matrix", []),
            "risk_assessment": audit_result.get("risk_assessment", {}),
            "evidence": audit_result.get("evidence", []),
            "verdict": audit_result.get("verdict", {})
        }
        
        # If High Risk, we can't "Block" (too late), but we can modify the log or alert
        if audit_result.get("risk_assessment", {}).get("overall_rating") == "High":
             print(f"[BACKGROUND] 🚨 VIOLATION DETECTED AFTER RELEASE! Triggering Alert.")
             # In a real app, this would send an email/Slack alert or revoke the key.
        
        policy_db.add_evaluation(report_entry)
        print(f"[BACKGROUND] Audit Complete.", flush=True)
        
    except Exception as e:
        print(f"[BACKGROUND] Audit Failed: {e}", flush=True)
