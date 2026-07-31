-- Seed N rooms across the continental US, clustered around major-city anchors, each
-- with multiple images, to test how the spatial-index optimizer behaves once the US is
-- a DENSE cluster. (See apps/backend/docs/room-search-performance-investigation.md)
--
-- Caller prepends:  SET @seed_count = <N>; SET @seed_batch = <B>; SET @seed_images = <I>;
--   @seed_count = 0  -> create NO new rooms, only backfill images on existing US seed
--                       rooms that are missing them (fixes "white box" rooms in place).
--
-- All seed rows are tagged with host oauth_id='seed-host-us', SEPARATE from the Korean
-- 'seed-host', so a US reset removes exactly these and nothing else. Batched so large
-- counts commit in chunks instead of one giant transaction.

-- 1) Ensure a dedicated US seed host exists (rooms.host_id -> members.id FK).
INSERT INTO members (email, nickname, role, oauth_provider, oauth_id, is_deleted)
SELECT 'seed-host-us@airdnd.local', 'Seed Host US', 'HOST', 'GOOGLE', 'seed-host-us', FALSE
WHERE NOT EXISTS (SELECT 1 FROM members WHERE oauth_id = 'seed-host-us');

SET SESSION cte_max_recursion_depth = 1000000;   -- covers one batch's number CTE

DROP PROCEDURE IF EXISTS seed_us_rooms;

DELIMITER $$
CREATE PROCEDURE seed_us_rooms(IN p_total INT, IN p_batch INT, IN p_images INT)
BEGIN
    DECLARE v_done  INT DEFAULT 0;
    DECLARE v_batch INT;
    DECLARE v_host  BIGINT;

    SELECT id INTO v_host FROM members WHERE oauth_id = 'seed-host-us';

    -- ---- Phase 1: rooms (batched) -----------------------------------------
    WHILE v_done < p_total DO
        SET v_batch = LEAST(p_batch, p_total - v_done);

        INSERT INTO rooms (host_id, host_name, name, region, description, address, country_code,
                           latitude, longitude, price_per_night, max_capacity,
                           allows_infants, allows_pets, is_active, is_deleted)
        WITH RECURSIVE seq (i) AS (
            SELECT 1
            UNION ALL
            SELECT i + 1 FROM seq WHERE i < v_batch
        ),
        gen (i, bucket) AS (
            SELECT i, i % 100 FROM seq
        ),
        anchors (region, lat, lng, lo, hi, spread) AS (
                      SELECT 'California',     34.052200, -118.243700,  0,  18, 0.80
            UNION ALL SELECT 'New York',       40.712800,  -74.006000, 18,  34, 0.60
            UNION ALL SELECT 'Illinois',       41.878100,  -87.629800, 34,  44, 0.50
            UNION ALL SELECT 'Texas (Houston)',29.760400,  -95.369800, 44,  52, 0.50
            UNION ALL SELECT 'Arizona',        33.448400, -112.074000, 52,  59, 0.50
            UNION ALL SELECT 'San Francisco',  37.774900, -122.419400, 59,  68, 0.40
            UNION ALL SELECT 'Washington',     47.606200, -122.332100, 68,  75, 0.40
            UNION ALL SELECT 'Florida',        25.761700,  -80.191800, 75,  83, 0.40
            UNION ALL SELECT 'Colorado',       39.739200, -104.990300, 83,  89, 0.50
            UNION ALL SELECT 'Texas (Dallas)', 32.776700,  -96.797000, 89,  95, 0.40
            UNION ALL SELECT 'Georgia',        33.749000,  -84.388000, 95, 100, 0.40
        )
        SELECT
            v_host,
            'Seed Host US',
            CONCAT('[seed-us] ', a.region, ' room #', v_done + g.i),
            a.region,
            CONCAT(a.region, ' seeded test room.'),
            CONCAT(a.region, ', USA'),
            'US',
            ROUND(a.lat + (RAND() + RAND() - 1) * a.spread, 9),
            ROUND(a.lng + (RAND() + RAND() - 1) * a.spread, 9),
            50 + FLOOR(RAND() * 450),
            1 + FLOOR(RAND() * 8),
            RAND() < 0.5,
            RAND() < 0.3,
            TRUE,
            FALSE
        FROM gen g
        JOIN anchors a ON g.bucket >= a.lo AND g.bucket < a.hi;

        SET v_done = v_done + v_batch;
    END WHILE;

    -- ---- Phase 2: images (batched, idempotent) ----------------------------
    -- Give every US seed room p_images images; image #1 is the representative.
    -- NOT EXISTS makes it safe to re-run / resume; LIMIT keeps each batch bounded.
    IF p_images >= 1 THEN
        img_loop: WHILE TRUE DO
            INSERT INTO room_images (room_id, image_url, is_representative)
            WITH RECURSIVE k (n) AS (
                SELECT 1
                UNION ALL
                SELECT n + 1 FROM k WHERE n < p_images
            )
            SELECT t.id,
                   CONCAT('https://picsum.photos/seed/airdnd-', t.id, '-', k.n, '/800/600'),
                   (k.n = 1)
            FROM (
                SELECT r.id FROM rooms r
                WHERE r.host_id = v_host
                  AND NOT EXISTS (SELECT 1 FROM room_images ri WHERE ri.room_id = r.id)
                LIMIT p_batch
            ) t
            CROSS JOIN k;

            IF ROW_COUNT() = 0 THEN
                LEAVE img_loop;
            END IF;
        END WHILE;
    END IF;
END$$
DELIMITER ;

CALL seed_us_rooms(IFNULL(@seed_count, 0), IFNULL(@seed_batch, 10000), IFNULL(@seed_images, 5));

DROP PROCEDURE IF EXISTS seed_us_rooms;

-- Refresh stats so the optimizer re-estimates against the new distribution.
ANALYZE TABLE rooms;

SELECT
  (SELECT COUNT(*) FROM rooms WHERE host_id = (SELECT id FROM members WHERE oauth_id='seed-host-us')) AS us_rooms,
  (SELECT COUNT(*) FROM room_images ri JOIN rooms r ON r.id = ri.room_id
     WHERE r.host_id = (SELECT id FROM members WHERE oauth_id='seed-host-us')) AS us_images;
