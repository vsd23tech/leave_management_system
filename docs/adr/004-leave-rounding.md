# ADR 004: Leave Units, Rounding & Carry-Forward

- **Status:** Accepted
- **Date:** 2025-08-15

## Context
We must support different regions’ leave practices (half-day India, hourly US) without rounding errors and with clear, fair rounding rules.

## Decision
- Store all leave **internally as integers in minutes**.
- Per region, Admin can configure:
  - `full_day_minutes` (e.g., 480)
  - `min_apply_unit_minutes` (e.g., 240 in India, 60 in US)
  - `min_carry_forward_unit_minutes` (e.g., 60)
  - **Rounding policy** per operation:
    - `accrual_rounding`: `ceil` | `floor` | `nearest`
    - `deduction_rounding` (apply): `ceil` | `floor` | `nearest`
    - `carry_forward_rounding`: `ceil` | `floor` | `nearest`
  - `carry_forward_cap_minutes` (optional cap)
  - `week_start` and `time_zone` for calendars/rules
  - `enforce_sandwich_rule` (bool)

**Display**: Show balances in **days** (`minutes / full_day_minutes`, formatted to .5 or 1 decimal) or **HH:MM** where hourly norms apply. Do not mutate stored minutes for display.

**Recommended defaults**:
- Accruals: `nearest`
- Deductions (apply): `ceil` to `min_apply_unit_minutes`
- Carry-forward: `floor` to `min_carry_forward_unit_minutes`, then cap

## Consequences
- No float rounding issues; region rules expressed as data.
- Fairness: employees see precise balances; deductions respect company-defined steps.

## Implementation Notes
- New table `worktime_config` (see schema).
- Helper functions convert and round minutes consistently.
- Future: UI to manage configs per scope (global, country, region, location).
