from math import atan2, cos, radians, sin, sqrt

from app.models import PotholeDetection
from app.services.similarity import SimilarityService


class DuplicateService:
    def __init__(self) -> None:
        self._similarity_service = SimilarityService()

    def within_radius_meters(
        self,
        lat_a: float,
        lon_a: float,
        lat_b: float,
        lon_b: float,
        radius_meters: float = 10.0,
    ) -> bool:
        earth_radius_meters = 6371000.0
        delta_lat = radians(lat_b - lat_a)
        delta_lon = radians(lon_b - lon_a)
        start_lat = radians(lat_a)
        end_lat = radians(lat_b)

        a = sin(delta_lat / 2) ** 2 + cos(start_lat) * cos(end_lat) * sin(delta_lon / 2) ** 2
        distance = 2 * earth_radius_meters * atan2(sqrt(a), sqrt(1 - a))
        return distance <= radius_meters

    def find_match(
        self,
        detections: list[PotholeDetection],
        latitude: float,
        longitude: float,
        image_url: str | None = None,
        radius_meters: float = 10.0,
        similarity_threshold: float = 0.75,
    ) -> PotholeDetection | None:
        for detection in detections:
            if not self.within_radius_meters(
                detection.latitude,
                detection.longitude,
                latitude,
                longitude,
                radius_meters,
            ):
                continue

            similarity = self._similarity_service.image_similarity(detection.image_url, image_url)
            if image_url is None or similarity >= similarity_threshold:
                return detection
        return None
