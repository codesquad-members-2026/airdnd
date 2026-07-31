#!/usr/bin/env bash
# Seed rooms across the continental US directly into the local docker-compose MySQL.
# Mirrors scripts/seed-rooms.sh, but US-bounded, batched, and with multiple images/room.
#
# Usage:
#   scripts/seed-us-rooms.sh [count] [--batch N] [--images N]   # default count 2,000,000
#   scripts/seed-us-rooms.sh 0 --images 5                       # only add images to existing US rooms
#   scripts/seed-us-rooms.sh [count] --reset                    # delete prior US seed first, then insert
#   scripts/seed-us-rooms.sh --reset                            # only delete prior US seed
#
# Seed rooms are owned by host oauth_id='seed-host-us' (SEPARATE from the Korean
# 'seed-host'), so --reset removes exactly what this script created and nothing else.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then set -a; . ./.env; set +a; fi
DB="${MYSQL_DATABASE:-airdnd}"
USER="${MYSQL_USER:-airdnd}"
PASS="${MYSQL_PASSWORD:-airdnd}"
SERVICE="mysql"

COUNT=2000000
BATCH=10000
IMAGES=5
RESET=0
COUNT_GIVEN=0
expect=""
for arg in "$@"; do
  if [ -n "$expect" ]; then
    case "$expect" in batch) BATCH="$arg" ;; images) IMAGES="$arg" ;; esac
    expect=""; continue
  fi
  case "$arg" in
    --reset) RESET=1 ;;
    --batch) expect="batch" ;;
    --images) expect="images" ;;
    ''|*[!0-9]*) ;;
    *) COUNT="$arg"; COUNT_GIVEN=1 ;;
  esac
done

run_sql() {
  docker compose exec -T -e MYSQL_PWD="$PASS" "$SERVICE" \
    mysql -u"$USER" --default-character-set=utf8mb4 "$DB"
}

if ! docker compose ps --status running "$SERVICE" >/dev/null 2>&1; then
  echo "ERROR: docker compose service '$SERVICE' is not running. Start it with: docker compose up -d $SERVICE" >&2
  exit 1
fi

if [ "$RESET" -eq 1 ]; then
  echo ">> Removing previously-seeded US rooms (host oauth_id='seed-host-us'), batched..."
  run_sql <<'SQL'
SET @host_id = (SELECT id FROM members WHERE oauth_id = 'seed-host-us');
DROP PROCEDURE IF EXISTS reset_us_seed;
DELIMITER $$
CREATE PROCEDURE reset_us_seed()
BEGIN
  IF @host_id IS NOT NULL THEN
    rst: WHILE TRUE DO
      DROP TEMPORARY TABLE IF EXISTS _del_ids;
      CREATE TEMPORARY TABLE _del_ids AS
        SELECT id FROM rooms WHERE host_id = @host_id LIMIT 50000;
      IF (SELECT COUNT(*) FROM _del_ids) = 0 THEN LEAVE rst; END IF;
      DELETE FROM room_images WHERE room_id IN (SELECT id FROM _del_ids);
      DELETE FROM rooms       WHERE id      IN (SELECT id FROM _del_ids);
    END WHILE;
    DROP TEMPORARY TABLE IF EXISTS _del_ids;
  END IF;
END$$
DELIMITER ;
CALL reset_us_seed();
DROP PROCEDURE IF EXISTS reset_us_seed;
SELECT CONCAT('Remaining US seed rooms: ',
              (SELECT COUNT(*) FROM rooms WHERE host_id <=> @host_id)) AS result;
SQL
  case "$COUNT_GIVEN" in 0) echo ">> Done."; exit 0 ;; esac
fi

echo ">> Seeding $COUNT US rooms (batch $BATCH, $IMAGES imgs each) into '$DB'..."
{ echo "SET @seed_count = ${COUNT};"; echo "SET @seed_batch = ${BATCH};"; echo "SET @seed_images = ${IMAGES};"; \
  cat "$ROOT/scripts/seed-us-rooms.sql"; } | run_sql
echo ">> Done."
