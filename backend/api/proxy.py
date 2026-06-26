from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import httpx
import json
import time
import logging
from services.gemini import GeminiService
from services.policy_engine import policy_engine
from services.metrics import metrics_store
import asyncio
from config import settings
from middleware.rate_limiter import limiter
from middleware.circuit_breaker import upstream_circuit_breaker, CircuitBreakerOpenError

logger = logging.getLogger(__name__)

router = APIRouter()
gemini = GeminiService()

@router.get("/api/proxy/health")
async def proxy_health():
    return {"status": "Proxy Online", "service": "PolicyGuard Zero-Trust Interceptor"}

@router.post("/api/proxy/{full_path:path}")
@limiter.limit("60/minute")
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

        # SEC: Always use the server-side key. Client-supplied keys are never accepted.
        # A client attempting to supply a key via header or query param is logged as a
        # security event but the request is not rejected — we simply ignore the supplied key
        # and use our own. This prevents key probing / quota abuse while remaining transparent.
        if request.headers.get("x-goog-api-key") or request.query_params.get("key"):
            logger.warning(
                "[SECURITY] Client attempted to supply an API key — ignored. "
                "Only server-side keys are used. TraceID: %s AgentID: %s",
                trace_id, agent_id
            )
            metrics_store.record_audit_log(
                f"SECURITY: Client attempted to supply API key (ignored). Agent: {agent_id}",
                status="WARN",
                log_id=trace_id
            )

        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            logger.error("[PROXY] Server API key not configured. TraceID: %s", trace_id)
            raise HTTPException(status_code=503, detail="Proxy not configured: contact administrator")
            
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

        # 5. CIRCUIT BREAKER CHECK
        if not upstream_circuit_breaker.allow_request():
            status = upstream_circuit_breaker.get_status()
            logger.warning("[PROXY] Circuit OPEN — upstream blocked. TraceID: %s Status: %s", trace_id, status)
            metrics_store.record_audit_log(
                f"CIRCUIT OPEN: upstream blocked. Will retry in {status['recovery_timeout_s']}s",
                status="WARN", log_id=trace_id
            )
            return JSONResponse(
                status_code=503,
                content={
                    "error": "upstream_circuit_open",
                    "message": "Upstream service temporarily unavailable. Please retry shortly.",
                    "retry_after_seconds": int(status["recovery_timeout_s"]),
                },
                headers={"Retry-After": str(int(status["recovery_timeout_s"]))},
            )

        # 6. FORWARD TO UPSTREAM
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

                # Strip any client-supplied key from the forwarded URL, then append ours.
                # This ensures no client key ever reaches Google's endpoint.
                import re
                google_url = re.sub(r'[?&]key=[^&]+', '', google_url)
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

            # Record circuit breaker outcome
            if response.status_code >= 500 or response.status_code == 429:
                upstream_circuit_breaker.record_failure()
                logger.warning("[PROXY UPSTREAM ERROR] Status: %d TraceID: %s", response.status_code, trace_id)
                metrics_store.record_audit_log(f"UPSTREAM ERROR: {response.status_code}", status="WARN", log_id=trace_id)
            else:
                upstream_circuit_breaker.record_success()

            
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
                except Exception as parse_exc:
                    logger.warning("[PROXY] Failed to parse upstream response for egress filter. TraceID: %s Error: %s", trace_id, parse_exc)

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
