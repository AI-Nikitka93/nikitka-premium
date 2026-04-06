from __future__ import annotations

from pathlib import Path

import pytest

from app.database import Database
from app.services.cart import CartService
from app.services.orders import OrderService


@pytest.mark.asyncio
async def test_cart_total_and_order_creation(tmp_path: Path) -> None:
    db_path = (tmp_path / "test_orders.db").as_posix()
    db = Database(f"sqlite+aiosqlite:///{db_path}")
    await db.connect()
    await db.initialize()
    await db.ensure_user(1001, "client", "Client Test")

    cart = CartService(db)
    await cart.add_product(1001, 1)
    await cart.add_product(1001, 1)
    await cart.add_product(1001, 2)

    snapshot = await cart.get_snapshot(1001)
    assert snapshot.total_quantity == 3
    assert snapshot.total_stars == (249 * 2) + 279

    orders = OrderService(db, currency="XTR", bot_title="Premium Style")
    draft = await orders.create_draft_from_cart(1001)
    assert draft is not None
    assert draft.total_stars == snapshot.total_stars

    order = await orders.get_order(draft.order_id)
    assert order is not None
    assert order.status == "awaiting_payment"

    await orders.mark_paid(draft.order_id, "tg_charge", "provider_charge")
    pending_orders = await db.list_pending_orders()
    assert len(pending_orders) == 1
    assert pending_orders[0].order_id == draft.order_id

    marked = await db.mark_order_shipped(draft.order_id)
    assert marked is True

    await db.close()
