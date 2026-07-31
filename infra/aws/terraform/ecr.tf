# ecr.tf — private Docker image registry for the backend (README §3).
#
# WHAT: one ECR repository the CI workflow pushes the backend image to and
#       the EC2 box pulls from, plus a lifecycle policy to keep it cheap.
# WHY:  you need a private place to store the built container image; ECR
#       integrates with the EC2 instance role (ec2.tf) so no docker-login
#       passwords are stored anywhere.
# HOW:  scan_on_push runs a basic CVE scan; the lifecycle policy expires old
#       images so you don't pay to store dozens of stale builds.

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only the 10 most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
