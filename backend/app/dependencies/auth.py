from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth_schemas import UserResponse
from app.db_models import UserRecord
from app.services.auth_service import AuthService

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> UserRecord:
    """Dependency to get the current authenticated user from JWT token."""
    token = credentials.credentials
    
    user = AuthService.get_user_from_token(token)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: Annotated[UserRecord, Depends(get_current_user)]
) -> UserRecord:
    """Dependency to get the current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    return current_user


async def require_admin(
    current_user: Annotated[UserRecord, Depends(get_current_active_user)]
) -> UserRecord:
    """Dependency to require admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    
    return current_user


async def require_government(
    current_user: Annotated[UserRecord, Depends(get_current_active_user)]
) -> UserRecord:
    """Dependency to require government role."""
    if current_user.role not in ["government", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Government privileges required",
        )
    
    return current_user


async def require_citizen(
    current_user: Annotated[UserRecord, Depends(get_current_active_user)]
) -> UserRecord:
    """Dependency to require citizen (driver) role."""
    if current_user.role not in ["driver", "government", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizen privileges required",
        )
    
    return current_user


# Type aliases for cleaner dependency usage
CurrentUser = Annotated[UserRecord, Depends(get_current_user)]
CurrentActiveUser = Annotated[UserRecord, Depends(get_current_active_user)]
AdminUser = Annotated[UserRecord, Depends(require_admin)]
GovernmentUser = Annotated[UserRecord, Depends(require_government)]
CitizenUser = Annotated[UserRecord, Depends(require_citizen)]
