#!/usr/bin/env bash
# remote-deploy.sh — runs ON the EC2 app box, sent there by the GitHub Actions
# workflow via SSM Run Command (the runner reads this file and ships its text).
#
# Expects $IMAGE and $REGION, which the workflow prepends as an `export ...`
# line before this script. Everything here uses the instance's IAM role — the
# box has AWS CLI + Docker preinstalled, ECR read access, and SSM param read
# access — so there are no credentials anywhere in this flow.
set -euo pipefail

: "${IMAGE:?IMAGE not set}"
: "${REGION:?REGION not set}"

# The registry host is the part of the image URI before the first slash.
REGISTRY="${IMAGE%%/*}"

# 1. Authenticate Docker to ECR using the instance role (temporary token).
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

# 2. Pull the image the workflow just pushed.
docker pull "$IMAGE"

# 3. Rebuild the env-file from SSM (/airdnd/prod/*) as KEY=VALUE lines.
#    umask 077 so the file with the DB password isn't world-readable.
umask 077
aws ssm get-parameters-by-path \
  --path /airdnd/prod --recursive --with-decryption --region "$REGION" \
  --query 'Parameters[*].[Name,Value]' --output text \
  | while IFS=$'\t' read -r name value; do
      printf '%s=%s\n' "$(basename "$name")" "$value"
    done > /tmp/airdnd.env

# 4. Replace the single running container with the new image.
#    8080 = app (CloudFront-facing). 8081 = actuator/metrics, bound to the box's
#    private interface only (the ec2 SG never opens 8081 to the internet), so the
#    monitoring stack on this box can scrape it but the world cannot.
docker rm -f airdnd-backend 2>/dev/null || true
docker run -d --name airdnd-backend --restart unless-stopped \
  -p 8080:8080 -p 8081:8081 --env-file /tmp/airdnd.env "$IMAGE"

# 5. Reclaim disk from old image layers (keeps the 8 GiB root tidy).
docker image prune -f

echo "deployed: $IMAGE"
