# versions.tf — pins Terraform and the provider plugins this config needs.
#
# WHAT: declares the minimum Terraform CLI version and which "providers"
#       (plugins that translate HCL into API calls) to download — here AWS,
#       plus a tiny helper that generates random passwords.
# WHY:  pinning makes the config reproducible. Without it, a future
#       `terraform init` could pull a newer provider with breaking changes
#       and produce a different result from identical code.
# HOW:  `terraform init` reads this, downloads the matching plugins into
#       ./.terraform/, and records the exact resolved versions in
#       .terraform.lock.hcl (which you SHOULD commit).

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40" # any 5.x >= 5.40, but not 6.x
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # NOTE: state is stored LOCALLY (terraform.tfstate) by default — fine for
  # learning. The "real" next step is a remote backend so state is shared and
  # locked; uncomment and create the bucket/table first:
  #
  # backend "s3" {
  #   bucket         = "airdnd-tfstate-<account_id>"
  #   key            = "aws/terraform.tfstate"
  #   region         = "ap-northeast-2"
  #   dynamodb_table = "airdnd-tflock"
  #   encrypt        = true
  # }
}
