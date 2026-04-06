from __future__ import annotations

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from app.callbacks import MarkOrderShippedCallback
from app.config import Settings
from app.database import Database
from app.keyboards.admin import admin_menu_keyboard, order_actions_keyboard
from app.models import AdminOrderSummary

router = Router(name="admin")


def _is_admin(user_id: int, settings: Settings) -> bool:
    return user_id == settings.admin_chat_id


def _format_order(order: AdminOrderSummary) -> str:
    username = f"@{order.username}" if order.username else "без username"
    items_block = "\n".join(
        f"• {item.title} x{item.quantity} — {item.subtotal_stars} Stars" for item in order.items
    )
    return (
        f"<b>Заказ {order.order_id}</b>\n"
        f"Статус: <b>{order.status}</b>\n"
        f"Клиент: {order.full_name} ({username})\n"
        f"User ID: <code>{order.user_id}</code>\n"
        f"Создан: {order.created_at}\n"
        f"Сумма: <b>{order.total_stars} Stars</b>\n\n"
        f"{items_block}"
    )


@router.message(Command("admin"))
async def admin_panel(message: Message, settings: Settings) -> None:
    if not _is_admin(message.from_user.id, settings):
        await message.answer("Команда /admin доступна только администратору.")
        return
    await message.answer("Админ-панель", reply_markup=admin_menu_keyboard())


@router.callback_query(lambda cq: cq.data == "admin_pending_orders")
async def admin_pending_orders(callback: CallbackQuery, db: Database, settings: Settings) -> None:
    if not _is_admin(callback.from_user.id, settings):
        await callback.answer("Недостаточно прав.", show_alert=True)
        return
    orders = await db.list_pending_orders()
    if not orders:
        await callback.message.answer("Необработанных заказов нет.")
        await callback.answer()
        return
    for order in orders:
        await callback.message.answer(_format_order(order), reply_markup=order_actions_keyboard(order.order_id))
    await callback.answer()


@router.callback_query(MarkOrderShippedCallback.filter())
async def mark_order_shipped(
    callback: CallbackQuery,
    callback_data: MarkOrderShippedCallback,
    db: Database,
    settings: Settings,
) -> None:
    if not _is_admin(callback.from_user.id, settings):
        await callback.answer("Недостаточно прав.", show_alert=True)
        return
    updated = await db.mark_order_shipped(callback_data.order_id)
    if not updated:
        await callback.answer("Заказ уже обработан или не найден.", show_alert=True)
        return
    original_text = callback.message.html_text or callback.message.text or "Заказ"
    updated_text = f"{original_text}\n\n<b>Статус обновлен:</b> shipped"
    await callback.message.edit_text(updated_text)
    await callback.answer("Заказ отмечен как отправленный.")
