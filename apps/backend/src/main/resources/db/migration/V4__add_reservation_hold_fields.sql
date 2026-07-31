-- KRW 총액: INT(최대 약 21억) → BIGINT. 가격 × 박수 누적 시 오버플로 방지.
-- (H2 는 한 ALTER 문에 여러 동작을 콤마로 나열하는 것을 지원하지 않으므로 문장을 분리한다)
ALTER TABLE reservations MODIFY total_price BIGINT NOT NULL;

ALTER TABLE reservations
    ADD COLUMN expires_at TIMESTAMP NULL
        COMMENT 'PENDING 홀드 만료 시각. 이 시각 이후의 PENDING 은 점유로 보지 않는다(결제 미완료 자동 해제)';

-- 점유 판정(지연 만료) 및 만료 홀드 정리용
CREATE INDEX idx_res_status_expires ON reservations (status, expires_at);
