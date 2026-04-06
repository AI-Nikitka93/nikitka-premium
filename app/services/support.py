from __future__ import annotations

from aiogram.types import User

from app.database import Database


class SupportService:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def create_request(self, user_id: int, request_type: str, message_text: str) -> int:
        return await self._db.create_support_request(user_id, request_type, message_text)

    @staticmethod
    def format_admin_alert(
        request_id: int,
        request_type: str,
        user: User,
        message_text: str,
    ) -> str:
        username = f"@{user.username}" if user.username else "без username"
        direct_link = f"tg://user?id={user.id}"
        request_label = "Платежный вопрос" if request_type == "payment_support" else "Запрос менеджеру"
        return (
            f"<b>{request_label}</b>\n"
            f"Request ID: <b>#{request_id}</b>\n"
            f"Клиент: {user.full_name}\n"
            f"Username: {username}\n"
            f"User ID: <code>{user.id}</code>\n"
            f"Профиль: <a href=\"{direct_link}\">открыть чат</a>\n\n"
            f"Сообщение:\n{message_text}"
        )
