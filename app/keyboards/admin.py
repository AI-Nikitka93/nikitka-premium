from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.callbacks import MarkOrderShippedCallback, ReplySupportCallback


def admin_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Необработанные заказы", callback_data="admin_pending_orders")]
        ]
    )


def order_actions_keyboard(order_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Отметить как отправленный",
                    callback_data=MarkOrderShippedCallback(order_id=order_id).pack(),
                )
            ]
        ]
    )


def support_reply_keyboard(request_id: int, user_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Ответить",
                    callback_data=ReplySupportCallback(request_id=request_id, user_id=user_id).pack(),
                )
            ]
        ]
    )
