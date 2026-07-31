ALTER TABLE rooms ADD COLUMN location POINT GENERATED ALWAYS AS (ST_SRID(POINT(longitude, latitude),0)) STORED NOT NULL;


CREATE SPATIAL INDEX idx_rooms_location ON rooms(location);