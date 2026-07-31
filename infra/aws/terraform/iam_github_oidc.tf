# iam_github_oidc.tf — let GitHub Actions deploy without stored AWS keys (§10).
#
# WHAT: registers GitHub's OIDC identity provider and a role the workflows
#       assume, scoped to THIS repo, with exactly the deploy permissions needed.
# WHY:  no long-lived access keys to leak. GitHub hands the workflow a signed
#       token; AWS trusts it ONLY for the repo named in the condition below.
# HOW:  the trust policy restricts `sub` to your repo; the permissions policy
#       grants push-to-ECR, trigger-SSM, sync-S3, invalidate-CloudFront. This
#       replaces the manual `infra/aws/github-oidc-trust.json` runbook step.

# The GitHub OIDC provider is ACCOUNT-GLOBAL (one per account) and already
# exists here — likely created once by a teammate, since this is a shared team
# repo. So we LOOK IT UP with a data source instead of creating it. Bonus:
# `terraform destroy` then won't delete a provider other repos/people depend on.
#
# (In a brand-new account where it does NOT exist yet, switch this back to a
# `resource` block with client_id_list + thumbprint_list to create it once.)
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# Trust policy: who may assume this role, and under what condition.
data "aws_iam_policy_document" "gha_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "gha_deploy" {
  name               = "${var.project}-gha-deploy"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
}

# Permissions policy: the least set the two deploy workflows need.
data "aws_iam_policy_document" "gha_perms" {
  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"] # this token action does not support resource scoping
  }
  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      # buildx does a HEAD on the manifest/tag while pushing to verify it; that
      # read needs BatchGetImage (and GetDownloadUrlForLayer for cache-from).
      # Without these the push fails with 403 even though layers upload fine.
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [aws_ecr_repository.backend.arn]
  }
  statement {
    sid       = "SsmDeploy"
    actions   = ["ssm:SendCommand", "ssm:GetCommandInvocation"]
    resources = ["*"]
  }
  statement {
    # The deploy step resolves the target box by its Name tag at runtime
    # (so a replaced instance id never breaks the deploy). DescribeInstances
    # does not support resource-level scoping, hence "*".
    sid       = "Ec2Lookup"
    actions   = ["ec2:DescribeInstances"]
    resources = ["*"]
  }
  statement {
    sid       = "S3Sync"
    actions   = ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.frontend.arn, "${aws_s3_bucket.frontend.arn}/*"]
  }
  statement {
    sid       = "CfInvalidate"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.this.arn]
  }
}

resource "aws_iam_role_policy" "gha_perms" {
  name   = "deploy"
  role   = aws_iam_role.gha_deploy.id
  policy = data.aws_iam_policy_document.gha_perms.json
}
