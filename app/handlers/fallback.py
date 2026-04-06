from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery, Message

from app.config import Settings
from app.constants import BUTTON_CART, BUTTON_CATALOG, BUTTON_CONTACT, BUTTON_HELP, DIALOG_NONE, NOOP_CALLBACK
from app.database import Database
from app.keyboards.common import main_menu_keyboard
from app.services.cart import CartService
from app.services.catalog import CatalogService
from app.services.support import SupportService

router = Router(name="fallback")


@router.callback_query(lambda cq: cq.data == NOOP_CALLBACK)
async def noop_callback(callback: CallbackQuery) -> None:
    await callback.answer()


@router.message(F.text)
async def text_fallback(
    message: Message,
    db: Database,
    settings: Settings,
    catalog_service: CatalogService,
    cart_service: CartService,
    support_service: SupportService,
) -> None:
    dialog = await db.get_dialog_state(message.from_user.id)
    from app.handlers.support import handle_dialog_message

    if await handle_dialog_message(
        message=message,
        dialog_state=dialog.state,
        dialog_payload=dialog.payload,
        db=db,
        support_service=support_service,
        settings=settings,
    ):
        return

    text = message.text.strip()
    lowered = text.lower()

    if text == BUTTON_CATALOG or lowered in {"каталог", "витрина"}:
        from app.handlers.catalog import open_catalog_selector

        await open_catalog_selector(message, catalog_service)
        return

    if text == BUTTON_CART or lowered in {"корзина", "моя корзина"}:
        from app.handlers.cart import send_cart_view

        await send_cart_view(message, cart_service)
        return

    if text == BUTTON_CONTACT or lowered in {"менеджер", "связаться с менеджером"}:
        from app.handlers.support import contact_command

        await contact_command(message, db)
        return

    if text == BUTTON_HELP or lowered in {"помощь", "help"}:
        from app.handlers.common import help_command

        await help_command(message)
        return

    category = await catalog_service.find_category_by_text(text)
    if category is not None:
        from app.handlers.catalog import _send_product_card

        await _send_product_card(
            message,
            catalog_service=catalog_service,
            cart_service=cart_service,
            category_slug=category.slug,
            page_index=0,
        )
        return

    if dialog.state == DIALOG_NONE:
        await message.answer(
            (
                "Я жду нажатие кнопки или понятную команду.\n"
                "Попробуйте: Каталог, Корзина, Связаться с менеджером или /help."
            ),
            reply_markup=main_menu_keyboard(),
        )


@router.message()
async def attachment_fallback(message: Message, db: Database) -> None:
    dialog = await db.get_dialog_state(message.from_user.id)
    if dialog.state != DIALOG_NONE:
        await message.answer("Сейчас я жду обычное текстовое сообщение для менеджера.")
        return
    await message.answer(
        "Сейчас я понимаю только текст и кнопки. Нажмите нужную кнопку в меню или отправьте команду /help.",
        reply_markup=main_menu_keyboard(),
    )
