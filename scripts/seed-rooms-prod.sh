#!/usr/bin/env bash
# Seed rooms into the PRODUCTION MySQL box on AWS, via SSM (no SSH, no public DB).
#
# The prod DB only accepts connections from inside the VPC, so we don't connect
# to it directly. Instead we run mysql *inside the MySQL container on the DB box*
# through SSM Run Command. The DB password is read from the container's own env
# on the box, so it never travels through the command or your shell history.
#
# Mirrors scripts/seed-rooms.sh (the local docker-compose version) but for prod.
#
# Usage:
#   scripts/seed-rooms-prod.sh [count]          # insert <count> rooms (default 300)
#   scripts/seed-rooms-prod.sh [count] --reset  # delete previously-seeded rooms first, then insert
#   scripts/seed-rooms-prod.sh --reset          # only delete previously-seeded rooms
#
# Seed rows are owned by host oauth_id='seed-host', so --reset removes exactly
# what this script created and nothing else.
#
# Requires: aws CLI (with credentials), jq. The MySQL box is found by its
# Name=airdnd-mysql tag, so a replaced instance id never breaks this.
set -euo pipefail

REGION="${AWS_REGION:-ap-northeast-2}"
DB_NAME="${DB_NAME:-airdnd}"
DB_USER="${DB_USER:-airdnd}"
MYSQL_TAG="${MYSQL_TAG:-airdnd-mysql}"

# repo root = parent of this script's dir (where scripts/seed-rooms.sql lives)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT/scripts/seed-rooms.sql"

# --- parse args: a number sets COUNT, --reset sets RESET --------------------
COUNT=300
RESET=0
COUNT_GIVEN=0
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=1 ;;
    ''|*[!0-9]*) ;;                 # ignore non-numeric
    *) COUNT="$arg"; COUNT_GIVEN=1 ;;
  esac
done

command -v jq >/dev/null || { echo "ERROR: jq is required." >&2; exit 1; }
[ -f "$SQL_FILE" ] || { echo "ERROR: $SQL_FILE not found." >&2; exit 1; }

# --- resolve the MySQL box by tag (immune to instance replacement) ----------
echo ">> Resolving MySQL instance (tag Name=$MYSQL_TAG) in $REGION..."
IID=$(aws ec2 describe-instances --region "$REGION" \
  --filters "Name=tag:Name,Values=$MYSQL_TAG" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
if [ -z "$IID" ] || [ "$IID" = "None" ]; then
  echo "ERROR: no running instance tagged Name=$MYSQL_TAG found." >&2
  exit 1
fi
echo ">> MySQL instance: $IID"

# --- build the SQL we want to run on the box --------------------------------
# RESET block (optional) + INSERT block (unless only --reset was requested).
TMP_SQL="$(mktemp)"
trap 'rm -f "$TMP_SQL"' EXIT

if [ "$RESET" -eq 1 ]; then
  cat >>"$TMP_SQL" <<'SQL'
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
SQL
fi

# If only --reset (no explicit count) was asked, skip the insert.
if [ "$RESET" -eq 0 ] || [ "$COUNT_GIVEN" -eq 1 ]; then
  printf 'SET @seed_count = %s;\n' "$COUNT" >>"$TMP_SQL"
  cat "$SQL_FILE" >>"$TMP_SQL"
  echo ">> Seeding $COUNT rooms${RESET:+ (after reset)} into '$DB_NAME'..."
else
  echo ">> Reset only — removing previously-seeded rooms..."
fi

# base64 so the SQL survives JSON/SSM transport with no quoting surprises.
B64="$(base64 <"$TMP_SQL" | tr -d '\n')"

# --- remote script: find the mysql container, read its password, run SQL ----
REMOTE=$(cat <<EOF
set -euo pipefail
C=\$(docker ps --filter name=mysql --format '{{.Names}}' | head -1)
[ -n "\$C" ] || { echo "no mysql container running on this box" >&2; exit 1; }
PASS=\$(docker exec "\$C" printenv MYSQL_PASSWORD)
echo '$B64' | base64 -d | docker exec -i -e MYSQL_PWD="\$PASS" "\$C" \
  mysql -u$DB_USER --default-character-set=utf8mb4 $DB_NAME
docker exec -e MYSQL_PWD="\$PASS" "\$C" \
  mysql -u$DB_USER -N -e "SELECT CONCAT('rooms now: ', COUNT(*)) FROM $DB_NAME.rooms;"
EOF
)

# --- send via SSM, wait, print the box's stdout/stderr ----------------------
CID=$(aws ssm send-command --region "$REGION" --instance-ids "$IID" \
  --document-name AWS-RunShellScript --comment "seed rooms (prod)" \
  --parameters "$(jq -Rn --arg s "$REMOTE" '{commands:[$s]}')" \
  --query 'Command.CommandId' --output text)
echo ">> SSM command id: $CID"
aws ssm wait command-executed --region "$REGION" --command-id "$CID" --instance-id "$IID" || true

echo "----- remote stdout -----"
aws ssm get-command-invocation --region "$REGION" --command-id "$CID" --instance-id "$IID" \
  --query StandardOutputContent --output text || true
ERR=$(aws ssm get-command-invocation --region "$REGION" --command-id "$CID" --instance-id "$IID" \
  --query StandardErrorContent --output text || true)
[ -n "$ERR" ] && { echo "----- remote stderr -----"; echo "$ERR"; }

STATUS=$(aws ssm get-command-invocation --region "$REGION" --command-id "$CID" --instance-id "$IID" \
  --query Status --output text)
echo ">> status: $STATUS"
[ "$STATUS" = "Success" ] || exit 1
echo ">> Done."
