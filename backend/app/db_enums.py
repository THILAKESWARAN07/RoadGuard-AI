from __future__ import annotations

from sqlalchemy import Enum as SQLAlchemyEnum

# SQLAlchemy Enums for database-level constraints
UserRole = SQLAlchemyEnum(
    "driver",
    "government",
    "admin",
    name="userrole",
    create_constraint=True,
    metadata__schema=None,
)

HazardType = SQLAlchemyEnum(
    "pothole",
    "pedestrian",
    "animal",
    name="hazardtype",
    create_constraint=True,
    metadata__schema=None,
)

Severity = SQLAlchemyEnum(
    "small",
    "medium",
    "large",
    name="severity",
    create_constraint=True,
    metadata__schema=None,
)

RepairStatus = SQLAlchemyEnum(
    "pending",
    "in_progress",
    "completed",
    "cancelled",
    name="repairstatus",
    create_constraint=True,
    metadata__schema=None,
)

RoadStatus = SQLAlchemyEnum(
    "open",
    "repaired",
    "critical",
    name="roadstatus",
    create_constraint=True,
    metadata__schema=None,
)

VerificationStatus = SQLAlchemyEnum(
    "pending",
    "verified",
    "rejected",
    name="verificationstatus",
    create_constraint=True,
    metadata__schema=None,
)

DuplicateStatus = SQLAlchemyEnum(
    "none",
    "duplicate",
    "merged",
    name="duplicatestatus",
    create_constraint=True,
    metadata__schema=None,
)

NotificationType = SQLAlchemyEnum(
    "alert",
    "repair",
    "system",
    name="notificationtype",
    create_constraint=True,
    metadata__schema=None,
)

NotificationStatus = SQLAlchemyEnum(
    "unread",
    "read",
    "dismissed",
    name="notificationstatus",
    create_constraint=True,
    metadata__schema=None,
)
