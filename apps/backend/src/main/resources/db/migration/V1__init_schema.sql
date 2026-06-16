SET NAMES utf8mb4;

CREATE TABLE member
(
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        VARCHAR(50) NULL,
    password       VARCHAR(255) NULL, -- OAuth 회원은 NULL
    nickname       VARCHAR(50) NOT NULL,
    oauth_provider VARCHAR(50) NULL,  -- google, github, naver ...
    oauth_id       VARCHAR(255) NULL, -- provider가 주는 식별자
    profile_url    VARCHAR(500) NULL,
    refresh_token  VARCHAR(500) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_member_user_id (user_id),
    UNIQUE KEY uk_member_nickname (nickname),
    UNIQUE KEY uk_member_oauth (oauth_provider, oauth_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin
(
    id       BIGINT       NOT NULL AUTO_INCREMENT,
    admin_id VARCHAR(50)  NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing
(
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    name            VARCHAR(255)   NOT NULL,
    room_type       VARCHAR(30)    NOT NULL,           -- 집 전체 / 개인실 / 다인실
    description     TEXT NULL,
    city            VARCHAR(50)    NOT NULL,           -- 시/도
    district        VARCHAR(50)    NOT NULL,           -- 시/군/구
    street_address  VARCHAR(255)   NOT NULL,
    detail_address  VARCHAR(255)   NOT NULL,
    zip_code        VARCHAR(10)    NOT NULL,
    host_id         BIGINT         NOT NULL,           -- 호스팅하는 Member
--     lat_lng         POINT          SRID 4326, -- WGS84 좌표계
    max_guests      INT            NOT NULL,
    bedrooms        INT            NOT NULL,
    beds            INT            NOT NULL,
    bathrooms       INT            NOT NULL,
    price_per_night DECIMAL(12, 2) NOT NULL,
    state           VARCHAR(20)    NOT NULL,           -- 전송 / 검토 / 승인
    PRIMARY KEY (id),
--     SPATIAL KEY spat_listing_lat_lng (lat_lng),
--     KEY             idx_listing_host_id (host_id),
    CONSTRAINT fk_listing_host
        FOREIGN KEY (host_id) REFERENCES member (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_image
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    listing_id BIGINT       NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    is_cover   BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    KEY        idx_listing_image_listing_id (listing_id),
    CONSTRAINT fk_listing_image_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_amenity
(
    listing_id BIGINT      NOT NULL,
    amenity    VARCHAR(50) NOT NULL,
    PRIMARY KEY (listing_id, amenity),
    CONSTRAINT fk_listing_amenity_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservation
(
    reservation_id  BIGINT         NOT NULL AUTO_INCREMENT,
    guest_id        BIGINT         NOT NULL,
    listing_id      BIGINT         NOT NULL,
    check_in_date   DATE           NOT NULL,
    check_out_date  DATE           NOT NULL,
    state           VARCHAR(20)    NOT NULL, -- 예약 / 확정 / 취소됨
    adult_guest_num INT            NOT NULL DEFAULT 0,
    child_guest_num INT            NOT NULL DEFAULT 0,
    baby_guest_num  INT            NOT NULL DEFAULT 0,
    pet_guest_num   INT            NOT NULL DEFAULT 0,
    total_price     DECIMAL(12, 2) NOT NULL, -- 예약 시점 총액 스냅샷
    PRIMARY KEY (reservation_id),
    KEY             idx_reservation_guest_id (guest_id),
    KEY             idx_reservation_listing_id (listing_id),
    CONSTRAINT fk_reservation_guest
        FOREIGN KEY (guest_id) REFERENCES member (id),
    CONSTRAINT fk_reservation_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist
(
    listing_id BIGINT NOT NULL,
    member_id  BIGINT NOT NULL,
    PRIMARY KEY (listing_id, member_id),
    KEY        idx_wishlist_member_id (member_id),
    CONSTRAINT fk_wishlist_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_member
        FOREIGN KEY (member_id) REFERENCES member (id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE review
(
    id             BIGINT   NOT NULL AUTO_INCREMENT,
    content        TEXT NULL,
    rating         TINYINT  NOT NULL,                     -- 별점 (1~5 가정)
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    member_id      BIGINT   NOT NULL,                     -- 작성자
    reservation_id BIGINT   NOT NULL,                     -- 어떤 예약에 대한 후기인지
    PRIMARY KEY (id),
    KEY            idx_review_member_id (member_id),
    UNIQUE KEY uk_review_reservation_id (reservation_id), -- 예약 1건당 후기 1개
    CONSTRAINT fk_review_member
        FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_review_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation (reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE review_image
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    image_url  VARCHAR(500) NOT NULL,
    review_id  BIGINT       NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY        idx_review_image_review_id (review_id),
    CONSTRAINT fk_review_image_review
        FOREIGN KEY (review_id) REFERENCES review (id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;