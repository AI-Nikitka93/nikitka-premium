from __future__ import annotations

import asyncio

from app.bootstrap import close_app_context, get_app_context


async def main() -> None:
    context = await get_app_context()
    await context.bot.set_webhook(
        url=context.settings.webhook_url,
        secret_token=context.settings.webhook_secret_token,
        allowed_updates=context.dispatcher.resolve_used_update_types(),
        drop_pending_updates=True,
    )
    info = await context.bot.get_webhook_info()
    print(f"Webhook URL: {info.url}")
    print(f"Pending updates: {info.pending_update_count}")
    print(f"Last error: {info.last_error_message}")
    await close_app_context()


if __name__ == "__main__":
    asyncio.run(main())
