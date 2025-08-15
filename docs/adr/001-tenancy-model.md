# ADR 001: Tenancy Model

- **Status:** Accepted
- **Date:** 2025-08-15

## Context
We need a path to support multi-tenant customers in the future without refactoring.

## Decision
Adopt **single-tenant** deployment now with a **multi-tenant–ready schema**:
- Add `org_id INTEGER NOT NULL DEFAULT 1` to tenant-scoped tables.
- Index `org_id`; add unique constraints on `(org_id, <business_key>)`.
- Use env `MULTI_TENANCY=0/1` (default 0). Request context carries `org_id`.

## Consequences
- Negligible complexity now; large payoff later (policy and data isolation).
- Migrations include `org_id` from day one.

## Implementation Notes
- Include `org_id` in: users, departments, locations, leave_types, policies, leave_requests, audit_log.
- Provide a helper to access current `org_id` from request/session.
