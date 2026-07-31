# Terraform runbook (airdnd infra)

## The incident this guards against

The six external secrets (`OAUTH2_GOOGLE_CLIENT_*`, `PAYPAL_CLIENT_*`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) live in SSM Parameter Store and are
read by the backend at boot. They are seeded into SSM by Terraform, but the real
values only enter via `TF_VAR_*` at apply time (from the gitignored repo-root
`.env`).

If you run `terraform apply` **without those values loaded**, the secret params
get overwritten and login + image uploads go down. Re-running the deploy
workflow does **not** fix it — that only restarts the container, which reloads
the same bad SSM values.

## Always apply with the wrapper

```bash
cd infra/aws/terraform
./apply.sh            # loads + validates secrets, blocks risky SSM changes, then applies
```

Do **not** run bare `terraform apply`. The wrapper:

1. Refuses to proceed unless all six secrets are present in `.env` (no half loads).
2. Aborts if the plan would update/delete any existing SSM parameter. If the
   change is intended (DB password rotation, MySQL IP change), re-run with
   `./apply.sh --force`.

## Recovering if the secrets were blanked

1. Restore the live values directly (these are `ignore_changes`, so Terraform
   won't fight you):
   ```bash
   for p in OAUTH2_GOOGLE_CLIENT_ID OAUTH2_GOOGLE_CLIENT_SECRET \
            AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY \
            PAYPAL_CLIENT_ID PAYPAL_CLIENT_SECRET; do
     aws ssm put-parameter --region ap-northeast-2 \
       --name "/airdnd/prod/$p" --type SecureString --overwrite --value '<REAL_VALUE>'
   done
   ```
2. Restart the backend so it reloads SSM (re-run the backend deploy dispatch, or
   SSM the box).

## Rotating a secret

Because the external secrets are `lifecycle.ignore_changes = [value]`, editing
`.env` + apply will **not** push a new value. Rotate directly:

```bash
aws ssm put-parameter --name /airdnd/prod/<KEY> --type SecureString --overwrite --value '<NEW_VALUE>'
```

then restart the backend.

## Recommended next hardening (not yet done)

State is currently **local** (`terraform.tfstate`), so there's no locking and no
shared source of truth — two people applying, or applying from different
checkouts, can diverge. Move to an S3 backend + DynamoDB lock (see the commented
`backend "s3"` block in `versions.tf`). This is the single biggest remaining
blast-radius reduction.
