from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import httpx
import json
import time
from services.gemini import GeminiService
from services.policy_engine import policy_engine
from services.metrics import metrics_store
from config import settings

router = APIRouter()
gemini = GeminiService()

@router.get("/health")
async def proxy_health():
    return {"status": "Proxy Online", "service": "PolicyGuard Zero-Trust Interceptor"}

@router.post("/v1beta/models/{model_name:path}:generateContent")
@router.post("/v1/models/{model_name:path}:generateContent")
@router.post("/models/{model_name:path}:generateContent")
async def gemini_proxy(model_name: str, request: Request, background_tasks: BackgroundTasks):
    """
    Zero-Trust Proxy for Gemini API.
    Strict enforcement of agent-specific policies and PII redaction.
    """
    print(f"[PROXY] Intercepted {request.method} {request.url}")
    start_time = time.time()
    
    try:
        # 1. Extract Payload & Identity
        body = await request.json()
        agent_id = request.headers.get("x-policyguard-agent-id", "default")
        
        # Identity-based policy routing
        metrics_store.record_audit_log(f"Intercepting request for Agent: {agent_id}", status="INFO")
            
        # Get Key from Header (x-goog-api-key) or Query Param (key)
        api_key = request.headers.get("x-goog-api-key") or request.query_params.get("key") or settings.GOOGLE_API_KEY
        
        if not api_key:
            raise HTTPException(status_code=401, detail="Authentication Required: Missing Google API Key")
            
        # 2. Extract Prompt
        contents = body.get("contents", [])
        user_prompt = ""
        for content in contents:
            for part in content.get("parts", []):
                if "text" in part:
                    user_prompt += part["text"] + "\n"
        
        # 3. ZERO-TRUST POLICY EVALUATION
        is_blocked, processed_prompt, metadata = policy_engine.evaluate_prompt(user_prompt, agent_id=agent_id)
        
        if is_blocked:
            print(f"[PROXY] [BLOCK] BLOCK: {metadata['reason']}")
            metrics_store.record_audit_log(f"BLOCK: {metadata['reason']}", status="BLOCK")
            metrics_store.record_request(
                duration_ms=(time.time() - start_time) * 1000,
                status_code=403,
                policy_violation=True,
                endpoint=f"/v1/{model_name}"
            )
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "message": f"PolicyGuard Enforcement: {metadata['reason']}",
                        "code": "POLICY_DENIED",
                        "policy": metadata.get("policy", "Global")
                    }
                }
            )

        # 4. APPLY REDACTION TO PAYLOAD
        if metadata["redactions"] > 0:
            print(f"[PROXY] Applied {metadata['redactions']} redactions to prompt.")
            # Map back to Gemini structure
            new_contents = [{"parts": [{"text": processed_prompt}]}]
            body["contents"] = new_contents

        # 5. FORWARD TO UPSTREAM
        async with httpx.AsyncClient() as client:
            # Fetch Dynamic Gatekeeper Settings
            from services.storage import policy_db
            gk_settings = policy_db.get_gatekeeper_settings()
            
            # Use dynamic URL and key
            upstream_url = gk_settings.stream1_url
            upstream_key = gk_settings.stream1_key if gk_settings.stream1_key else api_key

            # Clean model_name to prevent double prefixing
            cleaned_model = model_name
            if cleaned_model.startswith("models/"):
                cleaned_model = cleaned_model[7:]
                
            # Construct Google URL dynamically
            if "google" in upstream_url.lower():
                google_url = f"https://generativelanguage.googleapis.com/v1beta/models/{cleaned_model}:generateContent?key={upstream_key}"
            else:
                # Custom upstream (Stream 2 or alternative)
                google_url = f"{upstream_url.rstrip('/')}/v1/models/{cleaned_model}:generateContent"
            
            print(f"[PROXY DEBUG] Targeting: {google_url}")
            
            metrics_store.record_audit_log(f"PASS: Prompt safe after {metadata['redactions']} redactions. Routing to upstream.", status="PASS")
            
            response = await client.post(
                google_url,
                headers={"Content-Type": "application/json", "x-goog-api-key": upstream_key},
                json=body,
                timeout=30.0
            )
            
            # --- EGRESS FILTERING (Response Audit) ---
            if response.status_code == 200:
                response_data = response.json()
                generated_text = ""
                # Extract text from Gemini response structure
                try:
                    candidates = response_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "text" in part:
                                generated_text += part["text"]
                except:
                    pass # Failed to parse response, fail open or log

                # Audit the Response
                is_blocked_egress, _, egress_meta = policy_engine.evaluate_prompt(generated_text, agent_id=agent_id)
                
                if is_blocked_egress:
                    print(f"[PROXY] [BLOCK] EGRESS BLOCK: {egress_meta['reason']}")
                    metrics_store.record_audit_log(f"EGRESS BLOCK: {egress_meta['reason']}", status="BLOCK")
                    metrics_store.record_request(
                        duration_ms=(time.time() - start_time) * 1000,
                        status_code=403,
                        policy_violation=True,
                        endpoint=f"/v1/{model_name}"
                    )
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": {
                                "message": f"PolicyGuard Enforcement: {egress_meta['reason']}",
                                "code": "POLICY_DENIED_EGRESS",
                                "policy": egress_meta.get("policy", "Agent Governance")
                            }
                        }
                    )
            
            # Post-flight Metrics
            metrics_store.record_request(
                duration_ms=(time.time() - start_time) * 1000,
                status_code=response.status_code,
                endpoint=f"/v1/{model_name}"
            )
            
            return JSONResponse(status_code=response.status_code, content=response.json())
            
    except Exception as e:
        print(f"[PROXY ERROR] {e}")
        metrics_store.record_request(
            duration_ms=(time.time() - start_time) * 1000,
            status_code=500,
            endpoint=f"/v1/{model_name}"
        )
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Catch-all for SDK variants ---
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_debug_catch_all(request: Request, path: str):
    print(f"[PROXY DEBUG] Unhandled path: {request.method} {path}")
    return JSONResponse(status_code=404, content={"message": f"Proxy route not found: {path}"})
