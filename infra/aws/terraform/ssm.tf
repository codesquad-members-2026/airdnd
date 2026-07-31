# ssm.tf — backend secrets & config in Parameter Store (README §5).
#
# WHAT: every parameter the prod profile reads, under /airdnd/prod/. Secrets
#       are SecureString (KMS-encrypted); plain config is String.
# WHY:  keeps secrets out of the image and out of git. The EC2 role (ec2.tf)
#       can read exactly this path and nothing else. The deploy step turns the
#       path into a --env-file for `docker run`.
# HOW:  the DB URL/username/password are wired straight from the MySQL box + random
#       resources, so rotating the DB password is a Terraform change — not
#       manual console editing. for_each keeps the code short (one block,
#       many parameters) instead of repeating a resource per key.

locals {
  ssm_prefix = "/${var.project}/${var.environment}"

  # Points at the self-managed MySQL box's PRIVATE IP (mysql.tf). useSSL=false
  # because we don't run managed TLS like RDS did; allowPublicKeyRetrieval lets
  # the JDBC driver complete caching_sha2_password auth over the plaintext link
  # (fine inside the VPC, where only the app SG can reach 3306).
  jdbc_url = "jdbc:mysql://${aws_instance.mysql.private_ip}:3306/${var.db_name}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8"

  # The app's public URL: custom domain if set, else the CloudFront-generated
  # one (referencing the distribution makes Terraform build it first).
  frontend_base_url = var.domain_name == "" ? "https://${aws_cloudfront_distribution.this.domain_name}" : "https://${var.domain_name}"

  # Non-secret config → String parameters.
  plain_params = {
    "SPRING_PROFILES_ACTIVE"        = var.environment
    "SPRING_JPA_HIBERNATE_DDL_AUTO" = "validate"
    "APP_FRONTEND_BASE_URL"         = local.frontend_base_url
    # S3 image uploads (uploads.tf). publicBaseUrl is the bucket REST endpoint;
    # S3PresignService builds <publicBaseUrl>/<objectKey> for rendering.
    "AWS_S3_BUCKET"          = aws_s3_bucket.uploads.bucket
    "AWS_S3_PUBLIC_BASE_URL" = "https://${aws_s3_bucket.uploads.bucket_regional_domain_name}"
  }

  # Secrets DERIVED from other Terraform resources → Terraform OWNS the value
  # (these MUST update when the MySQL IP changes or the DB password rotates).
  managed_secret_params = {
    "SPRING_DATASOURCE_URL"      = local.jdbc_url
    "SPRING_DATASOURCE_USERNAME" = var.db_username
    "SPRING_DATASOURCE_PASSWORD" = random_password.db.result
  }

  # Secrets that ORIGINATE OUTSIDE AWS (Google / PayPal consoles, and the IAM
  # user whose keys SIGN presigned S3 uploads — S3Config / aws.credentials.*).
  # Terraform SEEDS these on first create but NEVER overwrites the value after
  # (lifecycle.ignore_changes on aws_ssm_parameter.external_secret below).
  #
  # WHY: an apply with these vars unset previously fell back to "REPLACE_ME"
  #      defaults and BLANKED the live prod secrets, taking down login + image
  #      uploads. The vars are now required (no defaults, see variables.tf) so a
  #      missing value fails the apply loudly, AND ignore_changes means even a
  #      stray apply can't clobber a value rotated out-of-band. Rotate with:
  #        aws ssm put-parameter --name /airdnd/prod/<KEY> --type SecureString --overwrite --value ...
  external_secret_params = {
    "OAUTH2_GOOGLE_CLIENT_ID"     = var.oauth_google_client_id
    "OAUTH2_GOOGLE_CLIENT_SECRET" = var.oauth_google_client_secret
    "PAYPAL_CLIENT_ID"            = var.paypal_client_id
    "PAYPAL_CLIENT_SECRET"        = var.paypal_client_secret
    "AWS_ACCESS_KEY_ID"           = var.aws_access_key_id
    "AWS_SECRET_ACCESS_KEY"       = var.aws_secret_access_key
  }
}

resource "aws_ssm_parameter" "plain" {
  for_each = local.plain_params
  name     = "${local.ssm_prefix}/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "secret" {
  for_each = local.managed_secret_params
  name     = "${local.ssm_prefix}/${each.key}"
  type     = "SecureString"
  value    = each.value
}

resource "aws_ssm_parameter" "external_secret" {
  for_each = local.external_secret_params
  name     = "${local.ssm_prefix}/${each.key}"
  type     = "SecureString"
  value    = each.value

  # Set once on create; do NOT let a later apply revert a value rotated
  # out-of-band (`aws ssm put-parameter --overwrite`). This is the guardrail
  # against the "apply blanked prod secrets" incident.
  lifecycle {
    ignore_changes = [value]
  }
}

# The six external secrets used to live under aws_ssm_parameter.secret. Tell
# Terraform they MOVED (vs destroy + recreate) so the existing params — and the
# values you restore into them — are preserved across this refactor.
moved {
  from = aws_ssm_parameter.secret["OAUTH2_GOOGLE_CLIENT_ID"]
  to   = aws_ssm_parameter.external_secret["OAUTH2_GOOGLE_CLIENT_ID"]
}
moved {
  from = aws_ssm_parameter.secret["OAUTH2_GOOGLE_CLIENT_SECRET"]
  to   = aws_ssm_parameter.external_secret["OAUTH2_GOOGLE_CLIENT_SECRET"]
}
moved {
  from = aws_ssm_parameter.secret["PAYPAL_CLIENT_ID"]
  to   = aws_ssm_parameter.external_secret["PAYPAL_CLIENT_ID"]
}
moved {
  from = aws_ssm_parameter.secret["PAYPAL_CLIENT_SECRET"]
  to   = aws_ssm_parameter.external_secret["PAYPAL_CLIENT_SECRET"]
}
moved {
  from = aws_ssm_parameter.secret["AWS_ACCESS_KEY_ID"]
  to   = aws_ssm_parameter.external_secret["AWS_ACCESS_KEY_ID"]
}
moved {
  from = aws_ssm_parameter.secret["AWS_SECRET_ACCESS_KEY"]
  to   = aws_ssm_parameter.external_secret["AWS_SECRET_ACCESS_KEY"]
}
