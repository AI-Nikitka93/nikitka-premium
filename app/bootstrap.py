from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.enums import ParseMode

from app.config import Settings
from app.database import Database
from app.handlers.admin import router as admin_router
from app.handlers.cart import router as cart_router
from app.handlers.catalog import router as catalog_router
from app.handlers.common import router as common_router
from app.handlers.common import set_bot_commands
from app.handlers.fallback import router as fallback_router
from app.handlers.payments import router as payments_router
from app.handlers.support import router as support_router
from app.logging_config import configure_logging
from app.middlewares.correlation import CorrelationIdMiddleware
from app.middlewares.throttling import ThrottlingMiddleware
from app.middlewares.user_sync import UserSyncMiddleware
from app.services.cart import CartService
from app.services.catalog import CatalogService
from app.services.orders import OrderService
from app.services.support import SupportService

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class AppContext:
    settings: Settings
    db: Database
    bot: Bot
    dispatcher: Dispatcher
    catalog_service: CatalogService
    cart_service: CartService
    order_service: OrderService
    support_service: SupportService


_context: AppContext | None = None
_context_lock = asyncio.Lock()


def _build_bot(settings: Settings) -> Bot:
    session = None
    if settings.telegram_use_test_environment:
        session = AiohttpSession(
            api=TelegramAPIServer(
                base="https://api.telegram.org/bot{token}/test/{method}",
                file="https://api.telegram.org/file/bot{token}/test/{path}",
            )
        )
    return Bot(
        token=settings.bot_token,
        session=session,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )


def _build_dispatcher(settings: Settings) -> Dispatcher:
    dp = Dispatcher()
    middleware = ThrottlingMiddleware(
        limit=settings.throttle_limit,
        window_seconds=settings.throttle_window_seconds,
    )
    correlation = CorrelationIdMiddleware()
    user_sync = UserSyncMiddleware()

    for observer in (dp.message, dp.callback_query, dp.pre_checkout_query):
        observer.middleware(correlation)
        observer.middleware(user_sync)
        observer.middleware(middleware)

    dp.include_router(common_router)
    dp.include_router(catalog_router)
    dp.include_router(cart_router)
    dp.include_router(payments_router)
    dp.include_router(support_router)
    dp.include_router(admin_router)
    dp.include_router(fallback_router)
    return dp


async def get_app_context() -> AppContext:
    global _context
    if _context is not None:
        return _context

    async with _context_lock:
        if _context is not None:
            return _context

        settings = Settings.load()
        configure_logging(settings.log_level)

        db = Database(settings.database_url)
        await db.connect()
        await db.initialize()

        catalog_service = CatalogService(db, settings.catalog_page_size)
        cart_service = CartService(db)
        order_service = OrderService(db, settings.payments_currency, settings.bot_title)
        support_service = SupportService(db)
        bot = _build_bot(settings)
        dispatcher = _build_dispatcher(settings)
        await set_bot_commands(bot)

        _context = AppContext(
            settings=settings,
            db=db,
            bot=bot,
            dispatcher=dispatcher,
            catalog_service=catalog_service,
            cart_service=cart_service,
            order_service=order_service,
            support_service=support_service,
        )
        logger.info("Webhook app context ready")
        return _context


async def close_app_context() -> None:
    global _context
    if _context is None:
        return
    await _context.db.close()
    await _context.bot.session.close()
    _context = None
