#!/usr/bin/env bash
# destroy.sh — the SAFE way to TEAR DOWN this whole stack.
#
# Companion to apply.sh. `terraform destroy` on its own has two sharp edges in
# this repo, which this script handles:
#   1. The six external secrets are REQUIRED vars with no defaults, so even a
#      destroy fails unless they're set — we source load-env-secrets.sh first
#      (same as apply.sh).
#   2. No bucket/repo here sets force_destroy/force_delete, so Terraform REFUSES
#      to delete a non-empty S3 bucket or an ECR repo with images. We empty them
#      first, otherwise destroy errors out half-way.
#
# ⚠️  THIS IS IRREVERSIBLE. It permanently deletes, with NO snapshot taken:
#       • the MySQL database on aws_ebs_volume.mysql_data (all rows, gone)
#       • every user-uploaded image in the uploads S3 bucket
#       • all SSM secrets/params, the EC2 boxes, EIPs, CloudFront + WAF, ECR.
#     Back anything you want to keep up BEFORE running this (see README / the
#     create-snapshot + s3 sync commands in the teardown notes).
#
#     It does NOT touch things outside this Terraform: the Cloudflare record for
#     airdnd.wownd.me, GitHub Actions secrets/OIDC, or the local state file.
#
# Usage (from infra/aws/terraform):
#   ./destroy.sh                # interactive: empties buckets/ECR, then destroy
#   ./destroy.sh --yes          # skip the typed confirmation + auto-approve
set -euo pipefail
cd "$(dirname "$0")"

ASSUME_YES=0
[ "${1:-}" = "--yes" ] || [ "${1:-}" = "-y" ] && ASSUME_YES=1

# --- 0) Need credentials for every AWS call below. -------------------------
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "destroy: no AWS credentials. Run 'aws sso login' (or export keys) first." >&2
  exit 1
fi

# --- 1) Big red confirmation (terraform asks again later, but bucket-emptying
#        happens BEFORE that, so we gate it here too). -----------------------
if [ "$ASSUME_YES" -eq 0 ]; then
  cat >&2 <<'WARN'

  ============================================================
   IRREVERSIBLE TEARDOWN — this DELETES the database, all
   uploaded images, and every resource in this Terraform.
   No snapshots are taken. Back up first if you need the data.
  ============================================================

WARN
  printf 'Type "destroy" to proceed: ' >&2
  read -r _reply
  if [ "$_reply" != "destroy" ]; then
    echo "Aborted (nothing changed)." >&2
    exit 1
  fi
fi

# --- 2) Load + validate the required secret vars (destroy needs them too). --
#     load-env-secrets.sh returns non-zero (set -e aborts us) if .env is
#     missing/placeholder, so we never run with a broken var set.
# shellcheck disable=SC1091
source ./load-env-secrets.sh

# --- 3) Empty stateful resources so Terraform can actually delete them. -----
# Pull names straight from state (robust even if outputs differ); empty quietly
# if the resource is already gone.
tf_attr() { # <resource address> <attribute name> -> value (or empty)
  terraform state show "$1" 2>/dev/null \
    | awk -v a="$2" '$1==a && $2=="=" {gsub(/"/,"",$3); print $3; exit}'
}

purge_bucket() {
  local b="$1"
  if [ -z "$b" ]; then echo "  (bucket not in state — skipping)"; return 0; fi
  if ! aws s3api head-bucket --bucket "$b" 2>/dev/null; then
    echo "  s3://$b not found (already gone) — skipping"; return 0
  fi
  echo "  emptying s3://$b ..."
  aws s3 rm "s3://$b" --recursive --only-show-errors   # buckets are unversioned
}

purge_ecr() {
  local repo="$1"
  if [ -z "$repo" ]; then echo "  (ECR repo not in state — skipping)"; return 0; fi
  local ids
  ids=$(aws ecr list-images --repository-name "$repo" \
        --query 'imageIds[*]' --output json 2>/dev/null || echo '[]')
  if [ "$ids" = "[]" ] || [ -z "$ids" ]; then
    echo "  ECR repo $repo empty/absent — skipping"; return 0
  fi
  echo "  deleting images in ECR repo $repo ..."
  aws ecr batch-delete-image --repository-name "$repo" --image-ids "$ids" >/dev/null
}

echo "Emptying buckets / ECR before destroy:"
purge_bucket "$(tf_attr aws_s3_bucket.frontend bucket)"
purge_bucket "$(tf_attr aws_s3_bucket.uploads  bucket)"
purge_ecr    "$(tf_attr aws_ecr_repository.backend name)"

# --- 4) Destroy. Terraform shows the full plan and asks for 'yes' unless
#        --yes was passed (then -auto-approve). ------------------------------
echo "Running terraform destroy ..."
if [ "$ASSUME_YES" -eq 1 ]; then
  terraform destroy -auto-approve
else
  terraform destroy
fi

# --- 5) Reminders for what lives OUTSIDE this Terraform. --------------------
cat >&2 <<'DONE'

Destroy complete. Still to handle MANUALLY (not in this Terraform):
  • Cloudflare DNS/proxy for airdnd.wownd.me (delete in the Cloudflare dashboard)
  • Local state still on disk and contains the DB password in plaintext:
      rm -f terraform.tfstate terraform.tfstate.backup
  • Any leftover CloudWatch log groups, GitHub Actions vars/secrets.
DONE
