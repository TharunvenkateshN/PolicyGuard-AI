from dotenv import load_dotenv
import os
import sys

# Load env before ANY other imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
import uvicorn
import traceback

app = FastAPI(
    title="PolicyGuard AI Control Plane",
    description="Backend for PolicyGuard AI - Pre-deployment Policy Governance",
    version="0.1.0",
)

# CORS - Load from env for deployment flexibility
env_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
origins = [o.strip() for o in env_origins if o.strip()]
if not origins:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8888",
        "http://127.0.0.1:8888",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[STARTUP] CORS origins: {origins}")

# Global Exception Handler for generic 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_trace = "".join(traceback.format_exception(None, exc, exc.__traceback__))
    print(f"Unhandled Exception: {error_trace}") # Optional: log the error
    return JSONResponse(
        status_code=500,
        content={"detail": error_trace}
    )

from api.routes import router as api_router
from api.proxy import router as proxy_router
from api.test_region import router as test_region_router
from services.storage import policy_db
from services.metrics import metrics_store
from middleware.rate_limiter import limiter, rate_limit_exceeded_handler

# Attach rate limiter to app state and register 429 handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Attach DB to metrics after both are initialized to avoid circular imports
metrics_store.set_db(policy_db.db)

app.include_router(api_router, prefix="/api/v1")
app.include_router(proxy_router)
app.include_router(test_region_router, prefix="/api/v1")

@app.get("/")
async def root():
    from services.storage import policy_db
    mode = "Firebase (Production)" if policy_db._use_firebase else "Local (Development)"
    return {
        "message": "PolicyGuard AI Control Plane Online",
        "status": "active",
        "storage_mode": mode,
        "firebase_connected": policy_db.db is not None
    }

@app.get("/health")
async def health_check():
    from services.storage import policy_db
    return {
        "status": "ok",
        "storage": "local" if not policy_db._use_firebase else "firebase"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)