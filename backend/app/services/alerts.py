from __future__ import annotations

from datetime import datetime, timedelta

from app.models import PotholeDetection, RoadStatus


class AlertService:
    def __init__(self) -> None:
        self._last_alert_sent_at: dict[str, datetime] = {}

    def _alert_key(self, detection: PotholeDetection) -> str:
        return f"{detection.id}:{detection.status.value}:{detection.risk_score}"

    def _title_for(self, detection: PotholeDetection) -> str:
        if detection.hazard_type.value == "pedestrian":
            return "Pedestrian Ahead"
        if detection.hazard_type.value == "animal":
            return "Animal Crossing"
        if detection.severity.lower() == "large" or detection.risk_score >= 90:
            return "Large Pothole Ahead"
        if detection.severity.lower() == "medium":
            return "Medium Pothole Ahead"
        return "Small Pothole Ahead"

    def _message_for(self, detection: PotholeDetection) -> str:
        if detection.hazard_type.value == "pedestrian":
            return "Pedestrian detected ahead. Reduce speed immediately."
        if detection.hazard_type.value == "animal":
            return "Animal crossing ahead. Slow down and stay alert."
        if detection.severity.lower() == "large" or detection.risk_score >= 90:
            return "Large pothole detected. Please reduce speed and keep distance."
        if detection.severity.lower() == "medium":
            return "Medium pothole detected. Slow down and prepare to avoid impact."
        return "Small pothole detected. Stay alert and drive cautiously."

    def active_alerts(
        self,
        detections: list[PotholeDetection],
        throttle_seconds: int = 90,
    ) -> list[dict[str, str | int]]:
        now = datetime.utcnow()
        active_alerts: list[dict[str, str | int]] = []

        for detection in detections:
            if detection.status == RoadStatus.repaired:
                continue
            if detection.risk_score < 70 and detection.hazard_type.value == "pothole":
                continue

            key = self._alert_key(detection)
            last_sent_at = self._last_alert_sent_at.get(key)
            if last_sent_at is not None and now - last_sent_at < timedelta(seconds=throttle_seconds):
                continue

            self._last_alert_sent_at[key] = now
            active_alerts.append(
                {
                    "id": detection.id or 0,
                    "title": self._title_for(detection),
                    "message": self._message_for(detection),
                    "severity": "critical" if detection.risk_score >= 90 else detection.severity,
                    "detection_id": detection.id or 0,
                    "risk_score": detection.risk_score,
                    "created_at": now.isoformat(),
                }
            )

        return active_alerts
