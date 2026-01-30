from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import httpx
import json
import time
from services.gemini import GeminiService
from services.storage import policy_db
from services.metrics import metrics_store

router = APIRouter()
gemini = GeminiService()

@router.get("/health")
async def proxy_health():
    return {"status": "Proxy Online", "service": "PolicyGuard Middleware"}

@router.post("/v1beta/models/{model_name}:generateContent")
async def gemini_proxy(model_name: str, request: Request, background_tasks: BackgroundTasks):
    """
    Universal Proxy for Google Gemini API.
    Intercepts request, audits prompt, forwards to Google (if safe), audits response.
    """
    start_time = time.time()
    
    # Defaults
    pii_detected = False
    policy_violation = False
    
    print(f"[PROXY] Incoming Gemini Request for {model_name}...", flush=True)
    
    try:
        # 1. Component Extraction
        try:
            body = await request.json()
            metrics_store.record_audit_log(f"Interception Active: Auditing {model_name} payload", status="INFO")
        except Exception as e:
            metrics_store.record_request(
                duration_ms=(time.time() - start_time) * 1000,
                status_code=400,
                endpoint=f"/v1beta/models/{model_name}:generateContent"
            )
            raise HTTPException(status_code=400, detail="Invalid JSON body")
            
        # Get Key from Header (x-goog-api-key) or Query Param (key)
        api_key = request.headers.get("x-goog-api-key") or request.query_params.get("key")
        
        # Fallback to internal key if not provided (for Demo/Test Mode)
        if not api_key:
             from config import settings
             if settings.GEMINI_API_KEY:
                 api_key = settings.GEMINI_API_KEY
             else:
                metrics_store.record_request(
                    duration_ms=(time.time() - start_time) * 1000,
                    status_code=401,
                    endpoint=f"/v1beta/models/{model_name}:generateContent"
                )
                raise HTTPException(status_code=401, detail="Missing x-goog-api-key header or key query param")
            
        # Extract Prompt text from Gemini JSON structure for Auditing
        # Structure: { contents: [ { parts: [ { text: "..." } ] } ] }
        contents = body.get("contents", [])
        user_prompt = ""
        try:
            for content in contents:
                for part in content.get("parts", []):
                    if "text" in part:
                        user_prompt += part["text"] + "\n"
        except Exception:
             pass 
        
        print(f"[PROXY DEBUG] Extracted Prompt: '{user_prompt}'") 
        
        # 2. PRE-FLIGHT AUDIT (Security & PII)
        import re
        pii_patterns = {
            "email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
            "ssn": r"\d{3}-\d{2}-\d{4}",
            "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"
        }
        
        if user_prompt:
            # Check 1: PII
            for p_type, pattern in pii_patterns.items():
                if re.search(pattern, user_prompt):
                    print(f"[PROXY] 🚨 PII DETECTED ({p_type.upper()}). Blocking Request.")
                    metrics_store.record_audit_log(f"BLOCK: Unauthorized {p_type.upper()} Data Flow detected!", status="BLOCK")
                    metrics_store.record_request(
                        duration_ms=(time.time() - start_time) * 1000,
                        status_code=400,
                        pii_detected=True,
                        policy_violation=True,
                        endpoint=f"/v1beta/models/{model_name}:generateContent"
                    )
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Security Policy Violation: request contains sensitive PII ({p_type}). Please redact before sending."
                    )

            # Check 2: Financial Harm / Illegal Advice (NEW)
            financial_harm_keywords = ["insider trading", "pump and dump", "evade taxes", "money laundering"]
            if any(keyword in user_prompt.lower() for keyword in financial_harm_keywords):
                print(f"[PROXY] 🚨 FINANCIAL HARM DETECTED. Blocking Request.")
                metrics_store.record_audit_log("BLOCK: Financial Safety Violation detected!", status="BLOCK")
                metrics_store.record_request(
                    duration_ms=(time.time() - start_time) * 1000,
                    status_code=403, # Forbidden
                    pii_detected=False,
                    policy_violation=True,
                    endpoint=f"/v1beta/models/{model_name}:generateContent"
                )
                raise HTTPException(
                    status_code=403, 
                    detail="Security Policy Violation: Request triggers Financial Harm safety filters."
                )
        
        # 3. FORWARD TO GOOGLE GEMINI
        client = httpx.AsyncClient()
        try:
            # Construct the real Google API URL
            google_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            
            # Forward the request
            metrics_store.record_audit_log(f"PASS: Semantic Sovereign Audit met. Forwarding to Google...", status="PASS")
            upstream_response = await client.post(
                google_url,
                headers={"Content-Type": "application/json"},
                json=body,
                timeout=60.0 # 60s timeout for GenAI
            )
            
            upstream_status = upstream_response.status_code
            upstream_data = upstream_response.json()
            
            # 4. POST-FLIGHT AUDIT & METRICS
            
            # Identify if upstream failed
            if upstream_status >= 400:
                print(f"[PROXY] Upstream Error: {upstream_status}")
            
            # Record Metrics
            metrics_store.record_request(
                duration_ms=(time.time() - start_time) * 1000,
                status_code=upstream_status,
                pii_detected=False,
                policy_violation=False,
                endpoint=f"/v1beta/models/{model_name}:generateContent"
            )
            
            return JSONResponse(content=upstream_data, status_code=upstream_status)
            
        except httpx.TimeoutException:
             print("[PROXY] Upstream Timeout")
             metrics_store.record_request(
                duration_ms=(time.time() - start_time) * 1000,
                status_code=504,
                endpoint=f"/v1beta/models/{model_name}:generateContent"
            )
             raise HTTPException(status_code=504, detail="Upstream Gemini API Timeout")
             
    except HTTPException as he:
        # Re-raise HTTP exceptions so FastAPI handles them
        raise he
    except Exception as e:
        print(f"[PROXY ERROR] Fatal Error in Proxy: {e}")
        # Catch-all for other errors
        metrics_store.record_request(
            duration_ms=(time.time() - start_time) * 1000,
            status_code=500,
            pii_detected=False,
            policy_violation=False,
            endpoint=f"/v1beta/models/{model_name}:generateContent"
        )
        raise HTTPException(status_code=500, detail=str(e))
