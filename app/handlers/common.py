from __future__ import annotations

import logging

from aiogram import Bot, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import BotCommand, ErrorEvent, Message

from app.config import Settings
from app.database import Database
from app.keyboards.common import main_menu_keyboard
from app.services.cart import CartService
from app.services.catalog import CatalogService

logger = logging.getLogger(__name__)

router = Router(name="common")


async def send_welcome(message: Message, settings: Settings) -> None:
    await message.answer(
        (
            f"<b>{settings.bot_title}</b>\n"
            "Премиальный магазин одежды в Telegram.\n\n"
            "Откройте каталог, соберите корзину и оплатите заказ через Telegram Stars."
        ),
        reply_markup=main_menu_keyboard(),
    )


@router.message(CommandStart())
async def start_command(message: Message, db: Database, settings: Settings) -> None:
    await db.ensure_user(
        user_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
    )
    await send_welcome(message, settings)


@router.message(Command("menu"))
async def menu_command(message: Message, settings: Settings) -> None:
    await send_welcome(message, settings)


@router.message(Command("help"))
async def help_command(message: Message) -> None:
    await message.answer(
        (
            "Доступные действия:\n"
            "• Каталог — открыть витрину\n"
            "• Корзина — посмотреть выбранные товары\n"
            "• Связаться с менеджером — оставить сообщение\n"
            "• /paysupport — вопрос по оплате\n\n"
            "Если вместо кнопки вы напишете текст, бот мягко подскажет следующий шаг."
        ),
        reply_markup=main_menu_keyboard(),
    )


@router.message(Command("catalog"))
async def catalog_command(message: Message, catalog_service: CatalogService) -> None:
    from app.handlers.catalog import open_catalog_selector

    await open_catalog_selector(message, catalog_service)


@router.message(Command("cart"))
async def cart_command(message: Message, cart_service: CartService) -> None:
    from app.handlers.cart import send_cart_view

    await send_cart_view(message, cart_service)


@router.message(F.text == "Помощь")
async def help_button(message: Message) -> None:
    await help_command(message)


async def set_bot_commands(bot: Bot) -> None:
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Запустить бота"),
            BotCommand(command="menu", description="Показать меню"),
            BotCommand(command="catalog", description="Открыть каталог"),
            BotCommand(command="cart", description="Открыть корзину"),
            BotCommand(command="contact", description="Связаться с менеджером"),
            BotCommand(command="paysupport", description="Вопрос по оплате"),
            BotCommand(command="admin", description="Админ-панель"),
            BotCommand(command="help", description="Помощь"),
        ]
    )


@router.errors()
async def global_error_handler(event: ErrorEvent) -> bool:
    logger.exception("Unhandled update error", exc_info=event.exception)
    update = event.update
    if getattr(update, "message", None):
        await update.message.answer(
            "Что-то пошло не так на нашей стороне. Попробуйте еще раз или напишите менеджеру."
        )
    elif getattr(update, "callback_query", None):
        await update.callback_query.answer("Произошла ошибка. Попробуйте еще раз.", show_alert=True)
    return True
