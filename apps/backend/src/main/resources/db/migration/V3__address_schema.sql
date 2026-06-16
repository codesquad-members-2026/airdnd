ALTER TABLE listing
    DROP COLUMN city,
    DROP COLUMN district,
    DROP COLUMN street_address,
    DROP COLUMN zip_code,
    ADD COLUMN road_address VARCHAR(255) NOT NULL DEFAULT '' AFTER detail_address,
    ADD COLUMN postal_code  VARCHAR(5)   NOT NULL DEFAULT '' AFTER road_address,
    ADD COLUMN lat_lng      POINT        NOT NULL            AFTER postal_code,
    ADD COLUMN sido_code    VARCHAR(10)  NOT NULL DEFAULT '' AFTER lat_lng,
    ADD COLUMN sigungu_code VARCHAR(10)  NOT NULL DEFAULT '' AFTER sido_code;

CREATE SPATIAL INDEX spat_listing_lat_lng ON listing (lat_lng);
CREATE INDEX idx_listing_region ON listing (sido_code, sigungu_code);
CREATE INDEX idx_listing_host_id ON listing (host_id);
