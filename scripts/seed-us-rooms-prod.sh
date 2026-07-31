#!/usr/bin/env bash
# Seed US rooms into the PRODUCTION MySQL box on AWS, via SSM (no SSH, no public DB).
# US variant of scripts/seed-rooms-prod.sh; runs scripts/seed-us-rooms.sql on the box.
#
# ⚠️  This writes to PRODUCTION. Large counts add GBs and hold IO/CPU while the spatial
#     index is maintained. Work is batched, but still run off-peak.
#
# Seed rows are owned by host oauth_id='seed-host-us' (SEPARATE from the Korean
# 'seed-host'), so --reset removes exactly what this script created and nothing else.
#
# Usage:
#   scripts/seed-us-rooms-prod.sh <count> [--batch N] [--images N]
#   scripts/seed-us-rooms-prod.sh 0 --images 5     # add images to existing US rooms only
#   scripts/seed-us-rooms-prod.sh <count> --reset  # delete prior US seed first, then insert
#   scripts/seed-us-rooms-prod.sh --reset          # only delete prior US seed
#   add --yes to skip the typed confirmation
#
# Requires: aws CLI (with credentials), jq.
set -euo pipefail

REGION="${AWS_REGION:-ap-northeast-2}"
DB_NAME="${DB_NAME:-airdnd}"
DB_USER="${DB_USER:-airdnd}"
MYSQL_TAG="${MYSQL_TAG:-airdnd-mysql}"
SSM_EXEC_TIMEOUT="${SSM_EXEC_TIMEOUT:-7200}"   # seconds the remote command may run
POLL_SECONDS="${POLL_SECONDS:-15}"             # how often to poll command status
POLL_MAX="${POLL_MAX:-480}"                    # max polls (480 * 15s = 2h)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT/scripts/seed-us-rooms.sql"

# --- parse args -------------------------------------------------------------
COUNT=-1
BATCH=10000
IMAGES=5
RESET=0
FORCE=0
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
    --yes|--force) FORCE=1 ;;
    ''|*[!0-9]*) ;;                 # ignore non-numeric flags' leftovers
    *) COUNT="$arg"; COUNT_GIVEN=1 ;;
  esac
done

command -v jq  >/dev/null || { echo "ERROR: jq is required." >&2; exit 1; }
command -v aws >/dev/null || { echo "ERROR: aws CLI is required." >&2; exit 1; }
[ -f "$SQL_FILE" ] || { echo "ERROR: $SQL_FILE not found." >&2; exit 1; }
if [ "$RESET" -eq 0 ] && [ "$COUNT_GIVEN" -eq 0 ]; then
  echo "ERROR: provide a <count> (e.g. 2000000, or 0 to only backfill images) or use --reset." >&2
  exit 1
fi

# --- confirmation guard -----------------------------------------------------
if [ "$FORCE" -ne 1 ]; then
  [ "$COUNT_GIVEN" -eq 1 ] && echo "⚠️  INSERT ${COUNT} US rooms (×${IMAGES} images) into PRODUCTION '${DB_NAME}' (tag ${MYSQL_TAG}, ${REGION})."
  [ "$RESET" -eq 1 ] && echo "⚠️  --reset will DELETE all existing 'seed-host-us' rooms+images in PRODUCTION first."
  printf 'Type EXACTLY "seed prod" to proceed: '
  read -r ans
  [ "$ans" = "seed prod" ] || { echo ">> aborted."; exit 1; }
fi

# --- resolve the MySQL box by tag -------------------------------------------
echo ">> Resolving MySQL instance (tag Name=$MYSQL_TAG) in $REGION..."
IID=$(aws ec2 describe-instances --region "$REGION" \
  --filters "Name=tag:Name,Values=$MYSQL_TAG" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
[ -n "$IID" ] && [ "$IID" != "None" ] || { echo "ERROR: no running instance tagged Name=$MYSQL_TAG." >&2; exit 1; }
echo ">> MySQL instance: $IID"

# --- build the SQL ----------------------------------------------------------
TMP_SQL="$(mktemp)"; trap 'rm -f "$TMP_SQL"' EXIT

# Batched reset (per-room temp-table chunks) avoids one huge locking DELETE on prod.
if [ "$RESET" -eq 1 ]; then
  cat >>"$TMP_SQL" <<'SQL'
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
SQL
fi

if [ "$COUNT_GIVEN" -eq 1 ]; then
  printf 'SET @seed_count = %s;\nSET @seed_batch = %s;\nSET @seed_images = %s;\n' "$COUNT" "$BATCH" "$IMAGES" >>"$TMP_SQL"
  cat "$SQL_FILE" >>"$TMP_SQL"
  echo ">> Seeding $COUNT US rooms (batch $BATCH, $IMAGES imgs each)${RESET:+ after reset} into '$DB_NAME'..."
else
  echo ">> Reset only — removing previously-seeded US rooms..."
fi

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

CID=$(aws ssm send-command --region "$REGION" --instance-ids "$IID" \
  --document-name AWS-RunShellScript --comment "seed US rooms (prod)" \
  --timeout-seconds "$SSM_EXEC_TIMEOUT" \
  --parameters "$(jq -Rn --arg s "$REMOTE" --arg t "$SSM_EXEC_TIMEOUT" '{commands:[$s], executionTimeout:[$t]}')" \
  --query 'Command.CommandId' --output text)
echo ">> SSM command id: $CID"

# --- poll instead of the rigid `ssm wait` (which times out on big ops) -------
echo ">> Polling status every ${POLL_SECONDS}s (up to $((POLL_MAX*POLL_SECONDS/60)) min)..."
STATUS="Pending"
for _ in $(seq 1 "$POLL_MAX"); do
  STATUS=$(aws ssm get-command-invocation --region "$REGION" --command-id "$CID" --instance-id "$IID" \
    --query Status --output text 2>/dev/null || echo "Pending")
  case "$STATUS" in
    Success|Failed|Cancelled|TimedOut) break ;;
  esac
  printf '   ... %s\n' "$STATUS"
  sleep "$POLL_SECONDS"
done

echo "----- remote stdout -----"
aws ssm get-command-invocation --region "$REGION" --command-id "$CID" --instance-id "$IID" \
  --query StandardOutputContent --output text || true
ERR=$(aws ssm get-command-invocation --region "$REGION" --command-id "$CID" --instance-id "$IID" \
  --query StandardErrorContent --output text || true)
[ -n "$ERR" ] && { echo "----- remote stderr -----"; echo "$ERR"; }

echo ">> status: $STATUS"
[ "$STATUS" = "Success" ] || { echo ">> (still running? re-check with the command id above)"; exit 1; }
echo ">> Done."
