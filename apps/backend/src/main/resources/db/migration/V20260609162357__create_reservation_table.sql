CREATE TABLE reservation_date
(
    id BIGINT NOT NULL AUTO_INCREMENT,
    listing_id          BIGINT NOT NULL,
    stay_date           DATE   NOT NULL,
    reservation_id      BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_listing_date (listing_id, stay_date),
    KEY idx_resdate_reservation (reservation_id),
    CONSTRAINT fk_resdate_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation (reservation_id),
    CONSTRAINT fk_resdate_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
