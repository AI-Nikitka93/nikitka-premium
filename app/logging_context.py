from __future__ import annotations

import contextvars
import uuid

_correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "correlation_id",
    default="-",
)


def new_correlation_id() -> str:
    value = uuid.uuid4().hex[:12]
    _correlation_id_var.set(value)
    return value


def set_correlation_id(value: str) -> None:
    _correlation_id_var.set(value)


def get_correlation_id() -> str:
    return _correlation_id_var.get()
