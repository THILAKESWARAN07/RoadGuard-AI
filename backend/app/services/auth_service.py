from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from pydantic import ValidationError

from app.auth_schemas import TokenResponse, UserRole
from app.config import settings
from app.core.security import get_password_hash, verify_password
from app.db_models import UserRecord
from app.repositories.user_store import UserStore
from app.utils import get_logger

logger = get_logger(__name__)

user_store = UserStore()


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm=settings.jwt_algorithm,
        )
        
        return encoded_jwt

    @staticmethod
    def create_refresh_token(data: dict[str, Any]) -> str:
        """Create a JWT refresh token with longer expiration."""
        to_encode = data.copy()
        
        # Refresh tokens expire in 7 days
        expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm=settings.jwt_algorithm,
        )
        
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> dict[str, Any] | None:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            return payload
        except JWTError as e:
            logger.warning(f"Token validation failed: {e}")
            return None

    @staticmethod
    def verify_access_token(token: str) -> dict[str, Any] | None:
        """Verify an access token and return its payload."""
        payload = AuthService.decode_token(token)
        
        if payload is None:
            return None
        
        # Check if this is an access token
        if payload.get("type") != "access":
            logger.warning("Token is not an access token")
            return None
        
        return payload

    @staticmethod
    def verify_refresh_token(token: str) -> dict[str, Any] | None:
        """Verify a refresh token and return its payload."""
        payload = AuthService.decode_token(token)
        
        if payload is None:
            return None
        
        # Check if this is a refresh token
        if payload.get("type") != "refresh":
            logger.warning("Token is not a refresh token")
            return None
        
        return payload

    @staticmethod
    def register_user(
        email: str,
        password: str,
        full_name: str | None = None,
        phone: str | None = None,
    ) -> UserRecord:
        """Register a new user (citizen only)."""
        # Check if email already exists
        if user_store.email_exists(email):
            raise ValueError("Email already registered")
        
        # Hash the password
        hashed_password = get_password_hash(password)
        
        # Create the user (only driver/citizen role allowed for self-registration)
        user = user_store.create_user(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            phone=phone,
            role="driver",  # Only allow self-registration as driver
        )
        
        logger.info(f"New user registered: {email}")
        return user

    @staticmethod
    def authenticate_user(email: str, password: str) -> UserRecord | None:
        """Authenticate a user with email and password."""
        user = user_store.get_user_by_email(email)
        
        if user is None:
            logger.warning(f"Authentication failed: User not found - {email}")
            return None
        
        if not user.is_active:
            logger.warning(f"Authentication failed: User inactive - {email}")
            return None
        
        if not verify_password(password, user.hashed_password):
            logger.warning(f"Authentication failed: Invalid password - {email}")
            return None
        
        logger.info(f"User authenticated successfully: {email}")
        return user

    @staticmethod
    def login_user(email: str, password: str) -> tuple[UserRecord, TokenResponse]:
        """Login a user and return tokens."""
        user = AuthService.authenticate_user(email, password)
        
        if user is None:
            raise ValueError("Invalid email or password")
        
        # Create tokens
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = AuthService.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role},
            expires_delta=access_token_expires,
        )
        
        refresh_token = AuthService.create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
        )
        
        return user, token_response

    @staticmethod
    def refresh_access_token(refresh_token: str) -> TokenResponse:
        """Refresh an access token using a refresh token."""
        payload = AuthService.verify_refresh_token(refresh_token)
        
        if payload is None:
            raise ValueError("Invalid or expired refresh token")
        
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid token payload")
        
        user = user_store.get_user_by_id(int(user_id))
        
        if user is None:
            raise ValueError("User not found")
        
        if not user.is_active:
            raise ValueError("User account is inactive")
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = AuthService.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role},
            expires_delta=access_token_expires,
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,  # Return same refresh token
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
        )

    @staticmethod
    def get_user_from_token(token: str) -> UserRecord | None:
        """Get a user from an access token."""
        payload = AuthService.verify_access_token(token)
        
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        user = user_store.get_user_by_id(int(user_id))
        
        if user is None or not user.is_active:
            return None
        
        return user
