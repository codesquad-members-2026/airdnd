#!/usr/bin/env bash
# Seed rooms (bounded by Korean coordinates) directly into the docker-compose MySQL.
#
# Usage:
#   scripts/seed-rooms.sh [count]        # insert <count> rooms (default 300)
#   scripts/seed-rooms.sh [count] --reset # delete previously-seeded rooms first, then insert
#   scripts/seed-rooms.sh --reset         # only delete previously-seeded rooms
#
# Seed rooms are owned by host oauth_id='seed-host', so --reset removes exactly
# what this script created and nothing else.
set -euo pipefail

# repo root = parent of this script's dir (where docker-compose.yml lives)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# DB credentials: prefer .env, fall back to docker-compose defaults.
if [ -f .env ]; then set -a; . ./.env; set +a; fi
DB="${MYSQL_DATABASE:-airdnd}"
USER="${MYSQL_USER:-airdnd}"
PASS="${MYSQL_PASSWORD:-airdnd}"
SERVICE="mysql"

# parse args: a number sets COUNT, --reset sets RESET
COUNT=300
RESET=0
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=1 ;;
    ''|*[!0-9]*) ;;          # ignore non-numeric
    *) COUNT="$arg" ;;
  esac
done

# run mysql inside the compose service; MYSQL_PWD avoids the password-on-cmdline warning
run_sql() {
  docker compose exec -T -e MYSQL_PWD="$PASS" "$SERVICE" \
    mysql -u"$USER" --default-character-set=utf8mb4 "$DB"
}

if ! docker compose ps --status running "$SERVICE" >/dev/null 2>&1; then
  echo "ERROR: docker compose service '$SERVICE' is not running. Start it with: docker compose up -d $SERVICE" >&2
  exit 1
fi

if [ "$RESET" -eq 1 ]; then
  echo ">> Removing previously-seeded rooms (host oauth_id='seed-host')..."
  run_sql <<'SQL'
SET @host_id = (SELECT id FROM members WHERE oauth_id = 'seed-host');
-- Delete in FK-dependency order: anything referencing a seed room's
-- reservations first, then the reservations, then the rows that reference the
-- rooms, then the rooms. (room_amenities is ON DELETE CASCADE, so it goes
-- automatically with rooms; everything else has no cascade and would block.)
DELETE p  FROM payments p       JOIN reservations rs ON rs.id = p.reservation_id JOIN rooms r ON r.id = rs.room_id WHERE r.host_id = @host_id;
DELETE rv FROM reviews rv       JOIN reservations rs ON rs.id = rv.reservation_id JOIN rooms r ON r.id = rs.room_id WHERE r.host_id = @host_id;
DELETE rs FROM reservations rs  JOIN rooms r ON r.id = rs.room_id WHERE r.host_id = @host_id;
DELETE wr FROM wishlist_rooms wr JOIN rooms r ON r.id = wr.room_id WHERE r.host_id = @host_id;
DELETE ri FROM room_images ri   JOIN rooms r ON r.id = ri.room_id WHERE r.host_id = @host_id;
DELETE FROM rooms WHERE host_id = @host_id;
SELECT CONCAT('Remaining seed rooms: ',
              (SELECT COUNT(*) FROM rooms WHERE host_id <=> @host_id)) AS result;
SQL
  # if only --reset was requested (no explicit count arg), stop here
  case "$*" in *[0-9]*) : ;; *) echo ">> Done."; exit 0 ;; esac
fi

echo ">> Seeding $COUNT rooms into '$DB' via docker compose service '$SERVICE'..."
{ echo "SET @seed_count = ${COUNT};"; cat "$ROOT/scripts/seed-rooms.sql"; } | run_sql
echo ">> Done."
