# ec2.tf — the single box that runs the backend container (README §4).
#
# WHAT: finds the latest Amazon Linux 2023 arm64 AMI, builds the IAM role the
#       instance runs as, and launches the instance with a bootstrap script.
# WHY:  the instance role lets the box pull from ECR and read SSM params with
#       NO stored credentials — it gets temporary creds automatically. The
#       user-data script installs Docker on first boot (thin config layer).
# HOW:  an instance "assumes" its instance-profile role for rotating creds.
#       templatefile() renders user-data.sh.tftpl into the instance.

data "aws_caller_identity" "current" {}

# Latest official AL2023 arm64 image — no hard-coded AMI id to go stale.
data "aws_ami" "al2023_arm64" {
  most_recent = true
  owners      = ["amazon"]

  # Pin to the STANDARD AL2023 line (8 GiB root). The bare "al2023-ami-*-arm64"
  # glob also matches the ecs-optimized (30 GiB) and minimal (2 GiB) variants,
  # and most_recent would pick whichever was published last — don't use it.
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-6.1-arm64"]
  }
  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# --- IAM role the instance runs as ----------------------------------------
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${var.project}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Managed policies: SSM Run Command (no SSH needed for deploys) + ECR pulls.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Inline policy: read ONLY this app's SSM parameter path — least privilege.
resource "aws_iam_role_policy" "ssm_params" {
  name = "read-${var.project}-ssm-params"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ssm:GetParametersByPath", "ssm:GetParameters", "ssm:GetParameter"]
      # GetParametersByPath authorizes against the PATH NODE itself
      # (".../parameter/airdnd/prod"), while GetParameter needs the CHILDREN
      # (".../airdnd/prod/*"). Grant both or the path call gets AccessDenied.
      Resource = [
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}",
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}/*",
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# --- The instance ----------------------------------------------------------
resource "aws_instance" "backend" {
  ami                    = data.aws_ami.al2023_arm64.id
  instance_type          = var.ec2_instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  associate_public_ip_address = true # CloudFront reaches it via public DNS

  user_data = templatefile("${path.module}/user-data.sh.tftpl", {})

  root_block_device {
    volume_size = 8 # standard AL2023 AMI floor; room for Docker + the image
    volume_type = "gp3"
  }

  tags = { Name = "${var.project}-backend" }

  # The AMI data source uses most_recent=true, so it re-resolves to a NEWER
  # AL2023 image whenever AWS publishes one — which would force-replace this
  # box (new instance id) on an unrelated apply. Ignore ami drift so the box is
  # only replaced when WE deliberately change it; the deploy then never breaks
  # from a surprise id rotation.
  lifecycle {
    ignore_changes = [ami]
  }
}

# --- Stable public address -------------------------------------------------
# A plain public IP is RELEASED on every stop/start, so the box comes back on a
# new IP/DNS and CloudFront's origin (set at apply time) goes stale → 504. An
# Elastic IP is a fixed address that stays attached across stop/start, so the
# origin hostname never changes. CloudFront points at THIS DNS, not the
# instance's ephemeral one. (An EIP attached to a running instance is free.)
resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"
  tags     = { Name = "${var.project}-backend-eip" }
}
