# airdnd monitoring (Prometheus + Grafana)

Continuous dashboards for the three latency layers, fed by real traffic:

| Layer | Source | Key signals |
|-------|--------|-------------|
| **App / pool** | Spring actuator (`:8081/actuator/prometheus`) | `hikaricp_connections_pending`, `hikaricp_connections_acquire_seconds` (wait), `hikaricp_connections_usage_seconds` (hold), `tomcat_threads_busy`, `http_server_requests_seconds` p95/p99 |
| **MySQL** | `mysqld-exporter` | `mysql_global_status_threads_running`, slow queries, InnoDB row ops, lock waits, per-digest latency |
| **Machine** | `node-exporter` + `cadvisor` | host CPU / load / disk-IO, per-container CPU & memory |

Everything stays **private**: Grafana binds to `127.0.0.1:3000` on the box and is reached
through an SSM tunnel; the actuator port `8081` is not in the public security group; the
exporters and Prometheus have no published ports at all.

## Topology (two boxes — see infra/aws/terraform)

The repo is **not** checked out on the boxes; everything is shipped over SSM by
`scripts/deploy-monitoring-prod.sh` (same transport as the seed-prod scripts).

```
airdnd-backend box                         airdnd-mysql box
  app :8081 (actuator)  ◄─ localhost ──┐     mysql :3306 ◄─ private, app-SG only
  prometheus ─┬─ localhost:8081         │     node-exporter :9100 ◄─ db-SG :9100 rule
              ├─ mysqld-exporter ──────────────► (private IP:3306)
              ├─ node-exporter (backend box)
              └─ cadvisor
  grafana :3000 (loopback) ◄─ SSM tunnel
```

## One-time prerequisites

1. **Redeploy the app** so the container publishes `8081` (already wired into
   `apps/backend/docker/remote-deploy.sh`). Verify on the backend box:
   `curl -s localhost:8081/actuator/prometheus | head`.
2. **`terraform apply`** to add the db-SG `:9100` rule (only needed for DB-box
   machine metrics; DB internals via mysqld-exporter work without it).

No manual user/secret steps — the deploy script generates the exporter user,
the `.my.cnf`, and the Grafana password for you.

## Deploy (from your laptop)

```bash
scripts/deploy-monitoring-prod.sh                 # ships + starts on both boxes
# GF_ADMIN_PASSWORD=mypw scripts/deploy-monitoring-prod.sh   # set Grafana admin pw
scripts/deploy-monitoring-prod.sh --down          # tear it all down
```

It prints the Grafana admin password at the end. (For a local trial instead,
`docker compose -f monitoring/docker-compose.yml up -d` still works after
`cp .env.example .env` and filling `mysqld-exporter/.my.cnf`.)

## View it (from your laptop)

```bash
scripts/monitoring-tunnel.sh        # SSM port-forward 3000 -> localhost:3000
# open http://localhost:3000  (admin / printed password)
```

## Import dashboards

Datasource "Prometheus" is auto-provisioned. In Grafana → **Dashboards → Import**, paste an ID:

| ID | Dashboard | Layer |
|----|-----------|-------|
| **4701** | JVM (Micrometer) | app/pool — has a HikariCP section |
| **6756** | Spring Boot Statistics | app/pool — http p95/p99, threads |
| **7362** | MySQL Overview | MySQL |
| **1860** | Node Exporter Full | machine |
| **14282** | cAdvisor | per-container |

(Or download each JSON into `monitoring/grafana/dashboards/` to auto-provision them.)

## Reading it — find the bottleneck

Put these side by side at peak traffic:

- `hikaricp_connections_acquire_seconds` **high** while `*_usage_seconds` low → **pool too small** (raise Hikari `maximum-pool-size`).
- `*_usage_seconds` / MySQL digest latency **high** → **query/index** (the PK-walk; EXPLAIN).
- `tomcat_threads_busy` near max with MySQL idle → **business logic** holding threads.
- node/cadvisor CPU or disk-IO saturated → **machine** is the ceiling.

## Tear down

```bash
docker compose -f monitoring/docker-compose.yml down          # keep data volumes
docker compose -f monitoring/docker-compose.yml down -v       # also wipe history
```
