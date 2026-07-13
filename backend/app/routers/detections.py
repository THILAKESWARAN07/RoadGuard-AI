from datetime import datetime

from fastapi import APIRouter

from app.models import PotholeDetection
from app.schemas import DetectionCreate, DetectionResponse
from app.repositories.detection_store import DetectionStore
from app.services.dedupe import DuplicateService
from app.services.risk import RiskService

router = APIRouter(tags=["detections"])

_risk_service = RiskService()
_duplicate_service = DuplicateService()
_store = DetectionStore()


@router.post("/detections", response_model=DetectionResponse)
def create_detection(payload: DetectionCreate) -> DetectionResponse:
    severity = "large" if payload.confidence >= 0.9 else "medium"
    detections = _store.nearby(payload.latitude, payload.longitude)
    existing_detection = _duplicate_service.find_match(
        detections,
        payload.latitude,
        payload.longitude,
        payload.image_url,
    )

    if existing_detection is not None:
        existing_detection.detection_count += 1
        existing_detection.confidence = max(existing_detection.confidence, payload.confidence)
        existing_detection.risk_score = _risk_service.score(
            existing_detection.severity,
            detection_count=existing_detection.detection_count,
        )
        existing_detection.detected_at = datetime.utcnow()
        if payload.image_url is not None:
            existing_detection.image_url = payload.image_url
        _store.upsert(existing_detection)
        return DetectionResponse.model_validate(existing_detection.model_dump())

    detection = PotholeDetection(
        id=_store.next_id(),
        hazard_type=payload.hazard_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        confidence=payload.confidence,
        severity=severity,
        detection_count=1,
        risk_score=_risk_service.score(severity, detection_count=1),
        image_url=payload.image_url,
    )
    _store.upsert(detection)
    return DetectionResponse.model_validate(detection.model_dump())


@router.get("/detections", response_model=list[DetectionResponse])
def list_detections() -> list[DetectionResponse]:
    return [DetectionResponse.model_validate(detection.model_dump()) for detection in _store.list_all()]
