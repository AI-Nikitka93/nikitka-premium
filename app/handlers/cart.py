from __future__ import annotations

from aiogram import Router
from aiogram.types import CallbackQuery, Message

from app.callbacks import AdjustCartQuantityCallback, ClearCartCallback, RemoveFromCartCallback
from app.keyboards.cart import cart_keyboard
from app.services.cart import CartService

router = Router(name="cart")


async def send_cart_view(message: Message, cart_service: CartService) -> None:
    snapshot = await cart_service.get_snapshot(message.from_user.id)
    await message.answer(
        cart_service.format_snapshot(snapshot),
        reply_markup=cart_keyboard(snapshot),
    )


async def _refresh_cart(callback: CallbackQuery, cart_service: CartService) -> None:
    snapshot = await cart_service.get_snapshot(callback.from_user.id)
    await callback.message.edit_text(
        cart_service.format_snapshot(snapshot),
        reply_markup=cart_keyboard(snapshot),
    )


@router.callback_query(lambda cq: cq.data == "open_cart")
async def open_cart_from_callback(callback: CallbackQuery, cart_service: CartService) -> None:
    snapshot = await cart_service.get_snapshot(callback.from_user.id)
    await callback.message.answer(
        cart_service.format_snapshot(snapshot),
        reply_markup=cart_keyboard(snapshot),
    )
    await callback.answer()


@router.callback_query(RemoveFromCartCallback.filter())
async def remove_from_cart(
    callback: CallbackQuery,
    callback_data: RemoveFromCartCallback,
    cart_service: CartService,
) -> None:
    await cart_service.remove_product(callback.from_user.id, callback_data.product_id)
    await _refresh_cart(callback, cart_service)
    await callback.answer("Позиция удалена")


@router.callback_query(AdjustCartQuantityCallback.filter())
async def adjust_cart_quantity(
    callback: CallbackQuery,
    callback_data: AdjustCartQuantityCallback,
    cart_service: CartService,
) -> None:
    snapshot = await cart_service.get_snapshot(callback.from_user.id)
    current_item = next((item for item in snapshot.items if item.product_id == callback_data.product_id), None)
    if current_item is None:
        await callback.answer("Товар не найден в корзине.", show_alert=True)
        return

    new_quantity = current_item.quantity + callback_data.delta
    if new_quantity < 1:
        await callback.answer("Минимальное количество: 1 шт.", show_alert=False)
        return

    await cart_service.set_quantity(callback.from_user.id, callback_data.product_id, new_quantity)
    await _refresh_cart(callback, cart_service)
    await callback.answer("Количество обновлено")


@router.callback_query(ClearCartCallback.filter())
async def clear_cart(callback: CallbackQuery, cart_service: CartService) -> None:
    await cart_service.clear(callback.from_user.id)
    await _refresh_cart(callback, cart_service)
    await callback.answer("Корзина очищена")
