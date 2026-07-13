from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.db_enums import (
    DuplicateStatus,
    HazardType,
    NotificationStatus,
    NotificationType,
    RepairStatus,
    RoadStatus,
    Severity,
    UserRole,
    VerificationStatus,
)


# ==================== EXISTING MODEL (Preserved for backward compatibility) ====================
class DetectionRecord(Base):
    """Existing detection model - preserved for backward compatibility."""
    __tablename__ = "detections"
    __table_args__ = (
        Index("ix_detections_latitude_longitude", "latitude", "longitude"),
        Index("ix_detections_detected_at", "detected_at"),
        Index("ix_detections_risk_score", "risk_score"),
        Index("ix_detections_severity", "severity"),
        Index("ix_detections_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hazard_type: Mapped[str] = mapped_column(String(32), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    detection_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    repaired_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="open")

    # New fields for improved detection model (nullable for backward compatibility)
    bounding_box: Mapped[str | None] = mapped_column(String(100), nullable=True)  # JSON string: {"x1":0,"y1":0,"x2":100,"y2":100}
    road_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    district: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    ai_model_version: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Relationships
    citizen_reports: Mapped[list["CitizenReportRecord"]] = relationship(
        "CitizenReportRecord", back_populates="detection", cascade="all, delete-orphan"
    )
    repair_tasks: Mapped[list["RepairTaskRecord"]] = relationship(
        "RepairTaskRecord", back_populates="detection", cascade="all, delete-orphan"
    )


# ==================== NEW MODELS ====================

class Role(Base):
    """Role model for RBAC."""
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("name", name="uq_roles_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    users: Mapped[list["UserRecord"]] = relationship("UserRecord", back_populates="role_obj")


class UserRecord(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        Index("ix_users_email", "email"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    role: Mapped[str] = mapped_column(UserRole, nullable=False, default="driver")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign Keys
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"), nullable=True)

    # Relationships
    role_obj: Mapped["Role"] = relationship("Role", back_populates="users")
    citizen_reports: Mapped[list["CitizenReportRecord"]] = relationship(
        "CitizenReportRecord", back_populates="reporter", cascade="all, delete-orphan"
    )
    vehicles: Mapped[list["VehicleRecord"]] = relationship(
        "VehicleRecord", back_populates="owner", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["NotificationRecord"]] = relationship(
        "NotificationRecord", back_populates="user", cascade="all, delete-orphan"
    )


class VehicleRecord(Base):
    """Vehicle model for driver-owned vehicles."""
    __tablename__ = "vehicles"
    __table_args__ = (
        UniqueConstraint("license_plate", name="uq_vehicles_license_plate"),
        Index("ix_vehicles_owner_id", "owner_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    license_plate: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    make: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign Keys
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    owner: Mapped["UserRecord"] = relationship("UserRecord", back_populates="vehicles")


class CitizenReportRecord(Base):
    """Citizen report model for community-reported hazards."""
    __tablename__ = "citizen_reports"
    __table_args__ = (
        Index("ix_citizen_reports_reporter_id", "reporter_id"),
        Index("ix_citizen_reports_detection_id", "detection_id"),
        Index("ix_citizen_reports_created_at", "created_at"),
        Index("ix_citizen_reports_verification_status", "verification_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    verification_status: Mapped[str] = mapped_column(VerificationStatus, nullable=False, default="pending")
    duplicate_status: Mapped[str] = mapped_column(DuplicateStatus, nullable=False, default="none")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Foreign Keys
    reporter_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    detection_id: Mapped[int | None] = mapped_column(ForeignKey("detections.id"), nullable=True)

    # Relationships
    reporter: Mapped["UserRecord"] = relationship("UserRecord", back_populates="citizen_reports")
    detection: Mapped["DetectionRecord"] = relationship("DetectionRecord", back_populates="citizen_reports")


class RepairTaskRecord(Base):
    """Repair task model for tracking repair operations."""
    __tablename__ = "repair_tasks"
    __table_args__ = (
        Index("ix_repair_tasks_detection_id", "detection_id"),
        Index("ix_repair_tasks_department_id", "department_id"),
        Index("ix_repair_tasks_status", "status"),
        Index("ix_repair_tasks_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    status: Mapped[str] = mapped_column(RepairStatus, nullable=False, default="pending")
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=5)  # 1-10, 10 being highest
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign Keys
    detection_id: Mapped[int] = mapped_column(ForeignKey("detections.id"), nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("government_departments.id"), nullable=True)
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relationships
    detection: Mapped["DetectionRecord"] = relationship("DetectionRecord", back_populates="repair_tasks")
    department: Mapped["GovernmentDepartmentRecord"] = relationship(
        "GovernmentDepartmentRecord", back_populates="repair_tasks"
    )
    assignee: Mapped["UserRecord"] = relationship("UserRecord", foreign_keys=[assigned_to])


class NotificationRecord(Base):
    """Notification model for user alerts."""
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_status", "status"),
        Index("ix_notifications_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(NotificationType, nullable=False, default="alert")
    status: Mapped[str] = mapped_column(NotificationStatus, nullable=False, default="unread")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Foreign Keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    detection_id: Mapped[int | None] = mapped_column(ForeignKey("detections.id"), nullable=True)

    # Relationships
    user: Mapped["UserRecord"] = relationship("UserRecord", back_populates="notifications")
    detection_ref: Mapped["DetectionRecord"] = relationship("DetectionRecord", foreign_keys=[detection_id])


class GovernmentDepartmentRecord(Base):
    """Government department model for repair task assignment."""
    __tablename__ = "government_departments"
    __table_args__ = (
        UniqueConstraint("name", "district", name="uq_gov_dept_name_district"),
        Index("ix_government_departments_district", "district"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    district: Mapped[str] = mapped_column(String(64), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    repair_tasks: Mapped[list["RepairTaskRecord"]] = relationship(
        "RepairTaskRecord", back_populates="department", cascade="all, delete-orphan"
    )
