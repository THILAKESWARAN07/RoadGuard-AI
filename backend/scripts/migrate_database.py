"""
Safe database migration script for RoadGuard-AI database foundation.

This script:
- Adds new columns to existing detections table (nullable for backward compatibility)
- Creates new tables (roles, users, vehicles, citizen_reports, repair_tasks, notifications, government_departments)
- Preserves all existing data
- Works with both SQLite and PostgreSQL
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import settings
from app.db import Base, engine, get_session
from app.db_models import (
    CitizenReportRecord,
    DetectionRecord,
    GovernmentDepartmentRecord,
    NotificationRecord,
    RepairTaskRecord,
    Role,
    UserRecord,
    VehicleRecord,
)
from app.utils import get_logger

logger = get_logger(__name__)


def add_column_if_not_exists(
    session: Session, table_name: str, column_name: str, column_definition: str
) -> None:
    """Add a column to a table if it doesn't already exist."""
    inspector = inspect(engine)
    existing_columns = [col["name"] for col in inspector.get_columns(table_name)]
    
    if column_name not in existing_columns:
        dialect = engine.dialect.name
        if dialect == "sqlite":
            # SQLite doesn't support ADD COLUMN IF NOT EXISTS directly
            # We need to check manually
            session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"))
            logger.info(f"Added column {column_name} to table {table_name}")
        elif dialect == "postgresql":
            session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_definition}"))
            logger.info(f"Added column {column_name} to table {table_name}")
        session.commit()
    else:
        logger.info(f"Column {column_name} already exists in table {table_name}")


def migrate_detections_table(session: Session) -> None:
    """Add new columns to the detections table for improved detection model."""
    logger.info("Migrating detections table...")
    
    # New columns to add (all nullable for backward compatibility)
    new_columns = [
        ("bounding_box", "VARCHAR(100)"),
        ("road_type", "VARCHAR(32)"),
        ("district", "VARCHAR(64)"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("ai_model_version", "VARCHAR(32)"),
    ]
    
    for column_name, column_def in new_columns:
        add_column_if_not_exists(session, "detections", column_name, column_def)


def create_new_tables() -> None:
    """Create new tables that don't exist yet."""
    logger.info("Creating new tables...")
    
    # Import all models to register them with SQLAlchemy metadata
    from app.db_models import (  # noqa: F401
        CitizenReportRecord,
        DetectionRecord,
        GovernmentDepartmentRecord,
        NotificationRecord,
        RepairTaskRecord,
        Role,
        UserRecord,
        VehicleRecord,
    )
    
    # Create only tables that don't exist
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Get all tables from metadata
    all_tables = Base.metadata.tables.keys()
    
    # Create only new tables
    for table_name in all_tables:
        if table_name not in existing_tables:
            logger.info(f"Creating table: {table_name}")
            Base.metadata.tables[table_name].create(engine, checkfirst=True)
        else:
            logger.info(f"Table {table_name} already exists, skipping")


def apply_postgis_extensions(session: Session) -> None:
    """Apply PostGIS extensions if using PostgreSQL."""
    if engine.dialect.name == "postgresql":
        logger.info("PostgreSQL detected, applying PostGIS extensions")
        
        # Create PostGIS extension
        session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        
        # Add location column to detections if it doesn't exist
        inspector = inspect(engine)
        detections_columns = [col["name"] for col in inspector.get_columns("detections")]
        
        if "location" not in detections_columns:
            session.execute(
                text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS location geography(Point, 4326)")
            )
            # Update existing records with location data
            session.execute(
                text(
                    "UPDATE detections "
                    "SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography "
                    "WHERE location IS NULL"
                )
            )
            # Create GIST index
            session.execute(
                text("CREATE INDEX IF NOT EXISTS ix_detections_location ON detections USING GIST (location)")
            )
            logger.info("PostGIS location column and index added to detections table")
        
        session.commit()
        logger.info("PostGIS extensions applied successfully")


def seed_default_roles(session: Session) -> None:
    """Seed default roles if they don't exist."""
    logger.info("Seeding default roles...")
    
    default_roles = [
        {"name": "driver", "description": "Driver role for citizen reporting and hazard alerts"},
        {"name": "government", "description": "Government role for repair task management"},
        {"name": "admin", "description": "Admin role for system oversight"},
    ]
    
    for role_data in default_roles:
        existing_role = session.execute(
            text("SELECT id FROM roles WHERE name = :name"), {"name": role_data["name"]}
        ).fetchone()
        
        if not existing_role:
            session.execute(
                text(
                    "INSERT INTO roles (name, description, created_at) "
                    "VALUES (:name, :description, CURRENT_TIMESTAMP)"
                ),
                role_data,
            )
            logger.info(f"Created role: {role_data['name']}")
    
    session.commit()


def run_migration() -> None:
    """Run the complete migration process."""
    logger.info("Starting database migration...")
    
    with get_session() as session:
        # Step 1: Add new columns to existing detections table
        migrate_detections_table(session)
        
        # Step 2: Create new tables
        create_new_tables()
        
        # Step 3: Apply PostGIS extensions if using PostgreSQL
        apply_postgis_extensions(session)
        
        # Step 4: Seed default roles
        seed_default_roles(session)
    
    logger.info("Database migration completed successfully")


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
