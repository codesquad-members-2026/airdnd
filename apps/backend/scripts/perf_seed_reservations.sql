-- ============================================================================
-- perf_seed_reservations.sql
-- 예약 동시성/오버랩 쿼리(EXPLAIN ANALYZE) 검증용 대용량 더미 데이터.
--
-- ⚠️ 로컬 성능 테스트 전용. Flyway 와 무관하며 prod 에 절대 들어가지 않습니다.
--   - 합성 룸 id = 100000 ~ (PERF 전용 범위) → 앱 룸 1,2,3 및 시드와 안 겹침.
--   - 재실행 가능: 맨 앞에서 PERF 범위만 지우고 다시 채웁니다.
--
-- 실행:
--   docker exec -i airdnd-mysql mysql -uroot -proot airdnd < apps/backend/scripts/perf_seed_reservations.sql
-- 또는 mysql 클라이언트에서: SOURCE apps/backend/scripts/perf_seed_reservations.sql;
-- ============================================================================

-- ── 규모 파라미터 (필요하면 조정) ───────────────────────────
SET @base_room  = 100000;   -- 합성 룸 시작 id
SET @num_rooms  = 500;      -- 룸 개수            (recursion ≤ 1000 이어야 함)
SET @per_room   = 200;      -- 룸당 예약 수        (recursion ≤ 1000 이어야 함)
SET @start_date = '2024-01-01';
-- 총 예약 = num_rooms * per_room = 500 * 200 = 100,000 행

-- ── 멱등성: PERF 범위 정리 (FK 때문에 예약 먼저) ───────────────
DELETE FROM reservations WHERE room_id >= @base_room;
DELETE FROM rooms        WHERE id      >= @base_room;

-- ── 회원 보장: 시드가 없어도 FK 가 깨지지 않도록 최소 멤버 삽입 ──
INSERT IGNORE INTO members (id, email, nickname, role, oauth_provider, oauth_id, is_deleted) VALUES
  (9001, 'host@airdnd.dev',   'perf host',  'HOST',  'GOOGLE', 'seed-google-host-9001',  FALSE),
  (9002, 'guest1@airdnd.dev',  'perf g1',   'GUEST', 'GOOGLE', 'seed-google-guest-9002', FALSE),
  (9003, 'guest2@airdnd.dev',  'perf g2',   'GUEST', 'GOOGLE', 'seed-google-guest-9003', FALSE),
  (9004, 'guest3@airdnd.dev',  'perf g3',   'GUEST', 'GOOGLE', 'seed-google-guest-9004', FALSE),
  (9005, 'guest4@airdnd.dev',  'perf g4',   'GUEST', 'GOOGLE', 'seed-google-guest-9005', FALSE),
  (9006, 'guest5@airdnd.dev',  'perf g5',   'GUEST', 'GOOGLE', 'seed-google-guest-9006', FALSE),
  (9007, 'guest6@airdnd.dev',  'perf g6',   'GUEST', 'GOOGLE', 'seed-google-guest-9007', FALSE),
  (9008, 'guest7@airdnd.dev',  'perf g7',   'GUEST', 'GOOGLE', 'seed-google-guest-9008', FALSE),
  (9009, 'guest8@airdnd.dev',  'perf g8',   'GUEST', 'GOOGLE', 'seed-google-guest-9009', FALSE),
  (9010, 'guest9@airdnd.dev',  'perf g9',   'GUEST', 'GOOGLE', 'seed-google-guest-9010', FALSE),
  (9011, 'guest10@airdnd.dev', 'perf g10',  'GUEST', 'GOOGLE', 'seed-google-guest-9011', FALSE),
  (9012, 'guest11@airdnd.dev', 'perf g11',  'GUEST', 'GOOGLE', 'seed-google-guest-9012', FALSE),
  (9013, 'guest12@airdnd.dev', 'perf g12',  'GUEST', 'GOOGLE', 'seed-google-guest-9013', FALSE);

-- ── 합성 룸 생성 (host_id = 9001) ──────────────────────────
INSERT INTO rooms
  (id, host_id, host_name, name, region, description, address, country_code,
   latitude, longitude, price_per_night, max_capacity, allows_infants, allows_pets, is_active, is_deleted)
WITH RECURSIVE rseq AS (
  SELECT 0 AS n
  UNION ALL
  SELECT n + 1 FROM rseq WHERE n < @num_rooms - 1
)
SELECT
  @base_room + n,
  9001,
  'perf host',
  CONCAT('perf room ', n),
  '서울',
  'perf seed room',
  CONCAT('perf addr ', n),
  'KR',
  37.500000000000,
  127.000000000000,
  100000,
  4,
  TRUE, FALSE,
  FALSE,   -- is_active=FALSE: 앱 목록(findAllByIsActive)에 노출되지 않도록 숨김
  FALSE
FROM rseq;

-- ── 예약 생성: 룸당 per_room 건, 룸 내부에서는 5일 간격으로 비겹침 ──
--   n = roomIdx*per_room + k  →  room_id = base + roomIdx, k 번째 숙박
--   check_in  = start + k*5일,  숙박일수 = 1 + (roomIdx+k)%4  (1~4박)
--   status    = 10건 중 1건 CANCELLED, 1건 PENDING, 나머지 CONFIRMED
INSERT INTO reservations
  (guest_id, room_id, check_in_date, check_out_date, total_price,
   adult_count, child_count, infant_count, has_pets, status, created_at)
WITH RECURSIVE
  rseq AS (
    SELECT 0 AS rn UNION ALL SELECT rn + 1 FROM rseq WHERE rn < @num_rooms - 1
  ),
  kseq AS (
    SELECT 0 AS k  UNION ALL SELECT k + 1  FROM kseq WHERE k  < @per_room - 1
  )
SELECT
  9002 + ((r.rn * @per_room + k.k) % 12)                                  AS guest_id,
  @base_room + r.rn                                                       AS room_id,
  DATE_ADD(@start_date, INTERVAL k.k * 5 DAY)                             AS check_in_date,
  DATE_ADD(@start_date, INTERVAL k.k * 5 + 1 + ((r.rn + k.k) % 4) DAY)    AS check_out_date,
  100000 * (1 + ((r.rn + k.k) % 4))                                       AS total_price,
  1 + (k.k % 3)                                                           AS adult_count,
  (k.k % 2)                                                               AS child_count,
  0                                                                       AS infant_count,
  FALSE                                                                   AS has_pets,
  CASE (r.rn * @per_room + k.k) % 10
       WHEN 0 THEN 'CANCELLED'
       WHEN 1 THEN 'PENDING'
       ELSE        'CONFIRMED'
  END                                                                     AS status,
  NOW()                                                                   AS created_at
FROM rseq r CROSS JOIN kseq k;

-- ── 확인 ───────────────────────────────────────────────────
SELECT COUNT(*) AS total_reservations,
       COUNT(DISTINCT room_id) AS rooms,
       MIN(check_in_date) AS first_in,
       MAX(check_out_date) AS last_out
FROM reservations WHERE room_id >= @base_room;
