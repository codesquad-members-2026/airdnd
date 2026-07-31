# variables.tf — the inputs to this configuration (its "function arguments").
#
# WHAT: every value that changes between deployments or that you don't want
#       hard-coded. Real values go in terraform.tfvars (gitignored).
# WHY:  keeps environment-specific values and secrets out of the code, and
#       lets the same code serve dev/staging/prod.
# HOW:  Terraform resolves variables from terraform.tfvars, -var flags, or
#       TF_VAR_* env vars. `sensitive = true` hides the value in plan output.

variable "project" {
  description = "Name prefix for all resources, e.g. \"airdnd\"."
  type        = string
  default     = "airdnd"
}

variable "environment" {
  description = "Environment label (dev/staging/prod). Used in names & tags."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "Primary region for everything except the ACM cert."
  type        = string
  default     = "ap-northeast-2"
}

variable "domain_name" {
  description = "Custom domain, e.g. airdnd.example.com. LEAVE EMPTY (\"\") to use the free CloudFront-generated *.cloudfront.net domain — no domain, Route 53, or ACM needed."
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone that owns domain_name. Ignored when domain_name is empty."
  type        = string
  default     = ""
}

variable "ssh_ingress_cidr" {
  description = "Your IP in CIDR form (e.g. 1.2.3.4/32) allowed to SSH to EC2."
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 size. t4g.small (2GB) is the realistic floor for the JVM."
  type        = string
  default     = "t4g.small"
}

# --- WAF rate limiting on CloudFront (cloudfront.tf) -----------------------
# CloudFront has no native rate-limit switch; it's a WAF feature. These three
# vars are the on/off + tuning for it.
variable "enable_waf_rate_limit" {
  description = "Create + attach the WAF rate-based rule to the CloudFront distribution. false = no WAF at all (fully off, no charges)."
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "Max requests per client IP over WAF's 5-minute sliding window before the rule trips. AWS floor is 100."
  type        = number
  default     = 2000
}

variable "waf_rate_limit_block" {
  description = "true = BLOCK over-limit IPs; false = COUNT only (meter without blocking). Start false, tune waf_rate_limit against real traffic, then flip true."
  type        = bool
  default     = false
}

variable "mysql_instance_type" {
  # t4g.micro (1GB) OOM-kills mysqld under load — MySQL 8 resident set is ~700MB,
  # leaving almost no headroom. t4g.small (2GB) is the realistic floor for the DB.
  description = "EC2 size for the self-managed MySQL box."
  type        = string
  default     = "t4g.small"
}

variable "mysql_data_volume_size" {
  description = "Size (GiB) of the dedicated EBS volume holding MySQL data. gp3's hard floor is 1 GiB; 8 is a safe practical minimum for MySQL 8."
  type        = number
  default     = 8
}

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "airdnd"
}

variable "db_username" {
  description = "MySQL application username."
  type        = string
  default     = "airdnd"
}

variable "github_repo" {
  description = "owner/repo allowed to assume the deploy role via OIDC."
  type        = string
  default     = "codesquad-masters-team01/airdnd"
}

# --- Secrets that originate OUTSIDE AWS (Google, PayPal). ssm.tf stores them.
# REQUIRED (no defaults): a previous apply with these unset fell back to a
# "REPLACE_ME" default and OVERWROTE the live prod secrets in SSM, taking down
# login + image uploads. Omitting them now fails the apply loudly instead.
# Provide via terraform.tfvars (gitignored), -var, or TF_VAR_* env.
variable "oauth_google_client_id" {
  type      = string
  sensitive = true
}
variable "oauth_google_client_secret" {
  type      = string
  sensitive = true
}
variable "paypal_client_id" {
  type      = string
  sensitive = true
}
variable "paypal_client_secret" {
  type      = string
  sensitive = true
}

# AWS keys the backend uses to sign presigned S3 uploads (uploads.tf / S3Config).
# From your .env: AWS_ACCESS_KEY / AWS_ACCESS_SECRET_KEY. Also REQUIRED.
variable "aws_access_key_id" {
  type      = string
  sensitive = true
}
variable "aws_secret_access_key" {
  type      = string
  sensitive = true
}
