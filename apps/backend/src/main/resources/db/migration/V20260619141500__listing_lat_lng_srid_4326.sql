DROP INDEX spat_listing_lat_lng ON listing;

UPDATE listing
SET lat_lng = ST_SRID(lat_lng, 4326)
WHERE ST_SRID(lat_lng) <> 4326;

ALTER TABLE listing
    MODIFY lat_lng POINT NOT NULL SRID 4326;

CREATE SPATIAL INDEX spat_listing_lat_lng ON listing (lat_lng);
