from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.models import HazardType, PotholeDetection, RoadStatus
from app.repositories.detection_store import DetectionStore
from app.schemas import DashboardSummary, ReportCreate, ReportResponse, RouteRecommendationResponse, RepairUpdate
from app.services.risk import RiskService

router = APIRouter(tags=["reports"])

_store = DetectionStore()
_risk_service = RiskService()


def _to_report_response(detection: PotholeDetection, description: str | None = None) -> ReportResponse:
    payload = detection.model_dump()
    payload["description"] = description
    return ReportResponse.model_validate(payload)


@router.get("/reports", response_model=list[ReportResponse])
def list_reports() -> list[ReportResponse]:
    return [_to_report_response(detection) for detection in _store.list_all()]


@router.post("/reports", response_model=ReportResponse)
def create_report(payload: ReportCreate) -> ReportResponse:
    matching_detection = None
    for detection in _store.list_all():
        if abs(detection.latitude - payload.latitude) < 0.0001 and abs(detection.longitude - payload.longitude) < 0.0001:
            matching_detection = detection
            break

    if matching_detection is not None:
        matching_detection.detection_count += 1
        matching_detection.image_url = payload.image_url or matching_detection.image_url
        matching_detection.risk_score = _risk_service.score(matching_detection.severity, matching_detection.detection_count)
        _store.upsert(matching_detection)
        return _to_report_response(matching_detection, payload.description)

    detection = PotholeDetection(
        id=_store.next_id(),
        hazard_type=HazardType.pothole,
        latitude=payload.latitude,
        longitude=payload.longitude,
        confidence=payload.confidence,
        severity="medium",
        detection_count=1,
        risk_score=_risk_service.score("medium", detection_count=1),
        image_url=payload.image_url,
        detected_at=datetime.utcnow(),
    )
    _store.upsert(detection)
    return _to_report_response(detection, payload.description)


@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary() -> DashboardSummary:
    detections = _store.list_all()
    recent = [_to_report_response(detection) for detection in _store.recent(4)]
    total_detections = len(detections)
    open_detections = sum(1 for detection in detections if detection.status == RoadStatus.open)
    repaired_roads = sum(1 for detection in detections if detection.status == RoadStatus.repaired)
    critical_roads = sum(1 for detection in detections if detection.risk_score >= 80)
    safety_score = max(0, 100 - min(critical_roads * 5 + open_detections * 2, 100))
    return DashboardSummary(
        total_detections=total_detections,
        open_detections=open_detections,
        critical_roads=critical_roads,
        repaired_roads=repaired_roads,
        safety_score=safety_score,
        recent_detections=recent,
    )


@router.get("/routes/recommendations", response_model=list[RouteRecommendationResponse])
def route_recommendations() -> list[RouteRecommendationResponse]:
    detections = _store.list_all()
    pothole_count = len(detections)
    average_severity_score = sum({"small": 1, "medium": 2, "large": 3}.get(detection.severity.lower(), 2) for detection in detections)
    average_severity_level = average_severity_score / pothole_count if pothole_count else 1.0

    routes = [
        RouteRecommendationResponse(
            name="Fastest route",
            distance_km=5.0,
            estimated_time_min=10,
            pothole_count=pothole_count + 10,
            average_severity="large" if average_severity_level >= 2.5 else "medium",
            road_score=max(20, 100 - min(pothole_count * 3 + 35, 80)),
            recommendation="Not recommended",
        ),
        RouteRecommendationResponse(
            name="Safest route",
            distance_km=6.2,
            estimated_time_min=12,
            pothole_count=max(0, pothole_count - 2),
            average_severity="small" if average_severity_level <= 1.8 else "medium",
            road_score=min(100, 85 + max(0, 8 - pothole_count)),
            recommendation="Recommended",
        ),
        RouteRecommendationResponse(
            name="Balanced route",
            distance_km=5.5,
            estimated_time_min=11,
            pothole_count=max(0, pothole_count // 2),
            average_severity="medium",
            road_score=max(35, 90 - min(pothole_count * 2, 50)),
            recommendation="Good option",
        ),
    ]
    return routes


@router.put("/detections/{detection_id}/repair", response_model=ReportResponse)
def mark_repaired(detection_id: int, payload: RepairUpdate) -> ReportResponse:
    detection = _store.get_by_id(detection_id)
    if detection is None:
        raise HTTPException(status_code=404, detail="Detection not found")

    detection.status = payload.status
    detection.repaired_at = datetime.utcnow()
    _store.upsert(detection)
    return _to_report_response(detection)
