from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.callbacks import AddToCartCallback, BrowseCallback, OpenCategoryCallback
from app.constants import BUTTON_CART, BUTTON_CONTACT, NOOP_CALLBACK
from app.models import Category, ProductPage


def categories_keyboard(categories: list[Category]) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=category.title, callback_data=OpenCategoryCallback(slug=category.slug).pack())]
        for category in categories
    ]
    rows.append(
        [
            InlineKeyboardButton(text=BUTTON_CART, callback_data="open_cart"),
            InlineKeyboardButton(text=BUTTON_CONTACT, callback_data="open_contact"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def product_keyboard(page: ProductPage, cart_quantity: int) -> InlineKeyboardMarkup:
    nav_row = [
        InlineKeyboardButton(
            text="⬅️",
            callback_data=BrowseCallback(slug=page.product.category_slug, page=max(page.page - 1, 0)).pack(),
        ),
        InlineKeyboardButton(text=f"{page.page + 1}/{page.total_pages}", callback_data=NOOP_CALLBACK),
        InlineKeyboardButton(
            text="➡️",
            callback_data=BrowseCallback(
                slug=page.product.category_slug,
                page=min(page.page + 1, page.total_pages - 1),
            ).pack(),
        ),
    ]
    if page.total_pages == 1:
        nav_row[0].callback_data = NOOP_CALLBACK
        nav_row[2].callback_data = NOOP_CALLBACK
    elif page.page == 0:
        nav_row[0].callback_data = NOOP_CALLBACK
    elif page.page == page.total_pages - 1:
        nav_row[2].callback_data = NOOP_CALLBACK

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Добавить в корзину",
                    callback_data=AddToCartCallback(
                        product_id=page.product.id,
                        slug=page.product.category_slug,
                        page=page.page,
                    ).pack(),
                )
            ],
            nav_row,
            [
                InlineKeyboardButton(text=f"Корзина ({cart_quantity})", callback_data="open_cart"),
                InlineKeyboardButton(text="Категории", callback_data="open_catalog"),
            ],
            [InlineKeyboardButton(text=BUTTON_CONTACT, callback_data="open_contact")],
        ]
    )
