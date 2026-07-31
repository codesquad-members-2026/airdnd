#!/usr/bin/env bash
# Open an SSM port-forward to the prod box's Grafana (bound to loopback there),
# so you can view http://localhost:3000 locally WITHOUT exposing Grafana publicly.
#
# Usage:  scripts/monitoring-tunnel.sh            # forwards remote 3000 -> local 3000
#         LOCAL_PORT=3001 scripts/monitoring-tunnel.sh
set -euo pipefail

REGION="${AWS_REGION:-ap-northeast-2}"
BACKEND_TAG="${BACKEND_TAG:-airdnd-backend}"   # Grafana runs on the backend box
REMOTE_PORT="${REMOTE_PORT:-3000}"
LOCAL_PORT="${LOCAL_PORT:-3000}"

command -v aws >/dev/null || { echo "ERROR: aws CLI is required." >&2; exit 1; }

echo ">> Resolving box (tag Name=$BACKEND_TAG) in $REGION..."
IID=$(aws ec2 describe-instances --region "$REGION" \
  --filters "Name=tag:Name,Values=$BACKEND_TAG" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
[ -n "$IID" ] && [ "$IID" != "None" ] || { echo "ERROR: no running instance tagged Name=$BACKEND_TAG." >&2; exit 1; }

echo ">> Forwarding ${IID}:${REMOTE_PORT} -> http://localhost:${LOCAL_PORT}  (Ctrl-C to stop)"
exec aws ssm start-session --region "$REGION" --target "$IID" \
  --document-name AWS-StartPortForwardingSession \
  --parameters "{\"portNumber\":[\"${REMOTE_PORT}\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
