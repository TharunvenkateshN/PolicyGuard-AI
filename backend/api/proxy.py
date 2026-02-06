from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import httpx
import json
import time
from services.gemini import GeminiService
from services.policy_engine import policy_engine
from services.metrics import metrics_store
import asyncio
from config import settings

router = APIRouter()
gemini = GeminiService()

@router.get("/api/proxy/health")
async def proxy_health():
    return {"status": "Proxy Online", "service": "PolicyGuard Zero-Trust Interceptor"}

@router.post("/api/proxy/{full_path:path}")
async def gemini_proxy(full_path: str, request: Request, background_tasks: BackgroundTasks):
    """
    Zero-Trust Proxy for Gemini API.
    Handles all paths dynamically.
    """
    # Extract model_name from path if possible (v1beta/models/MODEL_NAME:generateContent)
    model_name = "unknown"
    if "models/" in full_path:
        model_name = full_path.split("models/")[1].split(":")[0]
    
    import uuid
    trace_id = f"trace-{uuid.uuid4().hex[:8]}"
    print(f"[PROXY] Intercepted {request.method} {full_path} (Model: {model_name}) [TraceID: {trace_id}]")
    start_time = time.time()
    
    try:
        # 1. Extract Payload & Identity
        body = await request.json()
        agent_id = request.headers.get("x-policyguard-agent-id", "default")
        
        # Identity-based policy routing
        metrics_store.record_audit_log(f"Intercepting request for Agent: {agent_id}", status="INFO", log_id=trace_id)
            
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
            metrics_store.record_audit_log(f"BLOCK: {metadata['reason']}", status="BLOCK", log_id=trace_id)
            metrics_store.record_request(
                duration_ms=(time.time() - start_time) * 1000,
                status_code=403,
                policy_violation=True,
                endpoint=f"/v1/{model_name}",
                request_id=trace_id
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
            # Fetch Dynamic Gatekeeper Settings (Non-blocking)
            from services.storage import policy_db
            gk_settings = await asyncio.to_thread(policy_db.get_gatekeeper_settings)
            
            # Use dynamic URL and key
            upstream_url = gk_settings.stream1_url
            upstream_key = gk_settings.stream1_key if gk_settings.stream1_key else api_key

            # Clean model_name to prevent double prefixing
            cleaned_model = model_name
                
            # Determine if we use standard Google URL or custom upstream
            if "generativelanguage.googleapis.com" in upstream_url.lower() or "localhost" in upstream_url or "127.0.0.1" in upstream_url:
                # STRATEGY: Directly replace the proxy base with Google base to preserve ALL SDK params
                original_url = str(request.url)
                
                # We need to handle both 127.0.0.1 and localhost, and potentially other variations
                google_base = "https://generativelanguage.googleapis.com"
                
                # Identify where /api/proxy/ ends
                if "/api/proxy/" in original_url:
                    path_and_query = original_url.split("/api/proxy/")[1]
                    google_url = f"{google_base}/{path_and_query}"
                else:
                    # Fallback if the path structure is unexpected
                    google_url = f"{google_base}/v1beta/{full_path}"
                    if str(request.query_params):
                        google_url += f"?{request.query_params}"

                # Ensure the upstream key is applied. 
                # If key is already in the URL, we replace it.
                if "key=" in google_url:
                    # Replace existing key with our authorized key (Stream 1 or env key)
                    import re
                    google_url = re.sub(r'key=[^&]+', f'key={upstream_key}', google_url)
                else:
                    connector = "&" if "?" in google_url else "?"
                    google_url += f"{connector}key={upstream_key}"
            else:
                # Custom upstream (Stream 2 or alternative)
                google_url = f"{upstream_url.rstrip('/')}/v1/models/{cleaned_model}:generateContent"
            
            print(f"[PROXY DEBUG] Final Upstream URL: {google_url}", flush=True)
            
            metrics_store.record_audit_log(f"PASS: Prompt safe after {metadata['redactions']} redactions. Routing to upstream.", status="PASS", log_id=trace_id)
            
            response = await client.post(
                google_url,
                headers={"Content-Type": "application/json", "x-goog-api-key": upstream_key},
                json=body,
                timeout=30.0
            )
            
            if response.status_code != 200:
                print(f"[PROXY UPSTREAM ERROR] Status: {response.status_code} Body: {response.text[:200]}", flush=True)
                metrics_store.record_audit_log(f"UPSTREAM ERROR: {response.status_code}", status="WARN", log_id=trace_id)

            
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
                    metrics_store.record_audit_log(f"EGRESS BLOCK: {egress_meta['reason']}", status="BLOCK", log_id=trace_id)
                    metrics_store.record_request(
                        duration_ms=(time.time() - start_time) * 1000,
                        status_code=403,
                        policy_violation=True,
                        endpoint=f"/v1/{model_name}",
                        request_id=trace_id
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
                endpoint=full_path,
                request_id=trace_id
            )
            
            return JSONResponse(status_code=response.status_code, content=response.json())
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[PROXY ERROR] {e}")
        metrics_store.record_request(
            duration_ms=(time.time() - start_time) * 1000,
            status_code=500,
            endpoint=f"/v1/{model_name}",
            request_id=trace_id
        )
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Catch-all for SDK variants ---
@router.api_route("/api/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_debug_catch_all(request: Request, path: str):
    print(f"[PROXY DEBUG] Unhandled path: {request.method} {path}")
    return JSONResponse(status_code=404, content={"message": f"Proxy route not found: {path}"})
