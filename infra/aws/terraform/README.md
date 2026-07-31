# AirDND — Terraform skeleton

This is the **Infrastructure-as-Code** translation of the prose runbook in
`../README.md`. Same architecture, but here it's *reproducible*: one
`terraform apply` builds the whole stack, and one `terraform destroy` removes it.

> Status: **skeleton**. It's structured and commented to learn from. Read every
> `<placeholder>`, fill in `terraform.tfvars`, and run `plan` before `apply`.

## File map (each maps to a section of ../README.md)

| File                    | Runbook § | What it creates |
| ----------------------- | --------- | --------------- |
| `versions.tf`           | —         | Terraform + provider version pins, (commented) remote state backend |
| `providers.tf`          | —         | AWS provider for Seoul + an aliased one for us-east-1 (ACM) |
| `variables.tf`          | —         | All inputs (domain, sizes, secrets) |
| `terraform.tfvars.example` | §0     | Template for your real values |
| `network.tf`            | §1        | Default-VPC lookups + app/DB security groups |
| `mysql.tf`              | §2        | Self-managed MySQL 8 on a dedicated EC2 box + EBS data volume |
| `mysql-user-data.sh.tftpl` | §2     | First-boot: mount data volume, run mysql:8.4 container |
| `ecr.tf`                | §3        | Private image registry + cleanup policy |
| `ec2.tf`                | §4        | App: AL2023 arm64 instance, IAM role, Docker bootstrap |
| `user-data.sh.tftpl`    | §4        | App first-boot script (installs Docker) |
| `ssm.tf`                | §5        | Parameter Store entries (config + secrets) |
| `s3.tf`                 | §6        | Private frontend bucket |
| `acm.tf`                | §7        | *(optional)* TLS cert for a custom domain, us-east-1 |
| `cloudfront.tf`         | §8        | The CDN: 2 origins, path behaviors, OAC, bucket policy |
| `dns.tf`                | §9        | *(optional)* Route 53 ALIAS → CloudFront |
| `iam_github_oidc.tf`    | §10       | GitHub Actions OIDC provider + deploy role |
| `outputs.tf`            | §10/§12   | Values to wire into GitHub Actions vars |

## The big idea: you don't order the steps — Terraform does

The runbook's §11 carefully lists "do RDS before the backend, SSM before EC2…".
In Terraform you **don't** specify order. Because `ssm.tf` *references*
`aws_instance.mysql.private_ip`, Terraform infers the MySQL box must exist first
and builds a **dependency graph**, then creates things in the right order (and in
parallel where it can). That graph is the core thing IaC buys you over a runbook.

## No domain yet? Launch on the CloudFront URL

A custom domain is **optional**. If `domain_name` is empty (the default), the
stack skips ACM + Route 53 and CloudFront serves the app over HTTPS at its own
generated `https://dxxxx.cloudfront.net` address. Everything else — S3,
CloudFront, OAC, the backend, MySQL — works exactly the same.

After `apply`, run `terraform output app_url` to get the address. To switch to a
custom domain later, just set `domain_name` + `route53_zone_name` and re-apply;
the ACM cert and DNS records appear automatically.

> Google OAuth: register the redirect URI for whatever URL you launch on, e.g.
> `https://dxxxx.cloudfront.net/login/oauth2/code/google`.

## Usage

```bash
cd infra/aws/terraform

cp terraform.tfvars.example terraform.tfvars   # then edit it

terraform init      # download providers, set up state
terraform fmt       # canonical formatting
terraform validate  # syntax/type check (no AWS calls)
terraform plan      # DRY RUN: shows exactly what will be created
terraform apply     # build it (asks for confirmation)

terraform output    # the IDs/ARNs to put in GitHub Actions vars
```

Tear it all down (stop the meter) when you're done learning:

```bash
terraform destroy
```

## Things that are deliberately simplified (learning trade-offs)

- **Local state.** `terraform.tfstate` sits on your laptop and *contains
  secrets in plaintext* (DB password). That's why it's gitignored. Real teams
  use the S3+DynamoDB backend sketched (commented) in `versions.tf`.
- **One environment.** `var.environment` lets you reuse the code, but there's
  one state file. Multiple envs → workspaces or separate state.
- **Single EC2.** Same single-point-of-failure trade-off the runbook's §13
  calls out. The IaC upgrade path: swap the bare instance for an ALB + Auto
  Scaling Group, move sessions to ElastiCache Redis.
- **No app on the box yet.** Terraform builds the *infrastructure*; the
  container image is built and deployed by the GitHub Actions workflows, which
  assume the role from `iam_github_oidc.tf`. IaC stops at the door of the box;
  the deploy pipeline takes it from there.
