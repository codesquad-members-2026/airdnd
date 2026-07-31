CREATE TABLE payments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Surrogate Key',
      paypal_order_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'PayPal Orders v2 order id (capture 시 조회 키)',
      reservation_id BIGINT NOT NULL COMMENT '결제 대상 예약 (주문 생성 시 PENDING 으로 선점된 예약). 예약 상세(숙소·일정·인원·금액)는 reservations 에서 조회',
      paypal_amount DECIMAL(15, 2) NOT NULL COMMENT '실제 PayPal 청구 금액',
      currency VARCHAR(3) NOT NULL COMMENT '결제 통화 (예: USD)',
      status VARCHAR(20) NOT NULL COMMENT 'CREATED, CAPTURED, FAILED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
