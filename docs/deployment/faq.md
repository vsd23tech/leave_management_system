# Deployment / Ops FAQ

_Last updated: YYYY-MM-DD_

## How are logs handled today?
- **App logs** to stdout. Set `LOG_JSON=1` for structured JSON (already wired).
- **Gunicorn** emits access/error logs to stdout (captured by Docker).
- Later, ship logs to ELK/Loki/CloudWatch; no app code changes needed.

## Will we have an audit trail of user actions?
Yes. Planned approach:
- Add an `audit_log` table (`occurred_at`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` JSONB, `ip`, `user_agent`).
- Provide `log_event(actor_id, action, entity_type, entity_id, metadata={})` helper and call it in CRUD routes.
- Optional alternative: DB triggers for row-change history; good for diffs, less semantic than app-level events.

## What about request IDs / correlation IDs?
We’ll add middleware that:
- Generates/propagates `X-Request-ID`,
- Logs it on every line,
- Echoes it in responses to help correlate client ⇄ server ⇄ DB actions.

## How much do HTTPS certificates cost?
- **Let’s Encrypt / ZeroSSL DV:** Free (automated renewals).
- **AWS ACM:** Free when attached to ALB/CloudFront (infra costs apply).
- **Paid (annual):** DV ~$10–50, OV ~$150–400, EV ~$300–900, wildcard DV ~$80–200. Exact pricing varies.

## Do server and local `.env` files conflict?
No. Your local `.env` stays on your laptop; the server has its own `.env`. In the repo, we keep **examples** only (`*.env.example`, `docs/deployment/server.env.example`).

## How do we back up and restore the DB?
- **Containerized Postgres:** `pg_dump` from the `lms_db` container to an encrypted location (e.g., S3). Restore with `pg_restore`.
- **RDS:** Use automated backups + snapshots. Do a restore drill to validate RTO/RPO.

## How do we deploy safely?
- Build & push image (GHCR).
- On the server: `docker compose pull && docker compose up -d`.
- Run migrations: `docker compose run --rm app alembic upgrade head`.
- Gate with `/readyz` (returns 200 when DB + migrations ok).

## What default security posture should we keep?
- Keep DB **not** publicly exposed.
- Use strong `SECRET_KEY`, rotate DB creds, use least-priv SG rules.
- Keep images updated (Dependabot + CI). Patch OS regularly.

## What could require app changes later?
- **File uploads** (choose S3 vs local disk), **background jobs** (add worker), or **websockets** (ASGI). We’ll design these when needed.
