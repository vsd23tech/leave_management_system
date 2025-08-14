# Authentication & Authorization – Version 0.1 (Non‑Negotiable)

> Purpose: Define how users and systems authenticate and what they are authorized to do. Applies to all UI, API, background jobs, and admin tools.

---

## 1) Principles
- **Centralized auth logic**; no feature‑level “roll your own” authentication.
- **Least privilege**: users and services only get the permissions required for their role.
- **Deny by default**: any route or action without explicit allow rules is inaccessible.
- **Separation of concerns**: Authentication verifies identity; Authorization decides permissions.

---

## 2) Authentication (UI – Server‑Rendered)
- **Mechanism**: Flask‑Login session cookies.
- **Flow**:
  1. User enters credentials (local or IdP SSO).
  2. Server issues session cookie after verification.
- **Cookie flags**:
  - `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict` where embedded login is not needed).
- **CSRF**: All state‑changing form submissions require CSRF token (Flask‑WTF or equivalent).
- **Session expiry**:
  - Idle timeout: 30 min.
  - Absolute max lifetime: 8 hours.
- **MFA**: Optional per tenant (ADR to enable).

---

## 3) Authentication (API)
- **Mechanism**: Bearer JWT in `Authorization` header (`Bearer <token>`).
- **JWT claims**:
  - `sub` – user ID (UUID)
  - `exp` – expiration time
  - `iat` – issued at
  - `role` – primary role
  - `perms` – optional granular permissions
  - `tenant` – tenant/org ID (if multi‑tenant)
- **Signing algorithm**: RS256 (preferred) or HS256 (strong secret).
- **Token TTL**:
  - Access token: 60 min.
  - Refresh token: 7 days.
- **Refresh flow**: `/api/v1/auth/refresh` endpoint; requires valid refresh token.

---

## 4) Passwords & Credentials
- **Storage**: PBKDF2‑SHA256 (Werkzeug) or bcrypt with salt.
- **Policy** (if local auth enabled):
  - Min length 12 chars.
  - Deny common passwords (use haveibeenpwned API or offline list).
  - No forced periodic reset unless compromise suspected.

---

## 5) Roles & Permissions Model
### Roles
- **Super Admin**: full system access, can manage roles, policies, and tenants.
- **Business Executive**: view reports, manage policies.
- **Department Head**: approve/reject requests in department; view dept data.
- **Project Manager**: approve/reject requests for projects; view project data.
- **Team Lead**: approve/reject requests for team; view team calendar.
- **Employee**: apply/cancel leave; view own balances/history.

### Permissions Mapping
- Map each role to allowed actions in a central RBAC config.
- Config stored in DB with cache layer; loaded at app start.

### Granularity
- **Entity‑level**: which resources the role can access (LeaveRequest, User, Policy).
- **Field‑level**: hide sensitive fields from unauthorized roles.
- **Action‑level**: approve, reject, export, configure.

---

## 6) Delegation & Proxy Access
- **Delegation**: A user can grant another user access to act on their behalf for a specific time range and scope.
- Must be recorded in audit log with:
  - Delegator ID
  - Delegate ID
  - Scope
  - Start & end times
- Proxy access always time‑boxed and revocable.

---

## 7) Authorization Enforcement
- Enforce **RBAC checks** in service layer before DB queries.
- UI templates hide controls user cannot perform, but **server still enforces**.
- Always verify resource ownership before performing action (IDOR prevention).
- Combine role + ownership + state checks (e.g., can’t approve leave if already approved).

---

## 8) Service Accounts
- Used for integrations and automation jobs only.
- Provisioned via admin; no interactive login.
- Must have explicit role with minimal permissions.

---

## 9) Session & Token Revocation
- On password change or explicit logout, invalidate all active sessions/tokens.
- Maintain token blacklist until expiry.
- Allow admin to revoke tokens/sessions for a user.

---

## 10) Audit Requirements
- Log auth events (login success/failure, logout, token refresh).
- Log role changes, delegation grants/revocations, and failed access checks.

---

## 11) API Security Extras
- Rate limit login/token endpoints (e.g., 5/min per IP).
- Lock account or require CAPTCHA after repeated failures (configurable).
- Use `WWW-Authenticate` header with 401 responses.
- Require `Idempotency-Key` for sensitive state‑changing APIs (see api-conventions.md).

---

## 12) Testing & Verification
- Automated tests for:
  - Session expiry
  - CSRF protection
  - RBAC matrix coverage
  - IDOR attempts
- Manual pentest before production launch.

---

## 13) Exceptions & ADRs
- Any deviation (e.g., different token TTL, public endpoint) must have an ADR noting reason, risks, and compensating controls.

---

## 14) Database-Based Role Model

### Purpose
Store and manage user-role mappings in the database so roles can be updated dynamically without code changes.

### Schema

**users**
| id (PK) | username | password_hash | email | ... |
|---------|----------|---------------|-------|-----|
| 1       | alice    | ...           | ...   | ... |

**roles**
| id (PK) | name         | description                  |
|---------|--------------|------------------------------|
| 1       | super_admin  | Full system access           |
| 2       | admin        | Administrative functions     |
| 3       | employee     | Standard employee access     |

**user_roles** (many-to-many link table)
| user_id (FK) | role_id (FK) |
|--------------|--------------|
| 1            | 1            |
| 1            | 3            |

### Behavior
- At login, fetch all roles for the user:
  ```sql
  SELECT r.name 
  FROM roles r
  JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = :current_user_id;
  ```
- Store the full role list in `current_user.roles`.
- Active role for the session stored in `session['active_role']`.
- Menu rendering and feature access checks use `active_role`.
- API/backend checks can evaluate either:
  - `active_role` for context-specific access
  - `current_user.roles` for full privilege checks

### Context Switching
- Users with multiple roles can change active role via a UI switcher.
- Switching role updates `session['active_role']` and refreshes menus/features.
- Audit all role switch events with:
  - user_id
  - old_role
  - new_role
  - timestamp

### Admin-as-Employee Scenario
- Admin role grants administrative access.
- Employee role grants leave request access.
- Same user account can hold both roles; they switch context depending on task.
- Backend authorization logic ensures only allowed actions per active role are executed.

### Testing
- Unit test role fetching and menu filtering.
- Integration test that switching roles updates access in both UI and API.
- Security test that API denies access if role is missing even when user has a session.

---

## 14) Database-Based Role Model

### Purpose
Store and manage user-role mappings in the database so roles can be updated dynamically without code changes.

### Schema

**users**
| id (PK) | username | password_hash | email | ... |
|---------|----------|---------------|-------|-----|
| 1       | alice    | ...           | ...   | ... |

**roles**
| id (PK) | name         | description                  |
|---------|--------------|------------------------------|
| 1       | super_admin  | Full system access           |
| 2       | admin        | Administrative functions     |
| 3       | employee     | Standard employee access     |

**user_roles** (many-to-many link table)
| user_id (FK) | role_id (FK) |
|--------------|--------------|
| 1            | 1            |
| 1            | 3            |

### Behavior
- At login, fetch all roles for the user:
  ```sql
  SELECT r.name 
  FROM roles r
  JOIN user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = :current_user_id;
  ```
- Store the full role list in `current_user.roles`.
- Active role for the session stored in `session['active_role']`.
- Menu rendering and feature access checks use `active_role`.
- API/backend checks can evaluate either:
  - `active_role` for context-specific access
  - `current_user.roles` for full privilege checks

### Context Switching
- Users with multiple roles can change active role via a UI switcher.
- Switching role updates `session['active_role']` and refreshes menus/features.
- Audit all role switch events with:
  - user_id
  - old_role
  - new_role
  - timestamp

### Admin-as-Employee Scenario
- Admin role grants administrative access.
- Employee role grants leave request access.
- Same user account can hold both roles; they switch context depending on task.
- Backend authorization logic ensures only allowed actions per active role are executed.

### Testing
- Unit test role fetching and menu filtering.
- Integration test that switching roles updates access in both UI and API.
- Security test that API denies access if role is missing even when user has a session.

---

## 15) Role-to-Menu Mapping

### Purpose
Link the database-based role model to the navigation menu system for consistent role-driven access.

### Implementation
- Roles are stored in the `roles` table; users are linked via `user_roles`.
- Menus are stored in the `menus` table; linked to roles via `menu_roles`.
- At login, the system determines `current_user.roles` and sets `session['active_role']`.
- The menu query uses `active_role` to filter `menus` via `menu_roles`.
- The filtered menu is rendered in the sidebar.

### Enforcement
- UI hides menus the active role should not see.
- API/backend still enforces RBAC on every route regardless of UI visibility.

### Maintenance
- Menu-role mappings can be updated in the DB without code changes.
- Consider building an admin UI to manage menus and role associations.

