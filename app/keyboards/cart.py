from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.callbacks import AdjustCartQuantityCallback, CheckoutCallback, ClearCartCallback, RemoveFromCartCallback
from app.constants import NOOP_CALLBACK
from app.models import CartSnapshot


def cart_keyboard(snapshot: CartSnapshot) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    for item in snapshot.items:
        rows.append(
            [
                InlineKeyboardButton(
                    text="-",
                    callback_data=AdjustCartQuantityCallback(product_id=item.product_id, delta=-1).pack(),
                ),
                InlineKeyboardButton(
                    text=f"{item.quantity} шт",
                    callback_data=NOOP_CALLBACK,
                ),
                InlineKeyboardButton(
                    text="+",
                    callback_data=AdjustCartQuantityCallback(product_id=item.product_id, delta=1).pack(),
                ),
            ]
        )
        rows.append(
            [
                InlineKeyboardButton(
                    text=f"🗑 Удалить {item.title}",
                    callback_data=RemoveFromCartCallback(product_id=item.product_id).pack(),
                )
            ]
        )
    if snapshot.items:
        rows.append(
            [InlineKeyboardButton(text="Оплатить через Stars", callback_data=CheckoutCallback(confirm=1).pack())]
        )
        rows.append(
            [InlineKeyboardButton(text="Очистить корзину", callback_data=ClearCartCallback(confirm=1).pack())]
        )
    rows.append(
        [
            InlineKeyboardButton(text="Каталог", callback_data="open_catalog"),
            InlineKeyboardButton(text="Менеджер", callback_data="open_contact"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)
