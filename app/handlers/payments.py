from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery, LabeledPrice, Message, PreCheckoutQuery

from app.callbacks import CheckoutCallback
from app.config import Settings
from app.constants import ORDER_STATUS_AWAITING_PAYMENT
from app.services.cart import CartService
from app.services.orders import OrderService

router = Router(name="payments")


def _extract_order_id(payload: str) -> str | None:
    prefix = "order:"
    if not payload.startswith(prefix):
        return None
    return payload[len(prefix) :]


@router.callback_query(CheckoutCallback.filter())
async def checkout(
    callback: CallbackQuery,
    order_service: OrderService,
    settings: Settings,
    cart_service: CartService,
) -> None:
    snapshot = await cart_service.get_snapshot(callback.from_user.id)
    if snapshot.is_empty:
        await callback.answer("Корзина пуста.", show_alert=True)
        return

    draft = await order_service.create_draft_from_cart(callback.from_user.id)
    if draft is None:
        await callback.answer("Не удалось создать заказ.", show_alert=True)
        return

    await callback.bot.send_invoice(
        chat_id=callback.from_user.id,
        title=draft.title,
        description=draft.description,
        payload=f"order:{draft.order_id}",
        provider_token="",
        currency=settings.payments_currency,
        prices=[LabeledPrice(label="Premium order", amount=draft.total_stars)],
        photo_url=draft.photo_url,
        start_parameter=f"premium-order-{draft.order_id[:8]}",
    )
    await callback.answer("Инвойс отправлен. Проверьте сообщение ниже.")


@router.pre_checkout_query()
async def pre_checkout(
    pre_checkout_query: PreCheckoutQuery,
    order_service: OrderService,
    settings: Settings,
) -> None:
    order_id = _extract_order_id(pre_checkout_query.invoice_payload)
    if order_id is None:
        await pre_checkout_query.answer(ok=False, error_message="Некорректный payload заказа.")
        return

    order = await order_service.get_order(order_id)
    if order is None:
        await pre_checkout_query.answer(ok=False, error_message="Заказ не найден.")
        return
    if order.user_id != pre_checkout_query.from_user.id:
        await pre_checkout_query.answer(ok=False, error_message="Этот заказ принадлежит другому пользователю.")
        return
    if order.status != ORDER_STATUS_AWAITING_PAYMENT:
        await pre_checkout_query.answer(ok=False, error_message="Этот заказ уже обработан.")
        return
    if pre_checkout_query.currency != settings.payments_currency:
        await pre_checkout_query.answer(ok=False, error_message="Валюта заказа не совпадает.")
        return
    if pre_checkout_query.total_amount != order.total_stars:
        await pre_checkout_query.answer(ok=False, error_message="Сумма заказа изменилась. Создайте инвойс заново.")
        return

    await pre_checkout_query.answer(ok=True)


@router.message(F.successful_payment)
async def successful_payment(message: Message, order_service: OrderService) -> None:
    payment = message.successful_payment
    order_id = _extract_order_id(payment.invoice_payload)
    if order_id is None:
        await message.answer("Платеж получен, но payload заказа не распознан. Менеджер уже уведомлен.")
        return

    await order_service.mark_paid(
        order_id=order_id,
        telegram_payment_charge_id=payment.telegram_payment_charge_id,
        provider_payment_charge_id=payment.provider_payment_charge_id,
    )
    await message.answer(
        (
            "<b>Оплата подтверждена</b>\n"
            f"Заказ: <code>{order_id}</code>\n"
            f"Сумма: <b>{payment.total_amount} {payment.currency}</b>\n\n"
            "Спасибо за покупку. Менеджер увидит заказ в административном чате."
        )
    )
