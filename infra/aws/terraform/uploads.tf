# uploads.tf — S3 bucket for user-uploaded room images (presigned-PUT pattern).
#
# WHAT: a bucket the SPA uploads images to directly, using short-lived presigned
#       PUT URLs the backend signs (com.airdnd.room.S3PresignService). Objects
#       are public-read so they render from publicBaseUrl, and CORS permits the
#       browser's cross-origin PUT from the CloudFront site.
# WHY:  the backend never proxies the bytes — the browser talks to S3 directly —
#       so S3 itself needs CORS, and the <img src> needs public read.
# HOW:  the SIGNING identity (the AWS keys in SSM) needs s3:PutObject (managed on
#       that IAM user); the bucket policy here grants only public s3:GetObject.

resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project}-uploads-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_ownership_controls" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    object_ownership = "BucketOwnerEnforced" # ACLs off; access via policy only
  }
}

# Permit a public bucket POLICY (for read) while keeping ACLs blocked.
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false # we attach the public-read policy below
  restrict_public_buckets = false
}

# Public read of objects so <img src="<publicBaseUrl>/<key>"> works.
data "aws_iam_policy_document" "uploads_public_read" {
  statement {
    sid       = "PublicReadObjects"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket     = aws_s3_bucket.uploads.id
  policy     = data.aws_iam_policy_document.uploads_public_read.json
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}

# CORS: the browser PUTs the image straight to S3 from the CloudFront site.
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_methods = ["PUT", "GET"]
    allowed_origins = [local.frontend_base_url] # the SPA origin
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
