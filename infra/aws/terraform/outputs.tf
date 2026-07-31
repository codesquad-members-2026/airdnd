# outputs.tf — values you need after `terraform apply`.
#
# WHAT: prints useful identifiers once the infra exists.
# WHY:  the deploy workflows need the ECR URI, S3 bucket, distribution id,
#       EC2 instance id, and the role ARN — these become the GitHub Actions
#       variables listed in README §10.
# HOW:  `terraform output` shows all; `terraform output -raw db_password`
#       reveals a sensitive one when you explicitly ask.

output "ecr_repository_url" {
  description = "Set as GitHub Actions var ECR_REPOSITORY."
  value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket" {
  description = "Set as GitHub Actions var S3_BUCKET."
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "Set as GitHub Actions var CLOUDFRONT_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain" {
  description = "The dxxxx.cloudfront.net domain (for sanity checks)."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "app_url" {
  description = "Open this once apply finishes (custom domain or cloudfront.net)."
  value       = local.frontend_base_url
}

output "ec2_instance_id" {
  description = "Set as GitHub Actions var EC2_INSTANCE_ID."
  value       = aws_instance.backend.id
}

output "gha_deploy_role_arn" {
  description = "Set as GitHub Actions var AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.gha_deploy.arn
}

output "backend_public_ip" {
  description = "Stable Elastic IP of the backend box (CloudFront origin). Survives stop/start."
  value       = aws_eip.backend.public_ip
}

output "mysql_private_ip" {
  description = "Private IP of the self-managed MySQL box (app connects here)."
  value       = aws_instance.mysql.private_ip
}

output "mysql_instance_id" {
  description = "Use with: aws ssm start-session --target <id> to admin MySQL."
  value       = aws_instance.mysql.id
}

output "db_password" {
  description = "Generated DB master password (terraform output -raw db_password)."
  value       = random_password.db.result
  sensitive   = true
}
