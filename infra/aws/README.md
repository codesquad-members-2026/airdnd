# AirDND — AWS Deployment Runbook

One-time provisioning guide for deploying the monorepo to AWS.

**Target architecture:** a single CloudFront distribution fronts both deployables, so
the frontend and `/api` share one origin (no CORS, no cross-site cookie pain for the
Google OAuth session).

```
                        Route 53  (airdnd.example.com)
                            │
                  CloudFront distribution  (ACM cert → free HTTPS)
                            │
        default  /*  ───────┼─────── /api/*  /login/*  /oauth2/*  /auth/**
                            │                       │
                   S3 (private, OAC)        EC2 origin :8080 (Docker)
                   React dist/ (SPA)        Spring Boot boot jar (from ECR)
                                                    │
                                            RDS MySQL 8 (private subnet)
```

| Concern              | Choice                                              |
| -------------------- | --------------------------------------------------- |
| Region               | `ap-northeast-2` (Seoul) — **except ACM, see §7**   |
| Frontend             | S3 (private) + CloudFront + OAC                      |
| Backend              | Single EC2 `t4g.small` running one Docker container |
| Image registry       | ECR (private)                                       |
| Database             | RDS MySQL 8.x `db.t4g.micro`, single-AZ, private     |
| Secrets              | SSM Parameter Store (`SecureString`)                |
| TLS                  | One ACM cert on CloudFront (`us-east-1`)            |
| CI → AWS auth        | GitHub Actions OIDC role (no static keys)           |
| Est. cost            | ~$25–30/month                                       |

> Replace `airdnd.example.com`, `<ACCOUNT_ID>`, and any `<...>` placeholders with your
> real values as you go. Console steps are written so you *learn* the services; the CLI
> equivalents are given where they're faster.

---

## §0 Prerequisites

- AWS account with admin access (for the one-time setup).
- A registered domain. Easiest if it's in **Route 53**; an external registrar works too
  (you'll point an ALIAS/CNAME at CloudFront in §9).
- AWS CLI v2 configured locally (`aws configure`), default region `ap-northeast-2`.
- The repo: `github.com/codesquad-masters-team01/airdnd`.

Set shell vars you'll reuse:

```bash
export AWS_REGION=ap-northeast-2
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export APP=airdnd
export DOMAIN=airdnd.example.com
```

---

## §1 Networking & security groups

You can use the **default VPC**. Create three security groups so the dependency
direction is explicit:

| SG name            | Inbound rule                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `airdnd-ec2-sg`    | TCP 8080 from the **CloudFront** managed prefix list; TCP 22 from **your IP only** |
| `airdnd-rds-sg`    | TCP 3306 from `airdnd-ec2-sg` (source = the SG, not a CIDR)         |

For the CloudFront prefix list (so only CloudFront can reach the box on 8080):

```bash
aws ec2 describe-managed-prefix-lists \
  --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing \
  --query 'PrefixLists[0].PrefixListId' --output text
# → use this pl-xxxx id as the source of the 8080 inbound rule on airdnd-ec2-sg
```

> RDS lives in the VPC's **private** subnets and is **not** publicly accessible. Only the
> EC2 box talks to it.

---

## §2 RDS — MySQL 8

Console → RDS → Create database:

- Engine **MySQL 8.x**, template **Free tier / Dev**, class **`db.t4g.micro`**.
- Single-AZ, 20 GB gp3.
- **Public access: No.** VPC security group: `airdnd-rds-sg`.
- Initial DB name `airdnd`, master user `airdnd`, generate a strong password.
- Parameter group: set `character_set_server=utf8mb4`, `collation_server=utf8mb4_0900_ai_ci`
  (matches local `docker-compose.yml`).

Note the endpoint, e.g. `airdnd.abc123.ap-northeast-2.rds.amazonaws.com:3306`.

The JDBC URL you'll store in SSM (§5):

```
jdbc:mysql://<rds-endpoint>:3306/airdnd?useSSL=true&requireSSL=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
```

> Flyway (`V1…V5`) runs automatically on the backend's first boot against this empty DB,
> and `prod` uses `ddl-auto: validate`. **RDS must be up before the first backend deploy.**

---

## §3 ECR — backend image registry

```bash
aws ecr create-repository --repository-name $APP-backend \
  --image-scanning-configuration scanOnPush=true --region $AWS_REGION
```

Repo URI: `<ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/airdnd-backend`
(the backend workflow pushes here).

---

## §4 EC2 — the box that runs the container

Launch an instance:

- AMI **Amazon Linux 2023 (arm64)**, type **`t4g.small`** (ARM → cheaper; build the image
  for `linux/arm64`).
- Public subnet, **auto-assign public IP**, security group `airdnd-ec2-sg`.
- Attach an **IAM instance role** with these managed policies:
  - `AmazonSSMManagedInstanceCore` (lets the deploy use SSM Run Command — no SSH keys in CI)
  - `AmazonEC2ContainerRegistryReadOnly` (pull from ECR)
  - inline policy allowing `ssm:GetParametersByPath` on `arn:aws:ssm:*:<ACCOUNT_ID>:parameter/airdnd/prod/*`

User-data to install Docker + the SSM agent (preinstalled on AL2023, just enable):

```bash
#!/bin/bash
dnf update -y
dnf install -y docker
systemctl enable --now docker
systemctl enable --now amazon-ssm-agent
usermod -aG docker ec2-user
```

> The container will be started/restarted by the deploy workflow (§ deploy doc), which
> pulls env from SSM and runs `docker run -p 8080:8080 ...`. Nothing to hand-run here.

---

## §5 SSM Parameter Store — backend secrets

Store everything the `prod` profile reads under `/airdnd/prod/`. Use `SecureString` for
secrets, `String` for non-secret config.

```bash
P=/airdnd/prod
put()  { aws ssm put-parameter --name "$P/$1" --type SecureString --value "$2" --overwrite; }
puts() { aws ssm put-parameter --name "$P/$1" --type String       --value "$2" --overwrite; }

puts SPRING_PROFILES_ACTIVE        prod
puts SPRING_JPA_HIBERNATE_DDL_AUTO validate
puts APP_FRONTEND_BASE_URL         "https://$DOMAIN"

put  SPRING_DATASOURCE_URL         "jdbc:mysql://<rds-endpoint>:3306/airdnd?useSSL=true&requireSSL=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8"
put  SPRING_DATASOURCE_USERNAME    airdnd
put  SPRING_DATASOURCE_PASSWORD    "<rds-password>"

put  OAUTH2_GOOGLE_CLIENT_ID       "<google-client-id>"
put  OAUTH2_GOOGLE_CLIENT_SECRET   "<google-client-secret>"

put  PAYPAL_CLIENT_ID              "<paypal-sandbox-client-id>"
put  PAYPAL_CLIENT_SECRET          "<paypal-sandbox-client-secret>"
```

These map 1:1 to the env vars in `application.yml` / `application-prod.yml`. The deploy
step turns this path into a `--env-file` for `docker run`.

> Frontend build-time vars (`VITE_*`, Google Maps key) are **not** here — they're baked
> into the static bundle at CI build time, so they live as GitHub Actions secrets/vars.

---

## §6 S3 — frontend bucket

```bash
aws s3api create-bucket --bucket $APP-frontend-$ACCOUNT_ID \
  --region $AWS_REGION --create-bucket-configuration LocationConstraint=$AWS_REGION
aws s3api put-public-access-block --bucket $APP-frontend-$ACCOUNT_ID \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Keep it **private** — CloudFront reads it via Origin Access Control (§8). Do **not** enable
S3 static website hosting. The frontend workflow does `aws s3 sync dist/ s3://...`.

---

## §7 ACM — TLS certificate

CloudFront only accepts certs from **`us-east-1`**, regardless of where everything else lives.

```bash
aws acm request-certificate --region us-east-1 \
  --domain-name "$DOMAIN" --validation-method DNS
```

Add the CNAME validation record it asks for (auto-added if the domain is in Route 53).
Wait for status **ISSUED**.

---

## §8 CloudFront — the heart of the design

Create one distribution with **two origins** and path-based behaviors.

**Origins**
1. **S3 origin** → `airdnd-frontend-<acct>.s3.ap-northeast-2.amazonaws.com`, access via
   **Origin Access Control (OAC)**. CloudFront will give you a bucket policy to paste into
   the S3 bucket allowing `cloudfront.amazonaws.com` to `s3:GetObject`.
2. **Custom origin** → the EC2 public DNS, **HTTP only, port 8080**, protocol policy
   *HTTP only*. **Add a custom origin header:** `X-Forwarded-Proto: https`.
   *(This is how Spring — with `server.forward-headers-strategy: framework` — knows to build
   `https://` OAuth redirect URIs even though CloudFront talks to the box over HTTP.)*

**Behaviors** (order matters — most specific first; all → the EC2 origin except default):

| Path pattern        | Origin | Cache policy        | Origin request policy   |
| ------------------- | ------ | ------------------- | ----------------------- |
| `/api/*`            | EC2    | `CachingDisabled`   | `AllViewer`             |
| `/login/*`          | EC2    | `CachingDisabled`   | `AllViewer`             |
| `/oauth2/*`         | EC2    | `CachingDisabled`   | `AllViewer`             |
| `Default (*)`       | S3     | `CachingOptimized`  | `CORS-S3Origin`         |

> **Auth-critical:** the EC2 behaviors **must** use `CachingDisabled` + `AllViewer` so that
> cookies (`JSESSIONID`), query strings (the OAuth `code`/`state`), and the `Host` header are
> forwarded to the backend and responses are never cached. Get this wrong and login will
> silently loop. `AllViewer` forwards the viewer `Host`, which together with the
> `X-Forwarded-Proto: https` origin header gives Spring the correct external URL.

**Distribution settings**
- Alternate domain name (CNAME): `airdnd.example.com`; attach the §7 ACM cert.
- Viewer protocol policy: **Redirect HTTP to HTTPS**.
- **SPA fallback** (default behavior only): custom error responses
  `403 → /index.html (200)` and `404 → /index.html (200)` so client-side routes like
  `/auth/callback` resolve. *(Don't apply this to `/api/*` — those must surface real errors.)*

---

## §9 Route 53 — DNS

Create an **A / ALIAS** record for `airdnd.example.com` → the CloudFront distribution
domain (`dxxxx.cloudfront.net`). External registrar: use a CNAME instead (or move DNS to
Route 53).

---

## §10 GitHub Actions OIDC role (no long-lived keys)

Lets the two workflows authenticate to AWS without storing access keys.

**a. Register GitHub as an OIDC provider (once per account):**

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

**b. Trust policy** — `infra/aws/github-oidc-trust.json` (scoped to this repo):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:codesquad-masters-team01/airdnd:*" }
    }
  }]
}
```

```bash
aws iam create-role --role-name airdnd-gha-deploy \
  --assume-role-policy-document file://infra/aws/github-oidc-trust.json
```

**c. Permissions policy** the role needs (attach as inline policy):

- **ECR**: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`,
  `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`,
  `ecr:CompleteLayerUpload` on the `airdnd-backend` repo.
- **SSM**: `ssm:SendCommand` (to trigger the pull+restart on EC2) + `ssm:GetCommandInvocation`.
- **S3**: `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the frontend bucket.
- **CloudFront**: `cloudfront:CreateInvalidation` on the distribution.

Put the role ARN into the repo as a GitHub Actions **variable** `AWS_DEPLOY_ROLE_ARN`,
along with `ECR_REPOSITORY`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `EC2_INSTANCE_ID`,
and `AWS_REGION`. The workflows read these.

---

## §11 First-deploy order

Provision in this order so each step's dependency exists:

1. RDS up (§2) and reachable from the EC2 SG.
2. SSM params populated (§5).
3. EC2 up with Docker + instance role (§4).
4. Push the backend image and start the container *(backend deploy workflow)*.
5. Confirm the app booted: Flyway applied `V1…V5`, app listening on 8080.
6. S3 bucket + CloudFront + DNS + ACM live (§6–9).
7. Build & sync the frontend *(frontend deploy workflow)*.
8. **Register the Google OAuth redirect URI** (see §12) — do this before testing login.

---

## §12 Post-setup wiring & verification

**Google Cloud Console → Credentials → your OAuth client:**
- Authorized redirect URI: `https://airdnd.example.com/login/oauth2/code/google`
- Authorized JavaScript origin: `https://airdnd.example.com`

**Smoke tests:**
- `https://airdnd.example.com/` → SPA loads.
- `https://airdnd.example.com/api/rooms` → JSON (public endpoint).
- Click "Login with Google" → Google consent → lands back on `/auth/callback` logged in.
  *(If it loops back to login, re-check the §8 EC2-behavior cache/forward policies.)*
- Deep-link `https://airdnd.example.com/auth/callback` directly → no 404 (SPA fallback works).

---

## §13 Known trade-offs (acceptable for a learning/demo deploy)

- **Single EC2 = single point of failure**, and a redeploy restarts the container, which
  drops in-memory `HttpSession`s → users are logged out on each backend deploy. Fine for a
  demo; the upgrade path is sticky sessions on an ALB or moving the session store to Redis
  (ElastiCache).
- **CloudFront does not health-check a custom origin.** If the box is down, `/api/*`
  returns 5xx until you restart it.
- **PayPal is sandbox** (`api-m.sandbox.paypal.com`) — no real charges.

---

## §14 Teardown (stop the meter)

Delete in reverse: CloudFront (disable → delete), S3 bucket, EC2, RDS (final snapshot
optional), ECR repo, ACM cert, SSM params, IAM role + OIDC provider, Route 53 records.

---

## Cost sketch (Seoul, on-demand)

| Item                      | ~Monthly |
| ------------------------- | -------- |
| EC2 `t4g.small`           | ~$12     |
| RDS `db.t4g.micro`        | ~$12     |
| S3 + CloudFront (low traffic) | <$2  |
| Route 53 hosted zone      | $0.50    |
| **Total**                 | **~$25–30** |

First 12 months may be partly covered by AWS Free Tier (EC2/RDS micro hours, CloudFront).
