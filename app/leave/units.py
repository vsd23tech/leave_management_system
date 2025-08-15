from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RoundingConfig:
    full_day_minutes: int = 480
    min_apply_unit_minutes: int = 240
    min_carry_forward_unit_minutes: int = 60
    accrual_rounding: str = "nearest"
    deduction_rounding: str = "ceil"
    carry_forward_rounding: str = "floor"
    carry_forward_cap_minutes: int | None = None


def _round(value: int, step: int, mode: str) -> int:
    if step <= 0:
        return value
    if mode == "ceil":
        return ((value + step - 1) // step) * step
    if mode == "floor":
        return (value // step) * step
    # nearest
    q, r = divmod(value, step)
    return q * step + (step if r >= step / 2 else 0)


def to_days_str(minutes: int, full_day_minutes: int) -> str:
    # Display helper (e.g., 1.5d). Tweak format as you like later.
    return f"{minutes / full_day_minutes:.1f}d"


def to_hhmm(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    return f"{h:d}:{m:02d}"


def apply_deduction(request_minutes: int, cfg: RoundingConfig) -> int:
    return _round(request_minutes, cfg.min_apply_unit_minutes, cfg.deduction_rounding)


def apply_carry_forward(balance_minutes: int, cfg: RoundingConfig) -> int:
    v = _round(balance_minutes, cfg.min_carry_forward_unit_minutes, cfg.carry_forward_rounding)
    if cfg.carry_forward_cap_minutes is not None:
        v = min(v, cfg.carry_forward_cap_minutes)
    return v


def apply_accrual(accrued_minutes: int, cfg: RoundingConfig) -> int:
    return _round(accrued_minutes, 1, cfg.accrual_rounding)  # step=1 minute granularity


def days_to_minutes(days: float, cfg: RoundingConfig) -> int:
    return int(round(days * cfg.full_day_minutes))


def minutes_to_days(minutes: int, cfg: RoundingConfig) -> float:
    return minutes / cfg.full_day_minutes
