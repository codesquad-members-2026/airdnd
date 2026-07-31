# acm.tf — TLS certificate for a CUSTOM domain on CloudFront (README §7).
#
# WHAT: requests a DNS-validated cert and creates its validation records.
#       ALL OPTIONAL — these resources only exist when var.domain_name is set.
#       Leave domain_name empty and CloudFront uses its free *.cloudfront.net
#       certificate instead (see cloudfront.tf); no cert or DNS is needed.
# WHY:  CloudFront only accepts custom-domain certs from us-east-1 (hence the
#       aliased provider). DNS validation proves ownership automatically.
# HOW:  `count` gates each resource on whether a domain was given. The [*]
#       splat + flatten keeps the downstream code valid even when count = 0.

resource "aws_acm_certificate" "cf" {
  count             = var.domain_name == "" ? 0 : 1
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  # 0 or 1 cert → a flat list of validation options (empty when no domain).
  cert_validation_options = flatten(aws_acm_certificate.cf[*].domain_validation_options)
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in local.cert_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.this[0].zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cf" {
  count                   = var.domain_name == "" ? 0 : 1
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cf[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}
