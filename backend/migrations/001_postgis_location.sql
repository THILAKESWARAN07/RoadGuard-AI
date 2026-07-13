CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE detections
    ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

UPDATE detections
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

CREATE INDEX IF NOT EXISTS ix_detections_location
    ON detections USING GIST (location);
