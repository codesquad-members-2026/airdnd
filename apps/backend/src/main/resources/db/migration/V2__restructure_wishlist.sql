SET NAMES utf8mb4;

DROP TABLE IF EXISTS wishlist;

-- 위시리스트 그룹
CREATE TABLE wishlist
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    member_id  BIGINT       NOT NULL,
    name       VARCHAR(100) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 최근 수정순 정렬용(선택)
    PRIMARY KEY (id),
    KEY        idx_wishlist_member_id (member_id),
    CONSTRAINT fk_wishlist_member
        FOREIGN KEY (member_id) REFERENCES member (id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 위시리스트 아이템 (복합 PK)
CREATE TABLE wishlist_item
(
    wishlist_id BIGINT   NOT NULL,
    listing_id  BIGINT   NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wishlist_id, listing_id),
    KEY         idx_wishlist_item_listing_id (listing_id),
    CONSTRAINT fk_wishlist_item_wishlist
        FOREIGN KEY (wishlist_id) REFERENCES wishlist (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_item_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;