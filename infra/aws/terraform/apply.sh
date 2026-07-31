#!/usr/bin/env bash
# apply.sh — the SAFE way to apply this stack.
#
# This is the guardrail around the incident where a bare `terraform apply` with
# the secret TF_VAR_* unset blanked the live SSM secrets (login + image uploads
# went down). It:
#   1. Loads secrets from .env via load-env-secrets.sh — and ABORTS if any are
#      missing/placeholder (never proceeds with a half/empty secret set).
#   2. Builds a plan and ABORTS if it would UPDATE or DELETE any SSM parameter
#      (defense-in-depth on top of required vars + ignore_changes). Creating new
#      params is allowed; touching existing secrets requires --force.
#   3. Applies the reviewed plan.
#
# Usage (from infra/aws/terraform):
#   ./apply.sh                 # safe plan-guard, then apply
#   ./apply.sh --force         # you reviewed the SSM change (e.g. DB pw rotation)
set -euo pipefail
cd "$(dirname "$0")"

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

# 1) Load + validate secrets. load-env-secrets.sh returns non-zero (and set -e
#    aborts us) if .env is missing values — so we can't apply a blank set.
# shellcheck disable=SC1091
source ./load-env-secrets.sh

# 2) Plan to a file, then inspect the machine-readable plan for risky changes.
PLAN="$(mktemp -t tfplan.XXXXXX)"
trap 'rm -f "$PLAN" "$PLAN.json"' EXIT
terraform plan -out="$PLAN"
terraform show -json "$PLAN" >"$PLAN.json"

RISKY="$(python3 - "$PLAN.json" <<'PY'
import json, sys
plan = json.load(open(sys.argv[1]))
bad = []
for rc in plan.get("resource_changes", []):
    if rc.get("type") != "aws_ssm_parameter":
        continue
    actions = rc.get("change", {}).get("actions", [])
    # update / delete (incl. replace, which is ["delete","create"]) of an
    # existing parameter is the dangerous case — a pure ["create"] is fine.
    if "update" in actions or "delete" in actions:
        bad.append(f'{rc["address"]}: {",".join(actions)}')
print("\n".join(bad))
PY
)"

if [ -n "$RISKY" ] && [ "$FORCE" -eq 0 ]; then
  {
    echo ""
    echo "ABORT: this plan would change existing SSM parameters:"
    echo "$RISKY" | sed 's/^/  /'
    echo "If that is intended (e.g. DB password rotation, IP change), re-run:"
    echo "  ./apply.sh --force"
  } >&2
  exit 1
fi

# 3) Apply the exact plan we just vetted.
terraform apply "$PLAN"
