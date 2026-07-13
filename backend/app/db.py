from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings
from app.utils import get_logger

logger = get_logger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_session() -> Session:
    return SessionLocal()


def initialize_database() -> None:
    BASE_DIR.joinpath("data").mkdir(parents=True, exist_ok=True)
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

    logger.info(f"Creating database tables for {settings.database_url}")
    Base.metadata.create_all(bind=engine)

    if engine.dialect.name == "postgresql":
        logger.info("PostgreSQL detected, applying PostGIS extensions")
        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            connection.execute(
                text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS location geography(Point, 4326)")
            )
            connection.execute(
                text(
                    "UPDATE detections "
                    "SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography "
                    "WHERE location IS NULL"
                )
            )
            connection.execute(
                text("CREATE INDEX IF NOT EXISTS ix_detections_location ON detections USING GIST (location)")
            )
        logger.info("PostGIS extensions applied successfully")
