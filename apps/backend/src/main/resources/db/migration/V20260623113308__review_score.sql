-- 리뷰 점수 역정규화 통계 테이블 (listing 1:1)
CREATE TABLE listing_review_summary
(
    listing_id     BIGINT       NOT NULL,
    rating_1_count INT          NOT NULL DEFAULT 0, -- 1점 리뷰 개수
    rating_2_count INT          NOT NULL DEFAULT 0, -- 2점 리뷰 개수
    rating_3_count INT          NOT NULL DEFAULT 0, -- 3점 리뷰 개수
    rating_4_count INT          NOT NULL DEFAULT 0, -- 4점 리뷰 개수
    rating_5_count INT          NOT NULL DEFAULT 0, -- 5점 리뷰 개수
    review_count   INT AS (rating_1_count + rating_2_count + rating_3_count
        + rating_4_count + rating_5_count) STORED,  -- 총 리뷰 개수 (파생)
    rating_avg     DECIMAL(3, 2) AS (
        (rating_1_count + 2 * rating_2_count + 3 * rating_3_count
            + 4 * rating_4_count + 5 * rating_5_count)
            / NULLIF(rating_1_count + rating_2_count + rating_3_count
            + rating_4_count + rating_5_count, 0)
        ) STORED,                                   -- 평균 별점 (파생, 리뷰 0건이면 NULL)
    PRIMARY KEY (listing_id),
    KEY            idx_summary_rating_avg (rating_avg),
    KEY            idx_summary_review_count (review_count),
    CONSTRAINT fk_summary_listing
        FOREIGN KEY (listing_id) REFERENCES listing (id)
            ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
