from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_session
from app.db_models import Role, UserRecord


class UserStore:
    """Repository for user database operations."""

    def create_user(
        self,
        email: str,
        hashed_password: str,
        full_name: str | None = None,
        phone: str | None = None,
        role: str = "driver",
    ) -> UserRecord:
        """Create a new user."""
        with get_session() as session:
            # Get or create the role
            role_obj = session.execute(
                select(Role).where(Role.name == role)
            ).scalar_one_or_none()
            
            if role_obj is None:
                # Create the role if it doesn't exist
                role_obj = Role(name=role, description=f"{role.capitalize()} role")
                session.add(role_obj)
                session.flush()
            
            # Create the user
            user = UserRecord(
                email=email,
                hashed_password=hashed_password,
                full_name=full_name,
                phone=phone,
                role=role,
                role_id=role_obj.id,
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    def get_user_by_email(self, email: str) -> UserRecord | None:
        """Get a user by email."""
        with get_session() as session:
            return session.execute(
                select(UserRecord).where(UserRecord.email == email)
            ).scalar_one_or_none()

    def get_user_by_id(self, user_id: int) -> UserRecord | None:
        """Get a user by ID."""
        with get_session() as session:
            return session.get(UserRecord, user_id)

    def update_user(
        self,
        user_id: int,
        full_name: str | None = None,
        phone: str | None = None,
        is_active: bool | None = None,
    ) -> UserRecord | None:
        """Update user information."""
        with get_session() as session:
            user = session.get(UserRecord, user_id)
            if user is None:
                return None
            
            if full_name is not None:
                user.full_name = full_name
            if phone is not None:
                user.phone = phone
            if is_active is not None:
                user.is_active = is_active
            
            session.commit()
            session.refresh(user)
            return user

    def deactivate_user(self, user_id: int) -> UserRecord | None:
        """Deactivate a user account."""
        return self.update_user(user_id, is_active=False)

    def email_exists(self, email: str) -> bool:
        """Check if an email already exists."""
        return self.get_user_by_email(email) is not None
