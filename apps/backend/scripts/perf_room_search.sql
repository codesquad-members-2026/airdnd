-- ============================================================================
-- perf_room_search.sql
-- Baseline diagnostics for RoomQueryRepositoryImpl.findByRoomSearchRequest,
-- BEFORE adding any index. Run these in a MySQL client against the dev DB.
--
-- Prereq:  scripts/seed-rooms.sh 100000      (reseed; the DB was left clean)
-- Connect: docker compose exec -e MYSQL_PWD=airdnd mysql mysql -uairdnd airdnd
--
-- The app query (QueryDSL) reduces to roughly:
--   SELECT * FROM rooms
--   WHERE lower(region) LIKE ?            -- containsIgnoreCase
--     AND price_per_night BETWEEN ? AND ?
--     AND allows_pets = ?
--     AND max_capacity >= ?               -- guests
--     AND latitude  BETWEEN ? AND ?       -- bbox south..north
--     AND longitude BETWEEN ? AND ?       -- bbox west..east
--     AND allows_infants = TRUE           -- only when infants > 0
--     AND is_active = TRUE
--     AND is_deleted = FALSE
--   LIMIT 200;
--
-- ----------------------------------------------------------------------------
-- HOW TO READ EXPLAIN ANALYZE (no index exists yet, so expect full scans):
--   * "Table scan on rooms (cost=... rows=N) (actual time=a..b rows=R loops=1)"
--       R   = ROWS ACTUALLY SCANNED (read from the storage engine).
--       b   = wall-clock ms to finish that node (cumulative).
--   * "Filter: (<cond>) (actual rows=M loops=1)"
--       M   = ROWS THAT MATCHED the predicate (selectivity).
--   The gap between R (scanned) and M (matched) is what an index would remove.
--
-- TWO TRAPS:
--   1) LIMIT short-circuits the scan. With LIMIT and NO usable index/ORDER BY,
--      MySQL stops as soon as it has filled the limit -- so a BROAD filter looks
--      "fast" (stops early) and a NARROW/empty filter scans the WHOLE table.
--      => To measure true scan cost & selectivity, use the COUNT(*) variants
--         (no LIMIT) below. Use the LIMIT variants only to see the app's real
--         latency behavior.
--   2) EXPLAIN ANALYZE *executes* the query. Fine for SELECT/COUNT; just know
--      it runs for real. Run each a second time to warm the buffer pool if you
--      care about steady-state numbers.
-- ============================================================================


-- ===== 0) Sanity: how much data are we measuring against? ====================
SELECT COUNT(*) AS total_rooms,
       SUM(is_active = TRUE AND is_deleted = FALSE) AS visible_rooms
FROM rooms;


-- ===== A) FULL-SCAN BASELINE (the floor every query starts from) =============
-- Pure table scan cost with only the always-on visibility predicates.
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE is_active = TRUE AND is_deleted = FALSE;


-- ===== B) EACH PREDICATE IN ISOLATION =======================================
-- COUNT(*) form => no LIMIT short-circuit; shows true scan + true selectivity.

-- B1. region (containsIgnoreCase -> non-sargable leading-wildcard LIKE)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE lower(region) LIKE lower('%서울%')
  AND is_active = TRUE AND is_deleted = FALSE;

-- B2a. price: min only
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE price_per_night >= 150000
  AND is_active = TRUE AND is_deleted = FALSE;

-- B2b. price: max only
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE price_per_night <= 100000
  AND is_active = TRUE AND is_deleted = FALSE;

-- B2c. price: between
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE price_per_night BETWEEN 80000 AND 200000
  AND is_active = TRUE AND is_deleted = FALSE;

-- B3. allows_pets (low-selectivity boolean ~30%)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE allows_pets = TRUE
  AND is_active = TRUE AND is_deleted = FALSE;

-- B4. guests -> max_capacity >= N
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE max_capacity >= 4
  AND is_active = TRUE AND is_deleted = FALSE;

-- B5. latitude only (one half of the bbox)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE latitude BETWEEN 37.42 AND 37.70
  AND is_active = TRUE AND is_deleted = FALSE;

-- B6. longitude only (other half of the bbox)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE longitude BETWEEN 126.76 AND 127.18
  AND is_active = TRUE AND is_deleted = FALSE;

-- B7. infants -> allows_infants = TRUE (~50%)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE allows_infants = TRUE
  AND is_active = TRUE AND is_deleted = FALS

-- ===== C) BBOX (the main thing the index change targets) =====================
-- Both lat & lng together, as the map sends them.

-- C1. Seoul-sized box (selective: small slice of 100k)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE latitude  BETWEEN 37.42 AND 37.70
  AND longitude BETWEEN 126.76 AND 127.18
  AND is_active = TRUE AND is_deleted = FALSE;

-- C2. Nationwide box (broad: matches almost everything)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE latitude  BETWEEN 33.0 AND 38.6
  AND longitude BETWEEN 125.0 AND 130.0
  AND is_active = TRUE AND is_deleted = FALSE;

-- C3. Empty box (ocean: matches nothing -> worst case, scans EVERYTHING)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE latitude  BETWEEN 35.0 AND 35.05
  AND longitude BETWEEN 131.0 AND 131.05
  AND is_active = TRUE AND is_deleted = FALSE;


-- ===== D) THE FULL APP QUERY ================================================
-- D1. Realistic combined filter, COUNT form (true scan + selectivity).
EXPLAIN ANALYZE
SELECT COUNT(*) FROM rooms
WHERE lower(region) LIKE lower('%서울%')
  AND price_per_night BETWEEN 80000 AND 250000
  AND allows_pets = FALSE
  AND max_capacity >= 2
  AND latitude  BETWEEN 37.42 AND 37.70
  AND longitude BETWEEN 126.76 AND 127.18
  AND is_active = TRUE AND is_deleted = FALSE;

-- D2. Same filter as the app actually runs it: SELECT * + LIMIT 200.
--     Compare its scanned-rows to D1 to SEE the LIMIT short-circuit (trap #1).
EXPLAIN ANALYZE
SELECT * FROM rooms
WHERE latitude  BETWEEN 37.42 AND 37.70
  AND longitude BETWEEN 126.76 AND 127.18
  AND is_active = TRUE AND is_deleted = FALSE
LIMIT 200;

-- D3. Empty-box + LIMIT 200: the pathological case. LIMIT can't save you when
--     nothing matches -> full 100k scan to return 0 rows.
EXPLAIN ANALYZE
SELECT * FROM rooms
WHERE latitude  BETWEEN 35.0 AND 35.05
  AND longitude BETWEEN 131.0 AND 131.05
  AND is_active = TRUE AND is_deleted = FALSE
LIMIT 200;


-- ===== E) OPTIONAL: storage-engine rows read (privilege permitting) ==========
-- Handler_read_rnd_next ~= rows pulled during a full scan. Needs RELOAD priv
-- for FLUSH STATUS; if denied, ignore this block and rely on EXPLAIN ANALYZE.
-- FLUSH STATUS;
-- SELECT COUNT(*) FROM rooms
--   WHERE latitude BETWEEN 37.42 AND 37.70 AND longitude BETWEEN 126.76 AND 127.18
--     AND is_active = TRUE AND is_deleted = FALSE;
-- SHOW SESSION STATUS LIKE 'Handler_read%';


-- ===== F) OPTIONAL: estimated plan as JSON (pre-execution estimate) ==========
-- "rows_examined_per_scan" / "filtered" show the optimizer's guess vs reality.
EXPLAIN FORMAT=JSON
SELECT * FROM rooms
WHERE latitude  BETWEEN 37.42 AND 37.70
  AND longitude BETWEEN 126.76 AND 127.18
  AND is_active = TRUE AND is_deleted = FALSE
LIMIT 200;
