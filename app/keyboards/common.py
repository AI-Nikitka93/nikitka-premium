from __future__ import annotations

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup

from app.constants import BUTTON_CART, BUTTON_CATALOG, BUTTON_CONTACT, BUTTON_HELP


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=BUTTON_CATALOG), KeyboardButton(text=BUTTON_CART)],
            [KeyboardButton(text=BUTTON_CONTACT), KeyboardButton(text=BUTTON_HELP)],
        ],
        resize_keyboard=True,
        input_field_placeholder="Выберите действие",
    )
