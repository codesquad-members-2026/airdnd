# s3.tf — private bucket holding the built React SPA (README §6).
#
# WHAT: the bucket plus its "block all public access" + ownership settings.
#       The bucket POLICY that lets CloudFront read it lives in cloudfront.tf,
#       because it must reference the distribution's ARN.
# WHY:  the bucket stays PRIVATE; only CloudFront (via OAC) reads objects. No
#       S3 website hosting — CloudFront serves the files over HTTPS.
# HOW:  the public-access-block is the safety net that stops any accidental
#       public ACL/policy from ever exposing the bucket.

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project}-frontend-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    object_ownership = "BucketOwnerEnforced" # ACLs off; policy-only access
  }
}
