from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message


class ThrottlingMiddleware(BaseMiddleware):
    def __init__(self, limit: int, window_seconds: int) -> None:
        self._limit = limit
        self._window_seconds = window_seconds
        self._events: dict[int, deque[float]] = defaultdict(deque)

    async def __call__(
        self,
        handler: Callable[[Any, Dict[str, Any]], Awaitable[Any]],
        event: Any,
        data: Dict[str, Any],
    ) -> Any:
        user_id = None
        if isinstance(event, Message) and event.from_user:
            user_id = event.from_user.id
        elif isinstance(event, CallbackQuery) and event.from_user:
            user_id = event.from_user.id

        if user_id is None:
            return await handler(event, data)

        now = time.monotonic()
        bucket = self._events[user_id]
        while bucket and now - bucket[0] > self._window_seconds:
            bucket.popleft()
        bucket.append(now)

        if len(bucket) > self._limit:
            if isinstance(event, Message):
                await event.answer("Вы нажимаете слишком быстро. Подождите пару секунд и продолжим.")
            elif isinstance(event, CallbackQuery):
                await event.answer("Слишком быстро. Подождите пару секунд.", show_alert=False)
            return None

        return await handler(event, data)
