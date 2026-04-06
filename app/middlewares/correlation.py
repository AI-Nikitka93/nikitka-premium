from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware

from app.logging_context import new_correlation_id, set_correlation_id


class CorrelationIdMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Any, Dict[str, Any]], Awaitable[Any]],
        event: Any,
        data: Dict[str, Any],
    ) -> Any:
        correlation_id = new_correlation_id()
        data["correlation_id"] = correlation_id
        try:
            return await handler(event, data)
        finally:
            set_correlation_id("-")
