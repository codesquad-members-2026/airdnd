-- V9 created `location` as a plain POINT generated column. MySQL's optimizer only uses a
-- SPATIAL index when the column is SRID-restricted; a plain POINT (even if every value is
-- SRID 0) is ignored, so MBRContains full-scanned the table. Recreate the column with an
-- explicit SRID 0 attribute and rebuild the spatial index so idx_rooms_location is usable.
--
-- NOTE: this rebuilds the table once (one-time cost on ~1M rows). The generated column is
-- backfilled automatically from longitude/latitude.
ALTER TABLE rooms DROP INDEX idx_rooms_location;
ALTER TABLE rooms DROP COLUMN location;
ALTER TABLE rooms
    ADD COLUMN location POINT
        GENERATED ALWAYS AS (ST_SRID(POINT(longitude, latitude), 0)) STORED NOT NULL SRID 0;

CREATE SPATIAL INDEX idx_rooms_location ON rooms (location);
