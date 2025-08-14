# UI/UX Style Guide – Version 0.1 (Non‑Negotiable)

> Purpose: enforce a consistent, professional UI that is modern but server‑rendered (Bootstrap 5 + Jinja2 + vanilla JS/HTMX).  
> Scope: applies to all screens, components, and CSS in this application. Any deviation requires an ADR.

---

## 1) Design Tokens (CSS variables)
Define tokens once in `/static/css/style.css` under `:root`. All styling must reference these tokens (no hardcoded colors/sizes in templates).

```css
:root {
  /* Brand */
  --lm-color-primary: #0d6efd;   /* buttons, links, accents */
  --lm-color-secondary: #6c757d; /* secondary buttons, muted labels */
  --lm-color-success: #198754;
  --lm-color-warning: #ffc107;
  --lm-color-danger:  #dc3545;

  /* Surfaces & text */
  --lm-bg-page: #ffffff;
  --lm-bg-card: #f8f9fa;
  --lm-text: #212529;
  --lm-text-muted: #6c757d;

  /* Layout & spacing */
  --lm-radius: 0.5rem;          /* 8px */
  --lm-radius-lg: 0.75rem;      /* 12px */
  --lm-spacing-1: 0.5rem;
  --lm-spacing-2: 0.75rem;
  --lm-spacing-3: 1rem;
  --lm-spacing-4: 1.5rem;
  --lm-spacing-5: 2rem;

  /* Shadows */
  --lm-shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --lm-shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --lm-shadow-md: 0 4px 12px rgba(0,0,0,0.12);

  /* Borders */
  --lm-border: 1px solid #e5e7eb;
}
```

**Global page rules** (in `style.css`):
```css
body { background: var(--lm-bg-page); color: var(--lm-text); font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.card { border: var(--lm-border); border-radius: var(--lm-radius-lg); box-shadow: var(--lm-shadow-sm); }
.card:hover { box-shadow: var(--lm-shadow-md); }
.btn-primary { background-color: var(--lm-color-primary); border-color: var(--lm-color-primary); }
.btn-primary:hover { filter: brightness(0.95); }
.badge-success { background-color: var(--lm-color-success); }
```

**Do/Don’t**
- ✅ Do use tokens and Bootstrap utility classes.
- ❌ Don’t hardcode hex colors or pixel sizes in templates.

---

## 2) Layout & Grid
- Use **Bootstrap grid** (container, row, col‑*) for responsive pages.
- **Dashboard cards**: 12‑column grid; default `col-12 col-md-6 col-lg-4` for equal cards.
- **Form pages**:
  - **Single column**: narrow container (`max-width: 720px`).
  - **Two column**: `row g-3` with `col-md-6` groups; collapse to single column below `md`.
- **Spacing**: use Bootstrap `g-*`, `p-*`, `m-*`; prefer multiples of `--lm-spacing-*` in custom CSS only if needed.
- **Sections**: wrap with `.card` + `.card-body` or use `.accordion` for collapsible groups.

---

## 3) Navigation
- **Header**: sticky top navbar with brand left, user/profile right.
- **Sidebar** (optional): use Bootstrap offcanvas for small screens; highlight active route.
- **Breadcrumbs**: show for pages deeper than 1 level.
- **Tabs**: use `.nav nav-tabs` for in‑page sections (e.g., Details / History).

---

## 4) Components (approved patterns)
**Buttons**
- Primary action: `.btn.btn-primary`
- Secondary/neutral: `.btn.btn-secondary`
- Destructive: `.btn.btn-danger`
- Sizes: `.btn-sm` for dense tables; default otherwise.

**Cards (default panel)**
- `.card > .card-header` (optional) + `.card-body`
- Avoid floating cards without grid alignment.

**Accordions**
- Use Bootstrap 5 `.accordion` with a maximum nesting of 1 level.
- Use for long forms: group by logical sections (e.g., “Leave Details”, “Attachments”).

**Tables**
- `.table.table-striped.table-hover`
- Sticky header when table exceeds viewport height.
- Empty state: show icon + message + primary CTA (see Patterns).

**Forms**
- Labels always above inputs; required fields marked with `*`.
- Helper text below inputs using `.form-text`.
- Inline validations use `.is-invalid` and `.invalid-feedback`.

**Toasts & Alerts**
- Success toast for non‑blocking confirmations; auto dismiss 4s.
- Use `.alert-*` banners for blocking page‑level messages.

**Badges**
- Status color map (consistent across app):
  - Approved = `bg-success`
  - Rejected = `bg-danger`
  - Pending = `bg-warning text-dark`
  - Draft = `bg-secondary`

---

## 5) UX Patterns
**Loading**
- Prefer skeletons for card lists/tables (simple gray blocks).
- Otherwise, center a spinner inside the component boundary.

**Empty state**
- Card with muted icon, one sentence, and primary action button.

**Error state**
- Short message; optional details toggle; “Retry” button.
- Never display raw exceptions; use friendly messages.

**Confirmation**
- Use modals for destructive actions with explicit verbs (e.g., “Delete leave request”).

**Inline edit**
- Allowed only for simple fields within tables; otherwise open a modal or navigate to an edit form.

---

## 6) Accessibility (must‑haves)
- WCAG 2.1 AA contrast ratios.
- Focus outlines must remain visible (do not remove the default focus style).
- Keyboard navigation: all interactive elements reachable via TAB; modals trap focus.
- Form fields associated with `<label for="">` and `aria‑describedby` for help/errors.
- Provide `aria-live="polite"` for toasts and inline validation messages.

---

## 7) Responsive & Internationalization
- Breakpoints: Bootstrap defaults (`sm/md/lg/xl/xxl`); test `md` and `lg` layouts for every screen.
- Text should not overflow; allow wrapping; avoid fixed heights for multi‑line content.
- Display dates in user locale on render; store UTC server‑side (see tech‑stack).

---

## 8) HTMX (optional progressive enhancement)
- Use HTMX for **partial updates** only (e.g., updating a table region after approve/reject).
- Always provide a **non‑HTMX fallback** (full page reload) to preserve accessibility and testability.
- Never rely on HTMX for critical flows that require robust client‑side state.

---

## 9) File Locations & Naming
- **Global CSS**: `/static/css/style.css` (imports tokens + component overrides).
- **Page‑specific tweaks**: optional `/static/css/<feature>.css` but must still use tokens.
- **Images/icons**: `/static/img/` (SVG preferred).
- **Class prefixes**: custom utilities start with `lm-` (e.g., `.lm-card-metric`).

---

## 10) Ready‑to‑use Snippets (Cursor should reuse as is)
**Metric card (dashboard)**
```html
<div class="card p-3">
  <div class="d-flex justify-content-between align-items-center">
    <div>
      <div class="text-muted text-uppercase small">Pending Approvals</div>
      <div class="fs-3 fw-semibold">--</div>
    </div>
    <i class="bi bi-clock-history fs-3 text-muted"></i>
  </div>
</div>
```

**Accordion section (form)**
```html
<div class="accordion" id="leaveFormAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingDetails">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#sectionDetails">
        Leave Details
      </button>
    </h2>
    <div id="sectionDetails" class="accordion-collapse collapse show" data-bs-parent="#leaveFormAccordion">
      <div class="accordion-body">
        <!-- form fields here -->
      </div>
    </div>
  </div>
</div>
```

**Empty state (table)**
```html
<div class="card p-4 text-center text-muted">
  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
  <div>No records found</div>
  <a href="#" class="btn btn-primary btn-sm mt-3">Create</a>
</div>
```

---

## 11) Prohibited
- Inline styles in templates (`style="..."`) unless absolutely necessary.
- Random third‑party UI libraries; everything should be Bootstrap‑compatible.
- Creating new colors/shadows without updating tokens.

---

## 12) Review Checklist (per screen)
- Uses tokens only (no hardcoded colors/sizes).
- Responsive at `md` and `lg` breakpoints.
- Keyboard‑navigable; focus states visible.
- Empty, loading, and error states covered.
- Consistent component usage (buttons, cards, tables, accordions).

---

## 13) Navigation – Role-Driven Menus & Context Switching

### Purpose
Ensure the sidebar and top navigation display only the items relevant to the user's active role, while still enforcing permissions server-side.

### Source of Menu Data
- Menu structure is defined in a **central Python helper** or service (e.g., `get_user_menu(user)`), not scattered across templates.
- Each menu item includes:
  - `label` – text to display
  - `icon` – Bootstrap Icons class
  - `url` – route or endpoint
  - `roles` – list of roles allowed to see it

**Example (Python data structure):**
```python
MENU_ITEMS = [
    {"label": "System Overview", "icon": "bi-speedometer", "url": "/system-overview", "roles": ["super_admin"]},
    {"label": "Leave Approvals", "icon": "bi-check2-square", "url": "/leave/approvals", "roles": ["super_admin", "admin", "manager"]},
    {"label": "Apply Leave", "icon": "bi-calendar-plus", "url": "/leave/apply", "roles": ["employee", "admin"]},
]
```

### Role Filtering
- In `sidebar.html`, filter `MENU_ITEMS` by `session['active_role']` (single role context) or `current_user.roles` (multi-role).
- **Server-side filtering only** – no client-side menu item hiding with JS.

**Example (Jinja):**
```jinja
{% for item in menu_items if active_role in item.roles %}
  <li class="nav-item">
    <a href="{{ item.url }}" class="nav-link">
      <i class="bi {{ item.icon }}"></i> {{ item.label }}
    </a>
  </li>
{% endfor %}
```

### Multiple Roles & Context Switching
- A user can have multiple roles in the `user_roles` table.
- At login, retrieve all roles → store in `current_user.roles`.
- Provide a **role switcher dropdown** in the topbar:
  - Selecting a role updates `session['active_role']`.
  - Menus and feature visibility are based on `active_role` only.
- Default to the user's highest privilege or last-used role.

**Example (Topbar snippet):**
```jinja
<div class="dropdown">
  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
    {{ active_role|capitalize }}
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    {% for role in current_user.roles %}
      <li><a class="dropdown-item" href="{{ url_for('switch_role', role=role) }}">{{ role|capitalize }}</a></li>
    {% endfor %}
  </ul>
</div>
```

### UI vs API Enforcement
- **UI-level filtering** improves UX and prevents clutter.
- **API/backend-level enforcement** is mandatory – all endpoints check authorization regardless of UI.
- Never rely solely on menu visibility for security.

### Testing
- Verify each role sees the correct menu items in the UI.
- Attempt API calls for unauthorized endpoints to confirm backend rejection.

---

## 14) Menu Hierarchy & Role Mapping (Database-Driven)

### Purpose
Ensure all menus and sub-menus are centrally defined and role visibility is controlled in one place, avoiding duplication or inconsistencies.

### Storage
Menus are stored in the database with a parent-child hierarchy:

**menus**  
| id (PK) | parent_id (FK) | label | icon | url | order |
|---------|----------------|-------|------|-----|-------|
| 1       | NULL           | Dashboard | bi-speedometer2 | /dashboard | 1 |
| 2       | NULL           | User & Access Management | bi-people | NULL | 2 |
| 3       | 2              | Manage Users | NULL | /users | 1 |

**menu_roles**  
| menu_id (FK) | role_id (FK) |
|--------------|--------------|
| 1            | 1            |
| 1            | 2            |
| 3            | 1            |

### Rendering Logic
1. Query menus and join `menu_roles` with the user's `active_role`.
2. Build a tree structure ordered by `order`.
3. Pass the filtered menu tree to `sidebar.html`.
4. `sidebar.html` loops through the menu items and renders:
   - Top-level menus as section headers or clickable links.
   - Children as sub-menu items.

### Rules
- Never hardcode menu items in feature templates.
- All menu updates go through DB update or admin UI (if implemented).
- Role visibility is additive – a menu is shown if the active role has permission.

### UI vs API
- Menu filtering in the UI is for **presentation** only.
- All backend routes are still protected by RBAC and must verify access server-side.

### Testing
- Verify each role sees only assigned menus.
- Attempt direct URL access to hidden menus' routes to confirm backend denies unauthorized roles.
