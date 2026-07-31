# mysql.tf — self-managed MySQL 8 on a dedicated EC2 instance (replaces RDS).
#
# WHAT: a second EC2 box that runs `mysql:8.4` as a Docker container (same image
#       and flags as your local docker-compose.yml), with a SEPARATE EBS volume
#       holding the data, plus its own IAM role for SSM admin access.
# WHY:  you chose to manage MySQL yourself instead of RDS. Keeping the data on a
#       dedicated EBS volume means you can replace/upgrade the instance without
#       losing the database. The box has NO inbound from the internet — only the
#       app security group may reach 3306 (see network.tf), and you administer it
#       through SSM Session Manager (no SSH key, no port 22).
# HOW:  random_password generates the credentials (shared with the app via SSM
#       in ssm.tf); mysql-user-data.sh.tftpl formats+mounts the data volume on
#       first boot and starts the container with those credentials.
#
# TRADE-OFF vs RDS: you now own backups, patching, failover, and monitoring.
# A real "private" box would sit in a private subnet behind a NAT gateway
# (~$32/mo) or VPC endpoints; to stay cheap this box keeps a public IP for
# OUTBOUND package/image pulls only, locked down by its security group.

# Credentials. The app reads db (user) password from SSM; both live only here.
resource "random_password" "db" {
  length           = 24
  special          = true
  override_special = "!#%*-_=+" # JDBC/shell-safe specials only
}

resource "random_password" "mysql_root" {
  length           = 24
  special          = true
  override_special = "!#%*-_=+"
}

# Pick a subnet for the DB box (a different one from the app box if the default
# VPC has more than one) and learn its AZ — the EBS volume must be in that AZ.
locals {
  mysql_subnet_id = element(
    data.aws_subnets.default.ids,
    length(data.aws_subnets.default.ids) > 1 ? 1 : 0,
  )
}

data "aws_subnet" "mysql" {
  id = local.mysql_subnet_id
}

# Dedicated data volume — the database's data outlives the instance.
resource "aws_ebs_volume" "mysql_data" {
  availability_zone = data.aws_subnet.mysql.availability_zone
  size              = var.mysql_data_volume_size
  type              = "gp3"
  tags              = { Name = "${var.project}-mysql-data" }
}

# --- IAM role: SSM access so you can Session-Manager into the box (no SSH) ---
resource "aws_iam_role" "mysql" {
  name               = "${var.project}-mysql-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json # reused from ec2.tf
}

resource "aws_iam_role_policy_attachment" "mysql_ssm_core" {
  role       = aws_iam_role.mysql.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "mysql" {
  name = "${var.project}-mysql-profile"
  role = aws_iam_role.mysql.name
}

# --- The MySQL instance ----------------------------------------------------
resource "aws_instance" "mysql" {
  ami                    = data.aws_ami.al2023_arm64.id # reused from ec2.tf
  instance_type          = var.mysql_instance_type
  subnet_id              = local.mysql_subnet_id
  vpc_security_group_ids = [aws_security_group.db.id]
  iam_instance_profile   = aws_iam_instance_profile.mysql.name

  # Public IP for OUTBOUND only (package/image pulls). The DB security group
  # permits no inbound from the internet, so the box is effectively private.
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/mysql-user-data.sh.tftpl", {
    db_name          = var.db_name
    db_user          = var.db_username
    db_password      = random_password.db.result
    db_root_password = random_password.mysql_root.result
  })

  root_block_device {
    volume_size = 8 # standard AL2023 AMI floor; room for Docker + mysql image
    volume_type = "gp3"
  }

  tags = { Name = "${var.project}-mysql" }
}

# Attach the data volume. On Nitro instances (t4g) it surfaces as an NVMe
# device; the user-data script detects whichever name appears.
resource "aws_volume_attachment" "mysql_data" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.mysql_data.id
  instance_id = aws_instance.mysql.id
}
