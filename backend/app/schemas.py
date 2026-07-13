from datetime import datetime

from pydantic import BaseModel, Field

from app.models import HazardType, RoadStatus


class DetectionCreate(BaseModel):
    hazard_type: HazardType = HazardType.pothole
    latitude: float
    longitude: float
    confidence: float = Field(ge=0.0, le=1.0)
    image_url: str | None = None


class DetectionResponse(BaseModel):
    id: int
    hazard_type: HazardType
    latitude: float
    longitude: float
    confidence: float
    severity: str
    detection_count: int
    risk_score: int
    detected_at: datetime
    image_url: str | None = None
    status: RoadStatus


class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    description: str | None = None
    image_url: str | None = None
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class ReportResponse(DetectionResponse):
    description: str | None = None


class RepairUpdate(BaseModel):
    status: RoadStatus = RoadStatus.repaired


class RouteRecommendationResponse(BaseModel):
    name: str
    distance_km: float
    estimated_time_min: int
    pothole_count: int
    average_severity: str
    road_score: int
    recommendation: str


class DashboardSummary(BaseModel):
    total_detections: int
    open_detections: int
    critical_roads: int
    repaired_roads: int
    safety_score: int
    recent_detections: list[DetectionResponse]
