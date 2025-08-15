# Data Residency, Encryption & Compliance (Reference)

_Last updated: 2025-08-15_

## Residency Models
- **Single-tenant per region (recommended):** Deploy per required region (e.g., ap-south-1 for India, eu-central-1 for EU). Each has its own DB & backups.
- **Global + regional shards:** If aggregation is needed, fetch **aggregates** via APIs or scheduled jobs; avoid copying raw PII across regions.
- **Consolidated views:** Build a “Global Dashboard” that calls regional APIs with SSO; or schedule de-identified aggregates into a central warehouse.

## Encryption
- **In transit:**
  - App ↔ Proxy: HTTPS (TLS 1.2+).
  - App ↔ DB: use TLS (`sslmode=require` for Postgres).
- **At rest:**
  - **Managed DB (RDS/Cloud SQL):** enable storage encryption at creation.
  - **Self-hosted Postgres (Docker):** rely on host/volume encryption (BitLocker/LUKS).
- **Optional field-level encryption:** for sensitive fields, encrypt at application layer using a KMS-managed key. Not required if avoiding PII.

## Secrets & Config
- Store secrets in per-environment `.env` on servers, or in a secret manager (AWS SSM/Secrets Manager, Vault).
- Never commit live secrets; only commit `*.env.example`.

## Logging & PII
- Default to **structured JSON logs**; scrub emails/phones from logs.
- Log request IDs and minimal context; avoid dumping request bodies.
- Consider IPs and user IDs as personal data in some jurisdictions.

## Retention & Purge
- Define region-wise retention: e.g., anonymize audit logs after 18 months; delete inactive users after 12 months.
- Provide admin tooling to export or delete/anonymize user data (see DSR).

## Access & Monitoring
- DB not publicly exposed; restrict via SG/firewall and least-priv users.
- Uptime monitor `/healthz`; deploy gate `/readyz`.
- Centralize logs later (ELK/Loki/CloudWatch) without code changes.

## Data Subject Requests (DSR) & DPA
- **Export:** Admin can export a user’s data (profile, balances, history, audit) as JSON/CSV.
- **Delete/Anonymize:** Remove PII fields, keep transactional records linked to anonymized user key.
- **DPA:** A short Data Processing Agreement stating data categories, regions, security measures, subprocessors, incident response, retention, and DSR handling.

## Multi-Country Tenants
- If legal residency mandates, use **separate regional deployments**.
- For consolidated management:
  - Federated reporting (aggregates only),
  - Cross-region SSO to switch contexts,
  - Or a central warehouse with de-identified metrics.

## Defaults (safe starting point)
- Per-tenant, per-region deployment.
- TLS everywhere; DB TLS where supported.
- RDS with encryption at rest; daily snapshots.
- Logs in JSON; scrub PII.
- Retention policies configurable by super-admin per region.
- Secrets via `.env` on server or secret manager.
