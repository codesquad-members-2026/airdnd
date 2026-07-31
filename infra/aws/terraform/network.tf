# network.tf — VPC lookups + security groups (README §1).
#
# WHAT: we do NOT create a VPC; we LOOK UP the account's default VPC and its
#       subnets with `data` sources, then create two security groups.
# WHY:  a learning deploy doesn't need a custom VPC. Security groups are
#       stateful firewalls; we encode the dependency direction explicitly:
#       CloudFront → app:8080, you → app:22, app → DB:3306.
# HOW:  `data` blocks READ existing infrastructure (read-only). `resource`
#       blocks CREATE/manage. A rule can reference another SG by id — that is
#       how "only the app box may reach the DB" is expressed (no IP ranges).

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# AWS-managed list of CloudFront's origin-facing IP ranges. Using it as the
# source on port 8080 means ONLY CloudFront edge servers can reach the box.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# --- EC2 security group ----------------------------------------------------
resource "aws_security_group" "ec2" {
  name        = "${var.project}-ec2-sg"
  description = "Backend box: 8080 from CloudFront only, 22 from your IP."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "App port, only from CloudFront edge"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  ingress {
    description = "SSH, only from your IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_ingress_cidr]
  }

  egress {
    description = "Allow all outbound (ECR pulls, SSM, OS updates)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Database security group (the self-managed MySQL box) ------------------
resource "aws_security_group" "db" {
  name        = "${var.project}-db-sg"
  description = "MySQL 3306, reachable only from the app EC2 security group."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "MySQL from the backend app box only"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id] # SG-to-SG, not a CIDR
  }

  # node-exporter (machine metrics for this DB box) scraped by Prometheus, which
  # runs on the backend box. Same SG-to-SG pattern, no internet exposure. Only
  # needed for DB-box CPU/disk/IO graphs; DB *internal* metrics go via
  # mysqld-exporter over 3306 above and need no rule here.
  ingress {
    description     = "node-exporter from the backend app box only"
    from_port       = 9100
    to_port         = 9100
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
