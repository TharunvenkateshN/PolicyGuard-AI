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
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

app.include_router(api_router, prefix="/api/v1")
app.include_router(proxy_router, prefix="/api/proxy")

@app.get("/")
async def root():
    return {"message": "PolicyGuard AI Control Plane Online", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    # Reload Trigger: 2026-02-02 15:06
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)