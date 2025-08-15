# Deployment Decisions Checklist (LMS)

> Use this to make deployment choices **without touching app code**. Most items are ops/config only.

## 0) Environments & Branches
- [ ] Environments: ☐ dev ☐ staging ☐ prod ☐ demo
- [ ] Branch policy: `main` → prod; feature branches via PR; tags for releases
- [ ] Config separation: one `.env` per environment (not in git)

**Files:** none

---

## 1) Container Registry & Image Tags
- [ ] Registry: ☐ GHCR (recommended) ☐ Docker Hub ☐ ECR/GAR/ACR ☐ Other
- [ ] Visibility: ☐ private ☐ public
- [ ] Tag scheme: ☐ `latest` + short SHA ☐ semver (`vX.Y.Z`) ☐ env tags (`prod`, `stg`)

**Files:** `.github/workflows/publish.yml` (CI to build/push)

---

## 2) Database (PostgreSQL)
- [ ] Choice: ☐ Postgres container (simple) ☐ Amazon RDS (managed) ☐ Existing on-prem
- [ ] Connectivity: ☐ same host ☐ VPC peering ☐ public + IP allowlist
- [ ] Credentials & rotation plan

**Files:** `.env` (set `DATABASE_URL` or `DB_*`), `docker/docker-compose.yml` (include/omit `db` service)

---

## 3) Secrets & Config
- [ ] Where stored: ☐ `.env` (server) ☐ SSM/Secrets Manager ☐ Vault
- [ ] Required keys present: `SECRET_KEY`, `DATABASE_URL` (or `DB_*`), `LOG_LEVEL`, `LOG_JSON`, `GUNICORN_*`
- [ ] Rotation cadence & owner

**Files:** `.env` (per env), `docs/runbooks/secrets.md` (optional)

---

## 4) TLS / Reverse Proxy
- [ ] Proxy: ☐ Nginx + Certbot ☐ Traefik (auto-TLS) ☐ Cloud LB/ALB
- [ ] Domain: `lms.<yourdomain>`
- [ ] Redirect HTTP→HTTPS, basic security headers

**Files:** `docker/docker-compose.override.yml` (proxy), `docker/nginx/` (configs)

---

## 5) Networking & Ports
- [ ] Exposed ports: App `443` (proxy) → internal `8000`; DB `5432` not public
- [ ] Security groups / firewalls configured
- [ ] Health endpoints allowed: `/healthz`, `/readyz`

**Files:** none

---

## 6) Migrations Strategy
- [ ] How to run: ☐ manual `compose run app alembic upgrade head` (safe) ☐ CI job ☐ one-shot “migrate” container
- [ ] Gate deploy on `/readyz`==OK

**Files:** deploy scripts (optional), `.github/workflows/deploy.yml` (optional)

---

## 7) Backups & Restore
- [ ] If containerized DB: schedule `pg_dump` to encrypted storage (e.g., S3)
- [ ] If RDS: enable automated backups + snapshots
- [ ] Restore drill documented (RTO/RPO targets)

**Files:** `docs/runbooks/backup_restore.md`, scripts (optional)

---

## 8) Observability
- [ ] Logs: ☐ stdout (JSON on) ☐ ship to ELK/Loki/CloudWatch
- [ ] Uptime monitoring: hit `/healthz`; deploy gate: `/readyz`
- [ ] Metrics (optional): add `/metrics` later if needed

**Files:** none (logging via `LOG_JSON`)

---

## 9) Scaling & HA (later)
- [ ] ☐ Single EC2 with compose (MVP) ☐ ASG/ELB ☐ Kubernetes
- [ ] Gunicorn workers per CPU/mem (`GUNICORN_WORKERS`)

**Files:** compose/infra as code (when scaling)

---

## 10) Security & Compliance
- [ ] Least-priv SG rules; DB not public
- [ ] OS patching; Docker base image updates (Dependabot + CI)
- [ ] Access model: who can deploy / read secrets
- [ ] Data residency / encryption at rest (RDS or disk)

**Files:** `docs/security.md` (optional)

---

## 11) Release & Rollback
- [ ] Release cadence & versioning (tags)
- [ ] Rollback plan (previous image tag + re-apply migrations if needed)
- [ ] Change approval path (PRs, status checks)

**Files:** `.github/workflows/publish.yml`, `docs/release.md`

---

## 12) Offline / Air-gapped (optional)
- [ ] Provide `app-image.tar`, `postgres.tar`, `.env`, compose file
- [ ] Install steps documented (`docker load`, `compose up`, migrations)

**Files:** `docs/runbooks/offline_install.md`

---

## Defaults (recommended starting point)
- Registry: **GHCR**, tags `latest` + short SHA
- DB: **RDS** for production; container DB for dev/demo
- Proxy: **Nginx+Certbot** (or **Traefik** if hosting many apps)
- Migrations: manual one-liner on deploy
- Logs: JSON (`LOG_JSON=1`)
- Restart policy: `unless-stopped`

## One-time certificate issuance (on the server)
- Assuming DNS points to the server and Nginx (HTTP config) is running:
    # start app + db + nginx (HTTP only)
        docker compose -f docker/docker-compose.yml -f docker/docker-compose.proxy.yml up -d

    # issue cert via webroot (replace DOMAIN and EMAIL)
        docker compose -f docker/docker-compose.yml -f docker/docker-compose.proxy.yml \
        run --rm certbot certonly --webroot -w /var/www/certbot \
        -d YOUR_DOMAIN --email your@email.com --agree-tos --no-eff-email

    # You should see “Congratulations! Your certificate and chain have been saved at …”.

## Enable HTTPS
    # Stop Nginx, swap config, start again
        # stop nginx
            docker compose -f docker/docker-compose.yml -f docker/docker-compose.proxy.yml stop nginx

        # swap the mounted config in docker-compose.proxy.yml:
        # comment http.conf line and uncomment https.conf line

        # start nginx with HTTPS
            docker compose -f docker/docker-compose.yml -f docker/docker-compose.proxy.yml up -d nginx
        # Now https://YOUR_DOMAIN should work and HTTP should redirect.

## Renew (monthly)
    # Set a server cron (host-level) like:
        # crontab -e
            0 3 1 * * docker compose -f /path/to/docker/docker-compose.yml -f /path/to/docker/docker-compose.proxy.yml run --rm certbot renew --webroot -w /var/www/certbot && docker exec lms_nginx nginx -s reload
    # (Adjust the paths and schedule to your needs.)

    # If you prefer a containerized scheduler later, we can add a tiny cron sidecar that runs the same command; host cron is simplest to start.
