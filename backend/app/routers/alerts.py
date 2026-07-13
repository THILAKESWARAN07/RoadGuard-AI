from fastapi import APIRouter
from pydantic import BaseModel

from app.repositories.detection_store import DetectionStore
from app.services.alerts import AlertService

router = APIRouter(tags=["alerts"])

_store = DetectionStore()
_alert_service = AlertService()


class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    detection_id: int
    risk_score: int
    created_at: str


@router.get("/alerts/active", response_model=list[AlertResponse])
def active_alerts() -> list[AlertResponse]:
    detections = _store.list_all()
    alerts = _alert_service.active_alerts(detections)
    return [AlertResponse.model_validate(alert) for alert in alerts]
