#!/usr/bin/env bash
# Deploy the monitoring/ stack to PRODUCTION via SSM (no SSH, no public ports).
# The repo isn't on the boxes, so this ships everything over SSM Run Command —
# same transport as scripts/seed-us-rooms-prod.sh.
#
# Two boxes (see infra/aws/terraform):
#   airdnd-backend : app + actuator:8081  -> runs prometheus, grafana, mysqld-exporter,
#                                            node-exporter, cadvisor
#   airdnd-mysql   : mysql:3306           -> gets the read-only exporter user + a
#                                            node-exporter (DB-box machine metrics)
#
# Usage:
#   scripts/deploy-monitoring-prod.sh            # deploy/update the stack
#   scripts/deploy-monitoring-prod.sh --down     # stop & remove the stack on both boxes
#   GF_ADMIN_PASSWORD=... scripts/deploy-monitoring-prod.sh   # set Grafana admin pw
#   add --yes to skip the typed confirmation
#
# Requires: aws CLI (creds that can describe-instances + ssm send-command), jq.
# NOTE: the app must be (re)deployed with -p 8081:8081 (remote-deploy.sh) for the
#       actuator scrape to succeed, and `terraform apply` run for the db-SG :9100
#       rule before DB-box machine metrics appear.
set -euo pipefail

REGION="${AWS_REGION:-ap-northeast-2}"
BACKEND_TAG="${BACKEND_TAG:-airdnd-backend}"
MYSQL_TAG="${MYSQL_TAG:-airdnd-mysql}"
SSM_EXEC_TIMEOUT="${SSM_EXEC_TIMEOUT:-1800}"
POLL_SECONDS="${POLL_SECONDS:-10}"
POLL_MAX="${POLL_MAX:-180}"
REMOTE_DIR="/opt/airdnd/monitoring"

DOWN=0; FORCE=0
for arg in "$@"; do case "$arg" in
  --down) DOWN=1 ;;
  --yes|--force) FORCE=1 ;;
  *) echo "unknown arg: $arg" >&2; exit 1 ;;
esac; done

command -v jq  >/dev/null || { echo "ERROR: jq is required." >&2; exit 1; }
command -v aws >/dev/null || { echo "ERROR: aws CLI is required." >&2; exit 1; }
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -d "$ROOT/monitoring" ] || { echo "ERROR: $ROOT/monitoring not found." >&2; exit 1; }

iid_for() {
  aws ec2 describe-instances --region "$REGION" \
    --filters "Name=tag:Name,Values=$1" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text
}

echo ">> Resolving instances in $REGION..."
BACKEND_IID="$(iid_for "$BACKEND_TAG")"
MYSQL_IID="$(iid_for "$MYSQL_TAG")"
[ -n "$BACKEND_IID" ] && [ "$BACKEND_IID" != "None" ] || { echo "ERROR: no running $BACKEND_TAG." >&2; exit 1; }
[ -n "$MYSQL_IID" ]   && [ "$MYSQL_IID"   != "None" ] || { echo "ERROR: no running $MYSQL_TAG." >&2; exit 1; }
DB_HOST="$(aws ec2 describe-instances --region "$REGION" \
  --filters "Name=tag:Name,Values=$MYSQL_TAG" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' --output text)"
echo ">> backend=$BACKEND_IID  mysql=$MYSQL_IID  db_private_ip=$DB_HOST"

# Runs one remote script on $1, polls to completion, prints output. Returns non-zero on failure.
run_remote() {
  local iid="$1" script="$2" cid status
  cid=$(aws ssm send-command --region "$REGION" --instance-ids "$iid" \
    --document-name AWS-RunShellScript --comment "airdnd monitoring deploy" \
    --timeout-seconds "$SSM_EXEC_TIMEOUT" \
    --parameters "$(jq -Rn --arg s "$script" --arg t "$SSM_EXEC_TIMEOUT" '{commands:[$s],executionTimeout:[$t]}')" \
    --query 'Command.CommandId' --output text)
  status="Pending"
  for _ in $(seq 1 "$POLL_MAX"); do
    status=$(aws ssm get-command-invocation --region "$REGION" --command-id "$cid" --instance-id "$iid" \
      --query Status --output text 2>/dev/null || echo "Pending")
    case "$status" in Success|Failed|Cancelled|TimedOut) break ;; esac
    sleep "$POLL_SECONDS"
  done
  echo "----- [$iid] stdout -----"
  aws ssm get-command-invocation --region "$REGION" --command-id "$cid" --instance-id "$iid" \
    --query StandardOutputContent --output text || true
  local err
  err=$(aws ssm get-command-invocation --region "$REGION" --command-id "$cid" --instance-id "$iid" \
    --query StandardErrorContent --output text || true)
  [ -n "$err" ] && { echo "----- [$iid] stderr -----"; echo "$err"; }
  echo ">> [$iid] status: $status"
  [ "$status" = "Success" ]
}

# --------------------------- teardown ---------------------------------------
if [ "$DOWN" -eq 1 ]; then
  [ "$FORCE" -eq 1 ] || { printf 'Type "down monitoring" to tear down on both boxes: '; read -r a; [ "$a" = "down monitoring" ] || { echo aborted; exit 1; }; }
  run_remote "$BACKEND_IID" "set -e; cd $REMOTE_DIR 2>/dev/null && docker compose down || true" || true
  run_remote "$MYSQL_IID"   "docker rm -f airdnd-node-exporter 2>/dev/null || true; echo 'db-box node-exporter removed'" || true
  echo ">> Monitoring stack stopped."
  exit 0
fi

# --------------------------- confirm ----------------------------------------
EXPORTER_PW="$(openssl rand -hex 16)"
GF_PW="${GF_ADMIN_PASSWORD:-$(openssl rand -hex 12)}"
if [ "$FORCE" -ne 1 ]; then
  echo "⚠️  Deploy monitoring to PRODUCTION (backend=$BACKEND_TAG, mysql=$MYSQL_TAG, $REGION)."
  printf 'Type "deploy monitoring" to proceed: '; read -r a
  [ "$a" = "deploy monitoring" ] || { echo aborted; exit 1; }
fi

# --------------------------- MySQL box --------------------------------------
# Create/resync the read-only exporter user, and run a node-exporter for DB-box
# machine metrics. Root password is read from the running container's env.
MYSQL_REMOTE=$(cat <<EOF
set -euo pipefail
C=\$(docker ps --filter name=mysql --format '{{.Names}}' | head -1)
[ -n "\$C" ] || { echo "no mysql container on this box" >&2; exit 1; }
ROOT=\$(docker exec "\$C" printenv MYSQL_ROOT_PASSWORD)
docker exec -i -e MYSQL_PWD="\$ROOT" "\$C" mysql -uroot <<'SQL'
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY '$EXPORTER_PW' WITH MAX_USER_CONNECTIONS 3;
ALTER  USER 'exporter'@'%' IDENTIFIED BY '$EXPORTER_PW';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
SQL
echo "exporter user ready"
docker rm -f airdnd-node-exporter 2>/dev/null || true
docker run -d --name airdnd-node-exporter --restart unless-stopped \
  --net host --pid host -v /:/host:ro,rslave \
  prom/node-exporter:latest --path.rootfs=/host
echo "db-box node-exporter up on :9100"
EOF
)
echo ">> [mysql box] creating exporter user + node-exporter..."
run_remote "$MYSQL_IID" "$MYSQL_REMOTE" || { echo "ERROR: mysql-box step failed." >&2; exit 1; }

# --------------------------- backend box ------------------------------------
# Ship the monitoring/ tree (minus any local secrets), render configs with the
# generated passwords + DB IP, ensure the compose plugin exists, then bring it up.
# COPYFILE_DISABLE + --exclude='._*' keep macOS AppleDouble files out of the tar;
# Grafana's provisioner crashes if it finds a ._provider.yml beside the real config.
BUNDLE="$(COPYFILE_DISABLE=1 tar czf - --exclude='._*' --exclude='.env' --exclude='mysqld-exporter/.my.cnf' -C "$ROOT" monitoring | base64 | tr -d '\n')"

BACKEND_REMOTE=$(cat <<EOF
set -euo pipefail
# docker compose plugin (the box only has the docker engine by default)
if ! docker compose version >/dev/null 2>&1; then
  mkdir -p /usr/libexec/docker/cli-plugins
  A=\$(uname -m)
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-\$A" \
    -o /usr/libexec/docker/cli-plugins/docker-compose
  chmod +x /usr/libexec/docker/cli-plugins/docker-compose
fi
rm -rf $REMOTE_DIR && mkdir -p $(dirname $REMOTE_DIR)
echo '$BUNDLE' | base64 -d | tar xzf - -C $(dirname $REMOTE_DIR)
cd $REMOTE_DIR
printf 'GF_ADMIN_PASSWORD=%s\n' '$GF_PW' > .env
mkdir -p mysqld-exporter
cat > mysqld-exporter/.my.cnf <<CNF
[client]
user = exporter
password = $EXPORTER_PW
host = $DB_HOST
port = 3306
CNF
# 644, not 600: the exporter container runs as a non-root user and must read it.
# Safe here — the file lives only on this private, single-tenant box.
chmod 644 mysqld-exporter/.my.cnf
sed -i "s/__DB_HOST__/$DB_HOST/g" prometheus/prometheus.yml
# --force-recreate so re-ships pick up changed bind-mounted config (.my.cnf,
# prometheus.yml) — compose otherwise leaves containers whose YAML didn't change.
docker compose --env-file .env up -d --force-recreate
docker compose ps
EOF
)
echo ">> [backend box] shipping + starting the stack..."
run_remote "$BACKEND_IID" "$BACKEND_REMOTE" || { echo "ERROR: backend-box step failed." >&2; exit 1; }

cat <<DONE

>> Done.
   Grafana admin password (first-init only): $GF_PW
   View it:   scripts/monitoring-tunnel.sh    # then open http://localhost:3000  (user: admin)
   Reminders: redeploy the app so it publishes 8081; \`terraform apply\` for the db-SG :9100 rule.
DONE
