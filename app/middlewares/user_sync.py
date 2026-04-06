from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, PreCheckoutQuery

from app.database import Database


class UserSyncMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Any, Dict[str, Any]], Awaitable[Any]],
        event: Any,
        data: Dict[str, Any],
    ) -> Any:
        db: Database | None = data.get("db")
        if db is not None:
            if isinstance(event, Message) and event.from_user:
                await db.ensure_user(
                    user_id=event.from_user.id,
                    username=event.from_user.username,
                    full_name=event.from_user.full_name,
                )
            elif isinstance(event, CallbackQuery) and event.from_user:
                await db.ensure_user(
                    user_id=event.from_user.id,
                    username=event.from_user.username,
                    full_name=event.from_user.full_name,
                )
            elif isinstance(event, PreCheckoutQuery):
                await db.ensure_user(
                    user_id=event.from_user.id,
                    username=event.from_user.username,
                    full_name=event.from_user.full_name,
                )
        return await handler(event, data)
