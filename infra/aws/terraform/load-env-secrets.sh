#!/usr/bin/env bash
# load-env-secrets.sh — map the repo-root .env's backend secrets to TF_VAR_*
# so `terraform apply` can satisfy the (required) secret variables in ssm.tf.
#
# WHY this exists: the six external secrets are required variables with NO
# defaults. Every `terraform apply` must have them set or it fails — this maps
# them from .env to TF_VAR_* for you.
#
# NOTE (changed): the external secrets are now lifecycle.ignore_changes in
# ssm.tf, so editing .env and re-applying will NOT push new values into SSM.
# This script is for satisfying the required vars on apply and for the FIRST
# create. To ROTATE a live secret, write it directly:
#   aws ssm put-parameter --name /airdnd/prod/<KEY> --type SecureString --overwrite --value ...
#
# Usage (from infra/aws/terraform):
#   source ./load-env-secrets.sh         # uses ../../../.env by default
#   terraform apply                      # (or just run ./apply.sh, which does both)
#
# Note: `source` it (don't just run it) so the exports survive into your shell.

ENV_FILE="${1:-../../../.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "load-env-secrets: no .env at $ENV_FILE" >&2
  echo "  Without it the secret vars are unset and an apply would fail (by design)." >&2
  return 1 2>/dev/null || exit 1
fi

# Read KEY=value from the env file; tolerate surrounding single/double quotes.
_val() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- \
    | sed -e 's/^["'\'']//' -e 's/["'\'']$//'
}

# TF_VAR suffix paired with its .env key (the AWS key names differ between the
# two). This file is `source`d, and the caller's shell may be bash OR zsh, so we
# avoid indexed arrays (1- vs 0-based) and unquoted-variable word splitting (off
# in zsh) — a literal `for .. in` list iterates identically in both. The list is
# written twice on purpose: pass 1 validates, pass 2 exports, so we never leave a
# half-exported set behind (the exact failure mode that blanked prod).

# Pass 1 — validate everything is present BEFORE exporting anything.
_missing=""
for _p in \
  oauth_google_client_id=OAUTH2_GOOGLE_CLIENT_ID \
  oauth_google_client_secret=OAUTH2_GOOGLE_CLIENT_SECRET \
  paypal_client_id=PAYPAL_CLIENT_ID \
  paypal_client_secret=PAYPAL_CLIENT_SECRET \
  aws_access_key_id=AWS_ACCESS_KEY \
  aws_secret_access_key=AWS_ACCESS_SECRET_KEY; do
  _ek="${_p#*=}"
  _v="$(_val "$_ek")"
  if [ -z "$_v" ] || [ "$_v" = "REPLACE_ME" ]; then
    _missing="${_missing}  - ${_ek}
"
  fi
done

if [ -n "$_missing" ]; then
  echo "load-env-secrets: REFUSING to load — missing/placeholder in $ENV_FILE:" >&2
  printf '%s' "$_missing" >&2
  echo "Fix .env before applying; an apply with these unset would blank the live SSM secrets." >&2
  return 1 2>/dev/null || exit 1
fi

# Pass 2 — all present, so export.
for _p in \
  oauth_google_client_id=OAUTH2_GOOGLE_CLIENT_ID \
  oauth_google_client_secret=OAUTH2_GOOGLE_CLIENT_SECRET \
  paypal_client_id=PAYPAL_CLIENT_ID \
  paypal_client_secret=PAYPAL_CLIENT_SECRET \
  aws_access_key_id=AWS_ACCESS_KEY \
  aws_secret_access_key=AWS_ACCESS_SECRET_KEY; do
  export "TF_VAR_${_p%%=*}=$(_val "${_p#*=}")"
done

# Confirm they loaded WITHOUT printing the secret values (just lengths).
echo "Loaded TF_VAR_* from $ENV_FILE (all 6 present):"
echo "  oauth_google_client_id     (${#TF_VAR_oauth_google_client_id} chars)"
echo "  oauth_google_client_secret (${#TF_VAR_oauth_google_client_secret} chars)"
echo "  paypal_client_id           (${#TF_VAR_paypal_client_id} chars)"
echo "  paypal_client_secret       (${#TF_VAR_paypal_client_secret} chars)"
echo "  aws_access_key_id          (${#TF_VAR_aws_access_key_id} chars)"
echo "  aws_secret_access_key      (${#TF_VAR_aws_secret_access_key} chars)"
