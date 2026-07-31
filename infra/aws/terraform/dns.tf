# dns.tf — point a CUSTOM domain at CloudFront (README §9).
#
# OPTIONAL — only active when var.domain_name is set. With no domain you reach
# the app at the CloudFront-generated https://dxxxx.cloudfront.net URL and need
# none of this.
#
# WHAT: looks up the hosted zone and adds an A/ALIAS record → CloudFront.
# WHY:  an ALIAS points your domain at CloudFront for free and tracks its IPs.
# HOW:  `count` gates both the lookup and the record on whether a domain exists.

data "aws_route53_zone" "this" {
  count = var.domain_name == "" ? 0 : 1
  name  = var.route53_zone_name
}

resource "aws_route53_record" "app" {
  count   = var.domain_name == "" ? 0 : 1
  zone_id = data.aws_route53_zone.this[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}
