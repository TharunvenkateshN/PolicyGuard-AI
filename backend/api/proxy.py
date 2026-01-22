from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import json
import os
from services.gemini import GeminiService
from services.storage import policy_db
from models.redteam import ThreatReport

router = APIRouter()
gemini = GeminiService()

# --- PROXY CONFIGURATION ---
OPENAI_API_URL = "https://api.openai.com/v1"
ANTHROPIC_API_URL = "https://api.anthropic.com/v1"

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
    
    # 2. PRE-FLIGHT AUDIT (Fast)
    # For now, we proceed to upstream to minimize latency for valid queries
    
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
        
        # 4. POST-FLIGHT AUDIT (Critical Path)
        # We await the audit because we must BLOCK if high risk.
        active_policies = [p for p in policy_db.get_all_policies() if p.is_active]
        policy_context = "\n".join([p.summary for p in active_policies])
        settings = policy_db.get_settings()
        
        interaction_context = f"User Request: {last_user_msg}\nModel Response: {model_response_content}"
        
        # This is the heavy step. In a real highly-optimized app, this might be a specialized model.
        # We await it to ensure safety.
        audit_json = await gemini.analyze_policy_conflict(policy_context or "General Safety", interaction_context, settings)
        audit_result = json.loads(audit_json)
        
        # 5. ENFORCEMENT
        if audit_result.get("risk_assessment", {}).get("overall_rating") == "High":
             # Record violation in background
             background_tasks.add_task(log_transaction, body.get('model'), audit_result)
             
             return JSONResponse(
                 status_code=403,
                 content={
                     "error": {
                         "message": "PolicyGuard: Response blocked due to policy violation.",
                         "type": "policy_violation",
                         "details": audit_result.get("verdict", {}).get("approval_conditions", [])
                     }
                 }
             )

        # 6. LOGGING (Background)
        # Offload the DB write to background task to return response faster
        background_tasks.add_task(log_transaction, body.get('model'), audit_result)
             
        return upstream_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.aclose()

def log_transaction(model: str, audit_result: dict):
    """Background task to log transaction to DB"""
    try:
        report_entry = {
            "workflow_name": f"Proxy Request ({model})",
            "timestamp": "Now",
            "policy_matrix": audit_result.get("policy_matrix", []),
            "risk_assessment": audit_result.get("risk_assessment", {}),
            "evidence": audit_result.get("evidence", []),
            "verdict": audit_result.get("verdict", {})
        }
        policy_db.add_evaluation(report_entry)
        print(f"[BACKGROUND] Transaction logged.", flush=True)
    except Exception as e:
        print(f"[BACKGROUND] Error logging transaction: {e}", flush=True)
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream API Error: {exc}")
    except Exception as e:
        print(f"Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.aclose()

