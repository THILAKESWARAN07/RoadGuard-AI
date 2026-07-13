from __future__ import annotations

from sqlalchemy import func, select, text

from app.db import get_session, initialize_database
from app.db_models import DetectionRecord
from app.models import PotholeDetection, RoadStatus


class DetectionStore:
    def __init__(self) -> None:
        initialize_database()

    def _to_domain(self, record: DetectionRecord) -> PotholeDetection:
        return PotholeDetection(
            id=record.id,
            hazard_type=record.hazard_type,
            latitude=record.latitude,
            longitude=record.longitude,
            confidence=record.confidence,
            severity=record.severity,
            detection_count=record.detection_count,
            risk_score=record.risk_score,
            detected_at=record.detected_at,
            repaired_at=record.repaired_at,
            image_url=record.image_url,
            status=RoadStatus(record.status),
        )

    def _apply_domain(self, record: DetectionRecord, detection: PotholeDetection) -> DetectionRecord:
        record.hazard_type = detection.hazard_type.value
        record.latitude = detection.latitude
        record.longitude = detection.longitude
        record.confidence = detection.confidence
        record.severity = detection.severity
        record.detection_count = detection.detection_count
        record.risk_score = detection.risk_score
        record.detected_at = detection.detected_at
        record.repaired_at = detection.repaired_at
        record.image_url = detection.image_url
        record.status = detection.status.value
        return record

    def _sync_location(self, session, detection_id: int, latitude: float, longitude: float) -> None:
        bind = session.get_bind()
        if bind is None or bind.dialect.name != "postgresql":
            return

        session.execute(
            text(
                "UPDATE detections "
                "SET location = ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography "
                "WHERE id = :detection_id"
            ),
            {"detection_id": detection_id, "latitude": latitude, "longitude": longitude},
        )

    def list_all(self) -> list[PotholeDetection]:
        with get_session() as session:
            records = session.scalars(select(DetectionRecord).order_by(DetectionRecord.detected_at.desc())).all()
            return [self._to_domain(record) for record in records]

    def get_by_id(self, detection_id: int) -> PotholeDetection | None:
        with get_session() as session:
            record = session.get(DetectionRecord, detection_id)
            if record is None:
                return None
            return self._to_domain(record)

    def next_id(self) -> int:
        with get_session() as session:
            highest_id = session.scalar(select(DetectionRecord.id).order_by(DetectionRecord.id.desc()).limit(1))
            return 1 if highest_id is None else highest_id + 1

    def upsert(self, detection: PotholeDetection) -> PotholeDetection:
        with get_session() as session:
            record = session.get(DetectionRecord, detection.id)
            if record is None:
                record = DetectionRecord(id=detection.id or self.next_id())
                session.add(record)

            self._apply_domain(record, detection)
            session.flush()
            self._sync_location(session, record.id, detection.latitude, detection.longitude)
            session.commit()
            session.refresh(record)
            return self._to_domain(record)

    def recent(self, limit: int = 5) -> list[PotholeDetection]:
        with get_session() as session:
            records = session.scalars(
                select(DetectionRecord).order_by(DetectionRecord.detected_at.desc()).limit(limit)
            ).all()
            return [self._to_domain(record) for record in records]

    def nearby(self, latitude: float, longitude: float, radius_meters: float = 10.0) -> list[PotholeDetection]:
        with get_session() as session:
            bind = session.get_bind()
            if bind is not None and bind.dialect.name == "postgresql":
                records = session.execute(
                    select(DetectionRecord).where(
                        text(
                            "ST_DWithin("
                            "location, "
                            "ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, "
                            ":radius_meters"
                            ")"
                        )
                    ).params(latitude=latitude, longitude=longitude, radius_meters=radius_meters)
                ).scalars().all()
                return [self._to_domain(record) for record in records]

        earth_radius_meters = 6_371_000.0
        latitude_expr = func.radians(DetectionRecord.latitude)
        longitude_expr = func.radians(DetectionRecord.longitude)
        target_latitude = func.radians(latitude)
        target_longitude = func.radians(longitude)
        haversine = 2 * earth_radius_meters * func.asin(
            func.sqrt(
                func.pow(func.sin((latitude_expr - target_latitude) / 2), 2)
                + func.cos(target_latitude)
                * func.cos(latitude_expr)
                * func.pow(func.sin((longitude_expr - target_longitude) / 2), 2)
            )
        )

        with get_session() as session:
            records = session.scalars(select(DetectionRecord).where(haversine <= radius_meters)).all()
            return [self._to_domain(record) for record in records]

    def mark_repaired(self, detection_id: int) -> PotholeDetection | None:
        with get_session() as session:
            record = session.get(DetectionRecord, detection_id)
            if record is None:
                return None

            record.status = RoadStatus.repaired.value
            session.commit()
            session.refresh(record)
            return self._to_domain(record)
