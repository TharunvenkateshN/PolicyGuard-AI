from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
import traceback

load_dotenv()

app = FastAPI(
    title="PolicyGuard AI Control Plane",
    description="Backend for PolicyGuard AI - Pre-deployment Policy Governance",
    version="0.1.0",
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

# CORS - Allow everything for Hackathon MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.middleware.trustedhost import TrustedHostMiddleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0"]
)

@app.get("/")
async def root():
    return {"message": "PolicyGuard AI Control Plane Online", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)