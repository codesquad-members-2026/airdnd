CREATE TABLE payment
(
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id VARCHAR(64) NOT NULL, -- 6자 이상 ~ 64자 이하의 문자열
    payment_key VARCHAR(200), -- 토스에서 발급해주는 결제 키, 최대 200자 이하의 랜덤값
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 결제 상태 -> READY, DONE, CANCELED, FAILED
    reservation_id BIGINT NOT NULL,
    method VARCHAR(20), -- 카드 결제, 무통장 입금 등등..
    approved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_id (order_id),
    UNIQUE KEY uq_reservation_id (reservation_id),
    CONSTRAINT fk_payment_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservation (reservation_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;