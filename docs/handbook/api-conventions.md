# API Conventions – Version 0.1 (Non‑Negotiable)

> Purpose: ensure schema‑first, predictable, and secure APIs. All handlers MUST map to operations defined in `openapi/leave_mgmt.yaml` before implementation.

---

## 1) Specification & Style
- **OpenAPI**: 3.0.3 (YAML)
- **Base path**: `/api/v1`
- **Resource naming**: plural kebab‑case (e.g., `/leave-requests`)
- **Operation IDs**: `leave_createRequest`, `leave_getById`, `users_list`, etc.
- **HTTP verbs**: `GET` (read), `POST` (create), `PUT` (replace), `PATCH` (partial update), `DELETE` (delete)
- **Content type**: JSON only for requests/responses unless explicitly allowed (file upload endpoints aside)

## 2) Versioning
- URI versioning: `/api/v1/...`
- Backward‑compatible changes only within a major version (additive fields OK, breaking changes require `/v2`)
- Deprecations: mark in OpenAPI with `deprecated: true` and provide alternative

## 3) Requests
- **Headers (required)**:
  - `Authorization: Bearer <token>` (unless explicitly public)
  - `Content-Type: application/json` for JSON payloads
  - `Idempotency-Key` for unsafe methods (POST/PUT/PATCH/DELETE) when creating or mutating server state
- **Query parameters**: kebab‑case; booleans are lowercase `true|false`
- **Timestamps**: ISO‑8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- **IDs**: UUIDv4 preferred unless natural keys are documented

## 4) Responses
- **Success envelope** (default): return the resource directly (no extra wrapper) with appropriate HTTP code
- **Error envelope** (always):
```json
{ "error": { "code": "string", "message": "human-readable", "details": [] } }
```
- **Common status codes**:
  - `200 OK` – success with body
  - `201 Created` – on creation; include `Location` header
  - `204 No Content` – success without body
  - `400 Bad Request` – validation errors (see details array)
  - `401 Unauthorized` – missing/invalid auth
  - `403 Forbidden` – authenticated but not allowed
  - `404 Not Found`
  - `409 Conflict` – state conflicts (e.g., overlap rules)
  - `422 Unprocessable Entity` – semantic validation failed
  - `429 Too Many Requests` – rate limit exceeded
  - `5xx` – server errors (generic message only)

## 5) Pagination, Filtering, Sorting
- **Pagination**:
  - Query params: `page` (default 1), `page_size` (default 20, max 100)
  - Response meta (top‑level keys):
    ```json
    { "items": [...], "page": 1, "page_size": 20, "total_items": 0, "total_pages": 0 }
    ```
- **Filtering**: exact match via query params (e.g., `?status=pending&user-id=...`)
- **Sorting**: `sort` param with comma‑separated fields; prefix `-` for desc (e.g., `?sort=-created-at,status`)

## 6) Idempotency
- Required for **unsafe** methods that create/mutate state.
- Clients provide a unique `Idempotency-Key`; servers must store short‑lived keys and return the same result on retry.
- Idempotency keys expire (e.g., 24h). Must be included in OpenAPI description for such operations.

## 7) Authentication & Authorization (API)
- **AuthN**: Bearer JWT in `Authorization` header (see `authentication-authz.md` for token TTL, refresh)
- **AuthZ**: Enforce RBAC at handler/service layer; deny by default
- **Scopes/claims**: document required claims per operation in OpenAPI `security` section

## 8) Validation & Errors
- Validate **request schemas** against OpenAPI before handler logic.
- Validation errors use `400` or `422` with `error.details` as a list of `{field, issue}`.
- Never leak stack traces or internal identifiers in the message.

## 9) Rate Limiting & Throttling
- Global defaults documented here (TBD).
- Return standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` (when applicable).

## 10) Concurrency & Conflict Control
- Use `409 Conflict` for state collisions (e.g., overlapping leave windows).
- For conditional updates, support `If-Match`/ETag where appropriate (TBD via ADR).

## 11) Telemetry
- Include a `request_id` (trace/correlation ID) in response headers.
- Log: method, path, status, latency, user_id (if authenticated), request_id.

## 12) OpenAPI Source of Truth
- All endpoints **must** be defined in `openapi/leave_mgmt.yaml` before implementation.
- Keep **examples** current for both requests and responses.
- Breaking changes require a new version segment (`/v2`).

## 13) File Uploads (if applicable)
- Use `multipart/form-data` for uploads; return a file `id` and metadata.
- Virus/malware scan required before the file becomes visible to users (see security-baseline.md).

## 14) Webhooks/Events (if applicable)
- Sign with secret (HMAC SHA‑256).
- Include `event_id`, `event_type`, `occurred_at` (UTC), and `data` payload.
- Retries with exponential backoff; deliver at‑least‑once; consumers must be idempotent.

## 15) Prohibited
- Query strings carrying sensitive data (tokens, passwords, PII).
- Returning raw database errors or stack traces.
- Ad‑hoc pagination or error shapes not matching this spec.
