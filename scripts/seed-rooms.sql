-- Seed N rooms bounded by Korean coordinates, clustered around 10 city anchors.
-- Expects the caller to prepend:  SET @seed_count = <N>;
-- All seed rows are tagged with host oauth_id='seed-host' so they can be reset cleanly.
--
-- Distribution is intentionally *non-uniform* to mirror real inventory:
--   * City weights are Seoul/Gyeonggi-heavy (see anchors.lo/hi cumulative ranges).
--   * Within a city, points are denser near the center (triangular jitter), with a
--     per-city spread so metro areas (Gyeonggi, Gangwon) sprawl wider than Seoul.

SET SESSION cte_max_recursion_depth = 1000000;

-- 1) Ensure a single seed host member exists (rooms.host_id -> members.id FK).
INSERT INTO members (email, nickname, role, oauth_provider, oauth_id, is_deleted)
SELECT 'seed-host@airdnd.local', 'Seed Host', 'HOST', 'GOOGLE', 'seed-host', FALSE
WHERE NOT EXISTS (SELECT 1 FROM members WHERE oauth_id = 'seed-host');

SET @host_id = (SELECT id FROM members WHERE oauth_id = 'seed-host');

-- 2) Generate @seed_count rooms. Each row takes a deterministic bucket (n % 100) and is
--    assigned the city whose cumulative weight range covers it, then jittered.
--    The bucket MUST be deterministic: a RAND()-derived bucket gets re-evaluated per
--    anchor inside the join, so a row matches 0..n ranges and the row count explodes.
INSERT INTO rooms (host_id, host_name, name, region, description, address, country_code,
                   latitude, longitude, price_per_night, max_capacity,
                   allows_infants, allows_pets, is_active, is_deleted)
WITH RECURSIVE seq (n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < @seed_count
),
gen (n, bucket) AS (
    SELECT n, n % 100 FROM seq
),
-- lo/hi are cumulative weight ranges (sum = 100); spread is the +/- jitter in degrees.
anchors (region, lat, lng, lo, hi, spread) AS (
              SELECT '서울특별시',     37.566500, 126.978000,  0,  30, 0.08
    UNION ALL SELECT '경기도',         37.263600, 127.028600, 30,  52, 0.18
    UNION ALL SELECT '인천광역시',     37.456300, 126.705200, 52,  60, 0.10
    UNION ALL SELECT '부산광역시',     35.179600, 129.075600, 60,  70, 0.10
    UNION ALL SELECT '대구광역시',     35.871400, 128.601400, 70,  75, 0.08
    UNION ALL SELECT '대전광역시',     36.350400, 127.384500, 75,  79, 0.07
    UNION ALL SELECT '광주광역시',     35.159500, 126.852600, 79,  83, 0.07
    UNION ALL SELECT '제주특별자치도', 33.499600, 126.531200, 83,  90, 0.12
    UNION ALL SELECT '강원특별자치도', 37.751900, 128.876100, 90,  95, 0.20
    UNION ALL SELECT '전북특별자치도', 35.824200, 127.148000, 95, 100, 0.12
)
SELECT
    @host_id,
    'Seed Host',
    CONCAT('[seed] ', a.region, ' 숙소 #', g.n),
    a.region,
    CONCAT(a.region, ' 인근의 시드 데이터 숙소입니다.'),
    CONCAT(a.region, ' 일대'),
    'KR',
    -- (RAND()+RAND()-1) is triangular on [-1,1]: denser near 0, so denser near city center.
    ROUND(a.lat + (RAND() + RAND() - 1) * a.spread, 9),
    ROUND(a.lng + (RAND() + RAND() - 1) * a.spread, 9),
    (50 + FLOOR(RAND() * 250)) * 1000,     -- 50,000 ~ 299,000 KRW / night
    1 + FLOOR(RAND() * 8),                 -- 1 ~ 8 guests
    RAND() < 0.5,                          -- allows_infants
    RAND() < 0.3,                          -- allows_pets
    TRUE,
    FALSE
FROM gen g
JOIN anchors a ON g.bucket >= a.lo AND g.bucket < a.hi;

-- 3) Give every seed room 4-5 images (idempotent: only if the room has none yet).
--    Image #1 is the representative; the rest are gallery shots. The per-room count
--    (4 or 5) is deterministic via (room_id % 2) so re-runs are stable, and each URL
--    carries a distinct seed so the images actually differ.
INSERT INTO room_images (room_id, image_url, is_representative)
WITH nums (idx) AS (
              SELECT 1
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
)
SELECT r.id,
       CONCAT('https://picsum.photos/seed/airdnd', r.id, '-', n.idx, '/800/600'),
       n.idx = 1
FROM rooms r
JOIN nums n ON n.idx <= 5 + (r.id % 2)   -- 4 images for even ids, 5 for odd
WHERE r.host_id = @host_id
  AND NOT EXISTS (
      SELECT 1 FROM room_images ri WHERE ri.room_id = r.id
  );

SELECT CONCAT('Seeded. Total seed rooms now: ',
              (SELECT COUNT(*) FROM rooms WHERE host_id = @host_id)) AS result;
