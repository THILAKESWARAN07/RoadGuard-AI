from app.models import HazardType


class DetectionService:
    def detect(self, frame_path: str) -> list[dict[str, str | float]]:
        return [
            {
                "hazard_type": HazardType.pothole.value,
                "confidence": 0.92,
                "label": "large_pothole",
                "frame_path": frame_path,
            }
        ]
