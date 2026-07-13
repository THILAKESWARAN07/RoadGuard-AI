from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status

from app.auth_schemas import (
    AuthResponse,
    CurrentUserResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.config import settings
from app.db_models import UserRecord
from app.dependencies import CurrentUser
from app.services.auth_service import AuthService
from app.utils import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> AuthResponse:
    """Register a new user account (citizen/driver only)."""
    try:
        user = AuthService.register_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
        )
        
        # Generate tokens for the new user
        _, token_response = AuthService.login_user(payload.email, payload.password)
        
        user_response = UserResponse.model_validate(user)
        
        return AuthResponse(
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
            token_type=token_response.token_type,
            expires_in=token_response.expires_in,
            user=user_response,
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration",
        )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    """Authenticate a user and return JWT tokens."""
    try:
        user, token_response = AuthService.login_user(payload.email, payload.password)
        
        user_response = UserResponse.model_validate(user)
        
        return AuthResponse(
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
            token_type=token_response.token_type,
            expires_in=token_response.expires_in,
            user=user_response,
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest) -> TokenResponse:
    """Refresh an access token using a refresh token."""
    try:
        token_response = AuthService.refresh_access_token(payload.refresh_token)
        return token_response
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during token refresh",
        )


@router.post("/logout")
def logout(current_user: CurrentUser) -> dict[str, str]:
    """Logout a user (client-side token deletion)."""
    # In a stateless JWT system, logout is handled client-side by deleting tokens
    # For a more robust system, you could implement a token blacklist
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=CurrentUserResponse)
def get_current_user_info(current_user: CurrentUser) -> CurrentUserResponse:
    """Get information about the currently authenticated user."""
    user_response = UserResponse.model_validate(current_user)
    
    # Calculate token expiration
    expires_at = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    return CurrentUserResponse(
        user=user_response,
        expires_at=expires_at,
    )
