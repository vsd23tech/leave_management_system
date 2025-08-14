# Security Baseline – Version 0.1 (Non‑Negotiable)

> Purpose: Define mandatory security controls for the Leave Management System. These apply to **all** services, jobs, and admin tools unless an ADR explicitly allows an exception.

---

## 1) Standard & Threat Model
- **Target standard**: OWASP ASVS **Level 2** (web apps handling PII).
- **STRIDE coverage**: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
- **Data classification**: PII (employee identifiers, contact data), Sensitive HR data (leave reasons/documents). Highest protection for uploads and identity data.

---

## 2) Transport & Network Security
- **TLS 1.2+ mandatory** for all environments; HTTP → HTTPS redirect.
- **HSTS** enabled in production with preload once validated.
- **mTLS** optional for internal service‑to‑service calls (ADR to enable).
- **Firewalling / SGs**: limit inbound to 80/443 (or ingress); DB/Redis not public.
- **DNS / Certificates**: managed via approved provider; automatic renewal.

---

## 3) HTTP Security Headers (must set at edge and app)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (prod)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` (tighten as needed)
- **CSP (Content Security Policy)** (baseline):
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  ```
  - If using CDN assets, list explicit hostnames; no wildcards. Avoid `unsafe-inline` for scripts; allow only where necessary with nonces.

---

## 4) Authentication (summary; details in authentication-authz.md)
- **Primary**: Session cookies for server‑rendered UI; **JWT (Bearer)** for `/api/v1/*`.
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict` for non‑embedded flows).
- **CSRF**: protect all state‑changing requests (CSRF tokens for forms; `SameSite` cookies; double submit for APIs with sessions).
- **MFA**: optional per tenant (ADR).
- **Password policy**: rely on IdP or enforce NIST 800‑63B style (min length, deny common passwords).

---

## 5) Authorization
- **RBAC** enforced on server for every route and action (deny by default).
- **Row/field‑level** checks for sensitive entities (LeaveRequest, Attachments, User).
- **Delegation/Proxy** actions require explicit audit and limited scopes (time‑boxed).
- **IDOR** prevention: never derive access solely from client‑provided IDs; always check ownership/role.

---

## 6) Input Validation & Output Encoding
- Validate **all inputs** against schemas (OpenAPI / WTForms) before logic.
- Use strict types (dates in ISO‑8601 UTC; UUIDs for IDs).
- Output encode HTML (Jinja2 autoescape on). Never render untrusted HTML.
- File uploads: validate content type/size; store outside web root; randomize filenames.

---

## 7) Data Protection
- **At rest**: DB volume encryption (cloud KMS or disk encryption). Backups encrypted.
- **In transit**: TLS everywhere.
- **PII minimization**: store only necessary data; avoid sensitive content in free‑text where possible.
- **Secrets**: managed via environment variables or a secrets manager; rotation policy documented; **never commit secrets**.
- **Key management**: keys/certs rotated annually or on incident.

---

## 8) File Uploads (e.g., medical certificates)
- Accepted types: configurable whitelist (e.g., PDF/JPG/PNG) with max size (TBD).
- **AV scan** before persistence (ClamAV or service) and before serving.
- Strip metadata where feasible (images).
- Downloads served with `Content-Disposition: attachment` and authorization check.
- Store in private bucket/object store; pre‑signed URLs with short TTL.

---

## 9) Logging, Auditing & Monitoring
- **Structured JSON logs**: timestamp, request_id, user_id (if any), IP, method, path, status, latency.
- **Audit events** (immutable): auth events, approvals/rejections, policy changes, role changes, data exports.
- **No secrets/PII in logs**; mask emails, phone, IDs where practical.
- **Retention**: app logs (14–30 days), audit logs (≥ 1 year) configurable by policy.
- **Alerts**: auth failures spike, 5xx rate spikes, missing CSP/HSTS headers, audit stream failures.

---

## 10) Dependency & Supply Chain Security
- Python dependencies pinned; **`pip-audit`** (or Safety) in CI.
- SBOM generated and stored as artifact.
- **Docker image scan** on every build (trivy/grype).
- Only use **official base images** with pinned digests; rebuild on CVE updates.

---

## 11) Container & Runtime Hardening
- Base image: `python:3.11-slim` (or distro‑less via ADR).
- Run as **non‑root**; read‑only filesystem except for writable temp dirs.
- Add a minimal user; drop capabilities; no SSH/cron in images.
- **Healthchecks**: `/healthz` (liveness), `/readyz` (readiness).
- Resource limits set (CPU/memory) and network egress restricted where possible.

---

## 12) Database Security
- Network: private only; no public exposure.
- Auth: strong passwords or IAM auth; rotate regularly.
- Least privilege users (read vs write vs admin).
- TLS to DB when available.
- **Migrations** reviewed and tested; destructive changes gated.

---

## 13) Rate Limiting & DoS
- IP/user‑based throttles on auth and write endpoints.
- Exponential backoff on retries; `Retry-After` header for 429.
- Application‑level circuit breakers for downstream dependencies (ADR).

---

## 14) Error Handling
- User‑facing errors use the **standard envelope** (see api-conventions.md).
- Do not leak stack traces or query fragments; store details only in server logs.
- 404/403 behavior does not reveal resource existence beyond authorization result.

---

## 15) Secrets & Config Management
- `.env.example` only; never commit `.env`.
- Environment variables typed/validated at boot (fail fast).
- Rotate credentials on role change/termination events.

---

## 16) Compliance & Data Lifecycle
- Right to deletion/export (TBD per region).
- Backups: tested restores; retention documented.
- Data residency/regionalization (ADR per tenant if required).

---

## 17) CI/CD Security Gates (must pass)
- Static analysis: ruff, bandit, semgrep.
- Dependency scan: pip‑audit (or Safety) with policy on critical CVEs.
- Docker scan: no critical vulnerabilities allowed.
- Secrets scan: pre‑commit & CI (gitleaks or equivalent).
- Test gates: unit/integration pass; minimum coverage (TBD).

---

## 18) Observability & Incident Response
- Correlate logs/metrics/traces with `request_id`/`traceparent`.
- Runbooks: auth outage, DB down, storage outage, rate limit spikes.
- Incident severity matrix with on‑call escalation (TBD).

---

## 19) CORS & Cross‑Site Controls
- Default **deny**; allow only trusted origins as config.
- Allow credentials **only if required** and paired with strict origin checks.
- Preflight caching kept low during development; tightened in prod.

---

## 20) SSRF, RCE, and Unsafe Patterns (deny list)
- No server‑side HTTP fetch to arbitrary user URLs (allowlist if needed).
- No shelling out to system commands with user input.
- No dynamic template execution from user data.

---

## 21) Validation Checklist (per PR)
- Authentication/Authorization enforced for new routes.
- Input validated against schema; output encoded.
- Security headers present; CSP updated if assets changed.
- Secrets not introduced; config typed.
- Logs include request_id; no PII leakage.
- Tests updated/added for security‑relevant paths.

---

## 22) Exceptions & ADRs
- Any deviation from this baseline requires an ADR referencing the specific section, risk acceptance, and compensating controls.
