-- ============================================================================
-- perf_explain_overlap.sql
-- 오버랩(중복 예약) 쿼리의 실행계획 비교: 인덱스 전/후.
-- 먼저 perf_seed_reservations.sql 로 데이터를 채운 뒤 실행하세요.
-- ============================================================================

-- 테스트 대상: 합성 룸 하나 (데이터가 많은 룸)
SET @room_id      = 100007;
-- 이 룸의 k=10 번째 예약과 겹치도록 잡은 날짜 (충돌이 존재하는 케이스)
SET @new_check_in  = '2024-02-20';   -- start(2024-01-01) + 50일
SET @new_check_out = '2024-02-23';

-- ── 1) 인덱스 없이: 실행계획 + 실측 ─────────────────────────
--   기대: type=ALL 또는 room_id FK 인덱스만 사용 → 날짜는 필터로 처리
EXPLAIN
SELECT 1 FROM reservations
WHERE room_id = @room_id
  AND status IN ('CONFIRMED','PENDING')
  AND check_in_date  < @new_check_out
  AND check_out_date > @new_check_in
LIMIT 1;

EXPLAIN ANALYZE
SELECT 1 FROM reservations
WHERE room_id = @room_id
  AND status IN ('CONFIRMED','PENDING')
  AND check_in_date  < @new_check_out
  AND check_out_date > @new_check_in
LIMIT 1;

-- ── 2) 후보 인덱스 추가 ─────────────────────────────────────
--   room_id(등치) → check_out_date(범위, 종료 안 된 예약만) → check_in_date(잔여필터)
CREATE INDEX idx_res_room_dates
  ON reservations (room_id, check_out_date, check_in_date);

-- ── 3) 인덱스 적용 후: 같은 쿼리 재측정 ─────────────────────
--   기대: type=range, key=idx_res_room_dates, rows 소수
EXPLAIN
SELECT 1 FROM reservations
WHERE room_id = @room_id
  AND status IN ('CONFIRMED','PENDING')
  AND check_in_date  < @new_check_out
  AND check_out_date > @new_check_in
LIMIT 1;

EXPLAIN ANALYZE
SELECT 1 FROM reservations
WHERE room_id = @room_id
  AND status IN ('CONFIRMED','PENDING')
  AND check_in_date  < @new_check_out
  AND check_out_date > @new_check_in
LIMIT 1;

-- ── 4) 충돌 없는 케이스도 확인 (먼 미래 날짜) ────────────────
EXPLAIN ANALYZE
SELECT 1 FROM reservations
WHERE room_id = @room_id
  AND status IN ('CONFIRMED','PENDING')
  AND check_in_date  < '2030-01-05'
  AND check_out_date > '2030-01-01'
LIMIT 1;

-- ── 정리(원하면): 인덱스 제거하고 다시 비교 ─────────────────
-- DROP INDEX idx_res_room_dates ON reservations;
