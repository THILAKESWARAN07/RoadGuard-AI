from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class HazardType(str, Enum):
    pothole = "pothole"
    pedestrian = "pedestrian"
    animal = "animal"


class RoadStatus(str, Enum):
    open = "open"
    repaired = "repaired"
    critical = "critical"


class PotholeDetection(BaseModel):
    id: int | None = None
    hazard_type: HazardType = HazardType.pothole
    latitude: float
    longitude: float
    confidence: float = Field(ge=0.0, le=1.0)
    severity: str = Field(default="medium")
    detection_count: int = 1
    risk_score: int = Field(ge=0, le=100)
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    repaired_at: datetime | None = None
    image_url: str | None = None
    status: RoadStatus = RoadStatus.open
