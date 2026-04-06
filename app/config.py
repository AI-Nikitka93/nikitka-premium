from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

from app.constants import DEFAULT_WEBHOOK_PATH


class ConfigError(RuntimeError):
    """Raised when required environment variables are missing."""


def _read_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(slots=True)
class Settings:
    bot_token: str
    admin_chat_id: int
    bot_username: str
    bot_title: str
    database_url: str
    log_level: str
    catalog_page_size: int
    throttle_limit: int
    throttle_window_seconds: int
    telegram_use_test_environment: bool
    payments_currency: str
    public_base_url: str
    webhook_secret_token: str
    webhook_path: str

    @property
    def webhook_url(self) -> str:
        return f"{self.public_base_url.rstrip('/')}{self.webhook_path}"

    @classmethod
    def load(cls) -> "Settings":
        load_dotenv()

        bot_token = os.getenv("BOT_TOKEN", "").strip()
        admin_chat_id_raw = os.getenv("ADMIN_CHAT_ID", "").strip()
        database_url = os.getenv("DATABASE_URL", "").strip()
        public_base_url = os.getenv("PUBLIC_BASE_URL", "").strip()
        webhook_secret_token = os.getenv("WEBHOOK_SECRET_TOKEN", "").strip()
        if not bot_token:
            raise ConfigError("BOT_TOKEN is required.")
        if not admin_chat_id_raw:
            raise ConfigError("ADMIN_CHAT_ID is required.")
        if not database_url:
            raise ConfigError("DATABASE_URL is required.")
        if not public_base_url:
            raise ConfigError("PUBLIC_BASE_URL is required.")
        if not webhook_secret_token:
            raise ConfigError("WEBHOOK_SECRET_TOKEN is required.")

        try:
            admin_chat_id = int(admin_chat_id_raw)
        except ValueError as exc:
            raise ConfigError("ADMIN_CHAT_ID must be an integer.") from exc

        return cls(
            bot_token=bot_token,
            admin_chat_id=admin_chat_id,
            bot_username=os.getenv("BOT_USERNAME", "premium_style_bot").strip() or "premium_style_bot",
            bot_title=os.getenv("BOT_TITLE", "Premium Style").strip() or "Premium Style",
            database_url=database_url,
            log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
            catalog_page_size=max(1, int(os.getenv("CATALOG_PAGE_SIZE", "1"))),
            throttle_limit=max(1, int(os.getenv("THROTTLE_LIMIT", "6"))),
            throttle_window_seconds=max(1, int(os.getenv("THROTTLE_WINDOW_SECONDS", "4"))),
            telegram_use_test_environment=_read_bool("TELEGRAM_USE_TEST_ENVIRONMENT", False),
            payments_currency=os.getenv("PAYMENTS_CURRENCY", "XTR").strip().upper() or "XTR",
            public_base_url=public_base_url,
            webhook_secret_token=webhook_secret_token,
            webhook_path=os.getenv("WEBHOOK_PATH", DEFAULT_WEBHOOK_PATH).strip() or DEFAULT_WEBHOOK_PATH,
        )
