from datetime import datetime
from typing import Literal

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

Rounding = Literal["ceil", "floor", "nearest"]


class WorktimeConfig(Base):
    __tablename__ = "worktime_config"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True)
    org_id: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="1", index=True)

    # Scope lets us keep one flexible table: global | country | region | location
    # scope_key examples: "*" | "IN" | "IN-MH" | "site-123"
    scope: Mapped[str] = mapped_column(sa.String(20), nullable=False)
    scope_key: Mapped[str] = mapped_column(sa.String(64), nullable=False)

    time_zone: Mapped[str | None] = mapped_column(sa.String(64), nullable=True)
    week_start: Mapped[int] = mapped_column(
        sa.SmallInteger, nullable=False, server_default="1"
    )  # 1=Mon..7=Sun

    full_day_minutes: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="480")
    min_apply_unit_minutes: Mapped[int] = mapped_column(
        sa.Integer, nullable=False, server_default="240"
    )
    min_carry_forward_unit_minutes: Mapped[int] = mapped_column(
        sa.Integer, nullable=False, server_default="60"
    )

    accrual_rounding: Mapped[str] = mapped_column(
        sa.String(8), nullable=False, server_default="nearest"
    )
    deduction_rounding: Mapped[str] = mapped_column(
        sa.String(8), nullable=False, server_default="ceil"
    )
    carry_forward_rounding: Mapped[str] = mapped_column(
        sa.String(8), nullable=False, server_default="floor"
    )

    carry_forward_cap_minutes: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    enforce_sandwich_rule: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, server_default=sa.text("false")
    )

    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("CURRENT_TIMESTAMP"),
        server_onupdate=sa.text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        sa.UniqueConstraint("org_id", "scope", "scope_key", name="uq_worktime_config_scope"),
        sa.CheckConstraint("week_start BETWEEN 1 AND 7", name="ck_worktime_config_week_start"),
        sa.CheckConstraint(
            "accrual_rounding in ('ceil','floor','nearest') "
            "and deduction_rounding in ('ceil','floor','nearest') "
            "and carry_forward_rounding in ('ceil','floor','nearest')",
            name="ck_worktime_config_rounding_values",
        ),
    )
