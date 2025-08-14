# Tech Stack – Version 0.1 (Non‑Negotiable)

> Purpose: lock the baseline technologies so code generation stays consistent across modules.  
> Scope: applies to all app services, jobs, and tooling unless an ADR explicitly overrides.

## 1) Principles
- **Server‑rendered first** (no SPA). Keep UX simple and fast to ship.
- **Pythonic, boring tech**: choose mature, well‑documented libs.
- **Schema‑first APIs**: endpoints come from `openapi/leave_mgmt.yaml`.
- **Security by default**: follow OWASP ASVS L2 (see security-baseline.md).
- **Tests required**: unit + route/integration for every feature slice.

## 2) Backend
- Language: **Python 3.11+**
- Web framework: **Flask 3.x** (Blueprints + App Factory)
- Template engine: **Jinja2**
- Form handling: **WTForms**
- Auth/session: **Flask-Login** (JWT for APIs when needed)
- ORM: **SQLAlchemy 2.x** (declarative mappings)
- Migrations: **Alembic**
- Background jobs (optional, when needed): **RQ** (Redis Queue) or **Celery** (TBD via ADR)
- Caching: **Redis** (optional; configure via feature ADR)
- HTTP server (prod): **Gunicorn**
- Reverse proxy (edge): **Nginx**

## 3) Frontend
- CSS framework: **Bootstrap 5.x**
- Icons: **Bootstrap Icons** (preferred) or **FontAwesome Free**
- JS usage: vanilla JS only; **no SPA frameworks** (React/Vue/Angular are out)
- Optional progressive enhancement: **HTMX** (subject to ADR per feature)
- Static assets location: `/app/static/` with versioned filenames for cache busting

## 4) Data & Storage
- Primary DB: **PostgreSQL 15+**
- Timezone: store **UTC**; convert on render
- IDs: server‑generated UUIDv4 recommended (except where natural keys exist)
- Soft delete & audit fields: standardized mixins in models (created_at, updated_at, deleted_at, created_by, updated_by)

## 5) Packaging & Runtime
- Packaging: **pyproject.toml** (PEP 621) – *no requirements.txt*
- Virtual env: `venv` or `uv` (dev)
- Container base: `python:3.11-slim`
- Entrypoint: `gunicorn app.main:create_app()` (factory) with healthcheck route
- Config: **12‑factor** via env vars; `.env.example` only (never commit secrets)

## 6) Dev Tooling (local)
- Task runner: **Makefile** targets: `setup | lint | test | run | migrate | seed`
- Pre-commit: **pre-commit** hooks enforced locally and in CI
- DB migrations: `alembic` CLI; seeds under `/scripts`

## 7) Testing Toolchain
- Unit & integration: **pytest**, **pytest-flask**
- Coverage: `pytest-cov` (thresholds set in CI)
- Template/HTML checks: simple render assertions + HTML matchers
- E2E/UI (critical flows only): **Playwright**
- Contract tests (APIs): generated from **OpenAPI** via client stubs or schema validators
- Load/perf (smoke): **Locust** (lightweight profiles) – optional

## 8) Code Quality & Security
- Linting: **ruff**
- Formatting: **Black**
- Imports: **isort**
- Complexity: **Radon** (or ruff rules)
- Security SAST: **Bandit**, **semgrep**
- Dependency scan: **pip-audit** (or **Safety**)
- Dockerfile lint: **Hadolint**
- YAML lint: **yamllint**
- Template checks: **jinja-lint** (or semgrep rules)

## 9) CI/CD (baseline expectations)
- CI stages: `lint → unit → build → integration → security → e2e (critical) → package`
- Artifacts: coverage report, test reports (JUnit), SBOM, Docker image
- Image scan: required pass gate
- Deploy targets: **Docker Compose** (Dev/UAT), **Kubernetes** (Prod) – manifests/Helm charts under `/deployments`
- Rollback: previous image + DB migration rollback strategy (document per release)

## 10) Observability
- Logging: structured JSON; request ID and user ID included
- Metrics: request latency P50/P95/P99, error rate, throughput
- Tracing: W3C Trace Context headers (propagate `traceparent`/`tracestate`)
- Health endpoints: `/healthz` (liveness), `/readyz` (readiness)

## 11) Prohibited / Out of Scope (without ADR)
- SPA frameworks (React, Vue, Angular), state managers, heavy bundlers
- Mixing multiple ORMs or DB engines in the same service
- Ad‑hoc CSS not aligned with style guide tokens
- Creating endpoints not present in OpenAPI
- Committing secrets, disabling tests/linters in CI

## 12) Compatibility & Versions
- Minimum Python: **3.11**
- PostgreSQL: **15+**
- Flask: **3.x**
- Bootstrap: **5.x**
- Redis: **6.x+** (only if caching/queue is enabled)

**Change control:** Any deviation requires an ADR under `/docs/handbook/adr/` and an update to this file.
