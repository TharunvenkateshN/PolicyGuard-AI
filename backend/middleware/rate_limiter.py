"""
Rate Limiting Middleware for PolicyGuard AI.

Uses slowapi (FastAPI-native) with in-memory storage.
Limits are tiered by endpoint sensitivity:
  - /api/proxy/*      : 60 req/min per IP  (proxy intercept — bursty but bounded)
  - /api/v1/redteam/* : 5 req/min per IP   (LLM-heavy, expensive)
  - /api/v1/evaluate  : 20 req/min per IP  (LLM-heavy)
  - Global fallback   : 200 req/min per IP
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


def _get_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For from trusted proxies."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first (leftmost) address — the actual client
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


# Global limiter instance — imported by main.py and individual routers
limiter = Limiter(key_func=_get_ip, default_limits=["200/minute"])


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a clean 429 with Retry-After metadata when rate limit is hit."""
    client_ip = _get_ip(request)
    logger.warning(
        "[RATE-LIMIT] IP %s exceeded limit on %s %s",
        client_ip, request.method, request.url.path
    )
    return JSONResponse(
        status_code=429,
        headers={"Retry-After": "60"},
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please wait before retrying.",
            "retry_after_seconds": 60,
        },
    )
