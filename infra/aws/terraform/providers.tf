# providers.tf — configures the AWS provider(s).
#
# WHAT: a "provider" is a configured instance of a plugin. We declare TWO:
#       the main one in Seoul, and a second one ALIASED to us-east-1.
# WHY:  almost everything lives in ap-northeast-2 (Seoul). BUT CloudFront only
#       accepts ACM certificates created in us-east-1 (README §7). A provider
#       is locked to one region, so the cert needs its own us-east-1 provider.
# HOW:  resources use the default (Seoul) provider unless they opt in with
#       `provider = aws.us_east_1`. `default_tags` stamps EVERY resource with
#       these tags automatically — invaluable for cost tracking and teardown.

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Env       = var.environment
    }
  }
}

# Aliased provider — used ONLY by the ACM certificate (acm.tf).
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Env       = var.environment
    }
  }
}
