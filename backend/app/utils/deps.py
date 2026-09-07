"""
Bridge Point — Auth Dependencies
Extracts and validates current user from JWT token.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import decode_access_token
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate user from Bearer token."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def _get_user_roles(user: User) -> list[str]:
    """Helper to parse JSON roles."""
    import json
    if not user.roles:
        return []
    try:
        return json.loads(user.roles)
    except:
        return []


# ─── DEPRECATED: Unified user mode ─────────────────────
# All users can perform all actions.  Keeping these as
# pass-through aliases so existing imports don't break.

def require_employer(current_user: User = Depends(get_current_user)) -> User:
    """Require an employer/customer capability; legacy dual-role users remain compatible."""
    if "employer" not in _get_user_roles(current_user) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer access required")
    return current_user


def require_labor(current_user: User = Depends(get_current_user)) -> User:
    """Require a worker/labor capability; legacy dual-role users remain compatible."""
    if "labor" not in _get_user_roles(current_user) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Worker access required")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Only allow platform admins. Used for payment verification & payout."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_cooperative(current_user: User = Depends(get_current_user)) -> User:
    """Allow cooperative accounts to use cooperative operations; admins remain compatible."""
    if "cooperative" not in _get_user_roles(current_user) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cooperative access required")
    return current_user
