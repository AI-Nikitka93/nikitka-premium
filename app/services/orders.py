from __future__ import annotations

import uuid

from app.database import Database
from app.models import OrderDraft, OrderRecord


class OrderService:
    def __init__(self, db: Database, currency: str, bot_title: str) -> None:
        self._db = db
        self._currency = currency
        self._bot_title = bot_title

    async def create_draft_from_cart(self, user_id: int) -> OrderDraft | None:
        rows = await self._db.get_cart_items_for_order(user_id)
        if not rows:
            return None

        order_id = uuid.uuid4().hex
        total_stars = sum(int(row["unit_price_stars"]) * int(row["quantity"]) for row in rows)
        title = f"{self._bot_title} order"
        description_lines = []
        for row in rows[:3]:
            description_lines.append(f"{row['title']} x{row['quantity']}")
        if len(rows) > 3:
            description_lines.append(f"И еще {len(rows) - 3} поз.")
        description = ", ".join(description_lines)
        photo_url = rows[0]["photo_url"]

        items = [
            {
                "product_id": int(row["product_id"]),
                "title": str(row["title"]),
                "unit_price_stars": int(row["unit_price_stars"]),
                "quantity": int(row["quantity"]),
            }
            for row in rows
        ]
        await self._db.create_order(
            order_id=order_id,
            user_id=user_id,
            currency=self._currency,
            total_stars=total_stars,
            title=title,
            description=description,
            photo_url=photo_url,
            items=items,
        )

        return OrderDraft(
            order_id=order_id,
            total_stars=total_stars,
            title=title,
            description=description,
            photo_url=photo_url,
        )

    async def get_order(self, order_id: str) -> OrderRecord | None:
        return await self._db.get_order(order_id)

    async def mark_paid(
        self,
        order_id: str,
        telegram_payment_charge_id: str,
        provider_payment_charge_id: str,
    ) -> None:
        await self._db.mark_order_paid(
            order_id=order_id,
            telegram_payment_charge_id=telegram_payment_charge_id,
            provider_payment_charge_id=provider_payment_charge_id,
        )
