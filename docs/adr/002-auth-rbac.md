# ADR 002: Auth & RBAC Baseline

- **Status:** Accepted
- **Date:** 2025-08-15

## Context
We need authenticated web access and role-based authorization.

## Decision
- Auth: **Flask-Login** with session cookies.
- RBAC: role → permission map in DB.
- Permission codes are strings like `department.create`, `policy.view`.

## Consequences
- Fine-grained, data-driven permissions.
- Easy to add roles/permissions without code changes.

## Implementation Notes
Tables:
- users(id, org_id, email, name, password_hash, is_active, ...)
- roles(id, org_id, name, system)
- permissions(id, code)
- role_permissions(role_id, permission_id)
- user_roles(user_id, role_id)

Add decorator `@require("perm.code")` that checks current user’s effective permissions.
