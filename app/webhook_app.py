from __future__ import annotations

from contextlib import asynccontextmanager

from aiogram.types import Update
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from app.bootstrap import close_app_context, get_app_context


@asynccontextmanager
async def lifespan(_: FastAPI):
    await get_app_context()
    yield
    await close_app_context()


app = FastAPI(lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    context = await get_app_context()
    if x_telegram_bot_api_secret_token != context.settings.webhook_secret_token:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    update_data = await request.json()
    update = Update.model_validate(update_data, context={"bot": context.bot})
    await context.dispatcher.feed_update(
        context.bot,
        update,
        settings=context.settings,
        db=context.db,
        catalog_service=context.catalog_service,
        cart_service=context.cart_service,
        order_service=context.order_service,
        support_service=context.support_service,
    )
    return JSONResponse({"ok": True})
