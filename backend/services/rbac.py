"""
PolicyGuard-AI: Enterprise RBAC with Firebase Custom Claims

Defines five roles and the endpoints each can access:

    ADMIN     — Full access including user management
    CISO      — Full read/write on all governance features; no user management
    AUDITOR   — Audit, evaluate, red-team, export; read-only on settings
    DEVELOPER — Evaluate, remediate own agents; no red-team or settings write
    VIEWER    — Read-only dashboard and policies; no write operations

Roles are stored as Firebase custom claims: {"role": "CISO"}
The backend verifies the Firebase ID token on every protected request.

Usage:
    from services.rbac import require_role, Role

    @router.get("/sensitive-endpoint")
    async def sensitive_endpoint(user=Depends(require_role(Role.AUDITOR))):
        ...

Token extraction:
    Client must send:   Authorization: Bearer <firebase-id-token>
    Middleware decodes the token, extracts the 'role' claim, and injects
    a UserContext into the request state.
"""

import logging
import os
from enum import Enum
from typing import Optional
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

_USE_FIREBASE = os.getenv("USE_FIREBASE", "true").lower() == "true"

# ---------------------------------------------------------------------------
# Role hierarchy
# ---------------------------------------------------------------------------

class Role(str, Enum):
    ADMIN     = "ADMIN"
    CISO      = "CISO"
    AUDITOR   = "AUDITOR"
    DEVELOPER = "DEVELOPER"
    VIEWER    = "VIEWER"


# Role precedence: higher index = more permissions
_ROLE_LEVEL: dict = {
    Role.VIEWER:    0,
    Role.DEVELOPER: 1,
    Role.AUDITOR:   2,
    Role.CISO:      3,
    Role.ADMIN:     4,
}


def role_at_least(user_role: Role, required_role: Role) -> bool:
    """Return True if user_role is equal to or above required_role in the hierarchy."""
    return _ROLE_LEVEL.get(user_role, -1) >= _ROLE_LEVEL.get(required_role, 99)


# ---------------------------------------------------------------------------
# User context
# ---------------------------------------------------------------------------

@dataclass
class UserContext:
    uid: str
    email: Optional[str]
    role: Role
    is_anonymous: bool = False
    # Multi-tenancy namespace (ARCH-4). Extracted from Firebase custom claim
    # {"role": "CISO", "tenant_id": "acme-corp"}. Defaults to uid when the
    # claim is absent — each user is implicitly their own single-user tenant.
    tenant_id: str = "default"


# ---------------------------------------------------------------------------
# Token verification
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer(auto_error=False)


async def _verify_firebase_token(token: str) -> UserContext:
    """Decode a Firebase ID token and extract custom role + tenant_id claims."""
    try:
        from firebase_admin import auth
        decoded = auth.verify_id_token(token)
        role_str = decoded.get("role", Role.VIEWER.value)
        try:
            role = Role(role_str.upper())
        except ValueError:
            logger.warning("[RBAC] Unknown role claim '%s' — defaulting to VIEWER", role_str)
            role = Role.VIEWER
        # tenant_id falls back to uid so single-user installs need no special setup
        tenant_id = decoded.get("tenant_id") or decoded["uid"]
        return UserContext(
            uid=decoded["uid"],
            email=decoded.get("email"),
            role=role,
            tenant_id=tenant_id,
        )
    except Exception as exc:
        logger.warning("[RBAC] Token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")


def _dev_user() -> UserContext:
    """Return a permissive developer context when Firebase is disabled."""
    return UserContext(uid="dev-local", email="dev@localhost", role=Role.ADMIN, is_anonymous=True, tenant_id="dev")


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> UserContext:
    """
    FastAPI dependency that resolves the current user.
    When USE_FIREBASE=false (dev mode), returns an ADMIN context unconditionally.
    When USE_FIREBASE=true, validates the Firebase ID token from the Authorization header.

    Multi-tenancy (ARCH-4): If the client sends an x-tenant-id header, it must
    match the tenant_id from the user's Firebase custom claim. This prevents
    a user authenticated as tenant A from accessing tenant B's data by simply
    changing a header value.
    """
    if not _USE_FIREBASE:
        return _dev_user()

    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = await _verify_firebase_token(credentials.credentials)

    # Validate x-tenant-id header if present
    requested_tenant = request.headers.get("x-tenant-id")
    if requested_tenant and requested_tenant != user.tenant_id:
        logger.warning(
            "[RBAC] Tenant mismatch: user %s (tenant=%s) requested access to tenant=%s",
            user.uid, user.tenant_id, requested_tenant,
        )
        raise HTTPException(
            status_code=403,
            detail=f"x-tenant-id '{requested_tenant}' does not match your account's tenant.",
        )

    return user


def require_role(minimum_role: Role):
    """
    Factory that returns a FastAPI dependency enforcing a minimum role level.

    Example:
        @router.delete("/policies/{id}")
        async def delete_policy(policy_id: str, user=Depends(require_role(Role.CISO))):
            ...
    """
    async def _check(user: UserContext = Depends(get_current_user)) -> UserContext:
        if not role_at_least(user.role, minimum_role):
            logger.warning(
                "[RBAC] Access denied: user %s (role=%s) attempted action requiring %s",
                user.uid, user.role, minimum_role
            )
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required: {minimum_role.value}, your role: {user.role.value}",
            )
        return user
    return _check


# ---------------------------------------------------------------------------
# Admin utilities (used by the admin panel endpoints)
# ---------------------------------------------------------------------------

async def set_user_role(uid: str, role: Role) -> bool:
    """
    Set a Firebase custom claim 'role' for the given user UID.
    Requires the service account to have the 'Firebase Authentication Admin' permission.
    The user must sign out and back in (or refresh their token) for the new claim to take effect.
    """
    if not _USE_FIREBASE:
        logger.info("[RBAC] DEV MODE: would set role=%s for uid=%s", role.value, uid)
        return True
    try:
        from firebase_admin import auth
        auth.set_custom_user_claims(uid, {"role": role.value})
        logger.info("[RBAC] Set role=%s for uid=%s", role.value, uid)
        return True
    except Exception as exc:
        logger.error("[RBAC] Failed to set role for %s: %s", uid, exc)
        return False


async def list_users(page_size: int = 50) -> list:
    """
    List Firebase users with their current role claim.
    Returns a list of {uid, email, role, disabled} dicts.
    """
    if not _USE_FIREBASE:
        return [{"uid": "dev-local", "email": "dev@localhost", "role": "ADMIN", "disabled": False}]
    try:
        from firebase_admin import auth
        page = auth.list_users()
        users = []
        for user in page.users:
            claims = user.custom_claims or {}
            users.append({
                "uid": user.uid,
                "email": user.email or "",
                "display_name": user.display_name or "",
                "role": claims.get("role", Role.VIEWER.value),
                "disabled": user.disabled,
            })
            if len(users) >= page_size:
                break
        return users
    except Exception as exc:
        logger.error("[RBAC] Failed to list users: %s", exc)
        return []
