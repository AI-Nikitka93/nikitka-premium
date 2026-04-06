from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from app.config import Settings
from app.callbacks import ReplySupportCallback
from app.constants import DIALOG_ADMIN_REPLY, DIALOG_MANAGER, DIALOG_PAYMENT_SUPPORT
from app.database import Database
from app.keyboards.admin import support_reply_keyboard
from app.keyboards.common import main_menu_keyboard
from app.services.support import SupportService

router = Router(name="support")


async def _enter_support_mode(message: Message, db: Database, request_type: str) -> None:
    await db.set_dialog_state(message.from_user.id, request_type)
    label = "по оплате" if request_type == DIALOG_PAYMENT_SUPPORT else "для менеджера"
    await message.answer(
        (
            f"Напишите одним сообщением ваш вопрос {label}.\n"
            "Я передам его человеку и подтвержу, что запрос создан."
        ),
        reply_markup=main_menu_keyboard(),
    )


@router.message(Command("contact"))
async def contact_command(message: Message, db: Database) -> None:
    await _enter_support_mode(message, db, DIALOG_MANAGER)


@router.message(Command("paysupport"))
async def pay_support_command(message: Message, db: Database) -> None:
    await _enter_support_mode(message, db, DIALOG_PAYMENT_SUPPORT)


@router.message(F.text == "Связаться с менеджером")
async def contact_button(message: Message, db: Database) -> None:
    await _enter_support_mode(message, db, DIALOG_MANAGER)


@router.callback_query(lambda cq: cq.data == "open_contact")
async def contact_callback(callback: CallbackQuery, db: Database) -> None:
    await db.set_dialog_state(callback.from_user.id, DIALOG_MANAGER)
    await callback.message.answer(
        "Напишите сообщение менеджеру одним текстом. Я сразу отправлю уведомление админу."
    )
    await callback.answer()


async def handle_dialog_message(
    message: Message,
    dialog_state: str,
    dialog_payload: str,
    db: Database,
    support_service: SupportService,
    settings: Settings,
) -> bool:
    if dialog_state == DIALOG_ADMIN_REPLY:
        if message.from_user.id != settings.admin_chat_id:
            await db.clear_dialog_state(message.from_user.id)
            await message.answer("Режим ответа администратора сброшен: недостаточно прав.")
            return True
        try:
            request_id_raw, target_user_id_raw = dialog_payload.split(":")
            request_id = int(request_id_raw)
            target_user_id = int(target_user_id_raw)
        except ValueError:
            await db.clear_dialog_state(message.from_user.id)
            await message.answer("Не удалось восстановить контекст ответа. Нажмите кнопку «Ответить» заново.")
            return True

        await message.bot.send_message(
            chat_id=target_user_id,
            text=f"<b>{settings.bot_title}</b>\n{message.text}",
        )
        await db.mark_support_request_answered(request_id)
        await db.clear_dialog_state(message.from_user.id)
        await message.answer("Ответ клиенту отправлен.")
        return True

    if dialog_state not in {DIALOG_MANAGER, DIALOG_PAYMENT_SUPPORT}:
        return False

    request_type = "payment_support" if dialog_state == DIALOG_PAYMENT_SUPPORT else "manager_request"
    request_id = await support_service.create_request(
        user_id=message.from_user.id,
        request_type=request_type,
        message_text=message.text,
    )
    await db.clear_dialog_state(message.from_user.id)
    await message.bot.send_message(
        chat_id=settings.admin_chat_id,
        text=support_service.format_admin_alert(
            request_id=request_id,
            request_type=request_type,
            user=message.from_user,
            message_text=message.text,
        ),
        reply_markup=support_reply_keyboard(request_id=request_id, user_id=message.from_user.id),
    )
    await message.answer(
        f"Готово. Запрос #{request_id} отправлен менеджеру. Мы вернемся к вам в этом чате."
    )
    return True


@router.callback_query(ReplySupportCallback.filter())
async def reply_support_callback(
    callback: CallbackQuery,
    callback_data: ReplySupportCallback,
    db: Database,
    settings: Settings,
) -> None:
    if callback.from_user.id != settings.admin_chat_id:
        await callback.answer("Недостаточно прав.", show_alert=True)
        return
    request = await db.get_support_request(callback_data.request_id)
    if request is None:
        await callback.answer("Запрос не найден.", show_alert=True)
        return
    await db.set_dialog_state(
        callback.from_user.id,
        DIALOG_ADMIN_REPLY,
        f"{callback_data.request_id}:{callback_data.user_id}",
    )
    await callback.message.answer(
        (
            f"Ответ клиенту <code>{callback_data.user_id}</code>.\n"
            "Следующим сообщением отправьте текст ответа от имени магазина."
        )
    )
    await callback.answer()
