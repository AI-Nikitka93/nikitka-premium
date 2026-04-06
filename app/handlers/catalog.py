from __future__ import annotations

from aiogram import Router
from aiogram.types import CallbackQuery, InputMediaPhoto, Message

from app.callbacks import AddToCartCallback, BrowseCallback, OpenCategoryCallback
from app.keyboards.catalog import categories_keyboard, product_keyboard
from app.services.cart import CartService
from app.services.catalog import CatalogService

router = Router(name="catalog")


async def open_catalog_selector(message: Message | CallbackQuery, catalog_service: CatalogService) -> None:
    categories = await catalog_service.list_categories()
    text = "Выберите категорию и листайте карточки товара кнопками вперед/назад."
    if isinstance(message, CallbackQuery):
        await message.message.answer(text, reply_markup=categories_keyboard(categories))
        await message.answer()
    else:
        await message.answer(text, reply_markup=categories_keyboard(categories))


async def _send_product_card(
    message: Message,
    catalog_service: CatalogService,
    cart_service: CartService,
    category_slug: str,
    page_index: int,
    user_id: int | None = None,
) -> None:
    page = await catalog_service.get_product_page(category_slug, page_index)
    if page is None:
        await message.answer("Категория пока пуста. Откройте другую категорию.")
        return
    effective_user_id = user_id if user_id is not None else message.from_user.id
    cart_quantity = await cart_service.get_total_quantity(effective_user_id)
    await message.answer_photo(
        photo=page.product.photo_url,
        caption=catalog_service.format_product_caption(page),
        reply_markup=product_keyboard(page, cart_quantity),
    )


async def _edit_product_card(
    callback: CallbackQuery,
    catalog_service: CatalogService,
    cart_service: CartService,
    category_slug: str,
    page_index: int,
) -> None:
    page = await catalog_service.get_product_page(category_slug, page_index)
    if page is None:
        await callback.answer("Карточка недоступна.", show_alert=True)
        return
    cart_quantity = await cart_service.get_total_quantity(callback.from_user.id)
    media = InputMediaPhoto(
        media=page.product.photo_url,
        caption=catalog_service.format_product_caption(page),
        parse_mode="HTML",
    )
    await callback.message.edit_media(media=media, reply_markup=product_keyboard(page, cart_quantity))


@router.callback_query(OpenCategoryCallback.filter())
async def open_category(
    callback: CallbackQuery,
    callback_data: OpenCategoryCallback,
    catalog_service: CatalogService,
    cart_service: CartService,
) -> None:
    await callback.message.delete()
    await _send_product_card(
        callback.message,
        catalog_service=catalog_service,
        cart_service=cart_service,
        category_slug=callback_data.slug,
        page_index=0,
        user_id=callback.from_user.id,
    )
    await callback.answer()


@router.callback_query(BrowseCallback.filter())
async def browse_category(
    callback: CallbackQuery,
    callback_data: BrowseCallback,
    catalog_service: CatalogService,
    cart_service: CartService,
) -> None:
    await _edit_product_card(
        callback,
        catalog_service=catalog_service,
        cart_service=cart_service,
        category_slug=callback_data.slug,
        page_index=callback_data.page,
    )
    await callback.answer()


@router.callback_query(AddToCartCallback.filter())
async def add_to_cart(
    callback: CallbackQuery,
    callback_data: AddToCartCallback,
    catalog_service: CatalogService,
    cart_service: CartService,
) -> None:
    await cart_service.add_product(callback.from_user.id, callback_data.product_id)
    await _edit_product_card(
        callback,
        catalog_service=catalog_service,
        cart_service=cart_service,
        category_slug=callback_data.slug,
        page_index=callback_data.page,
    )
    await callback.answer("Товар добавлен в корзину")


@router.callback_query(lambda cq: cq.data == "open_catalog")
async def open_catalog_from_callback(
    callback: CallbackQuery,
    catalog_service: CatalogService,
) -> None:
    await open_catalog_selector(callback, catalog_service)
