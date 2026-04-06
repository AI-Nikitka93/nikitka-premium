from __future__ import annotations

from app.database import Database
from app.models import CartSnapshot


class CartService:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def add_product(self, user_id: int, product_id: int) -> None:
        await self._db.add_to_cart(user_id, product_id, quantity=1)

    async def remove_product(self, user_id: int, product_id: int) -> None:
        await self._db.remove_from_cart(user_id, product_id)

    async def set_quantity(self, user_id: int, product_id: int, quantity: int) -> int:
        return await self._db.set_cart_quantity(user_id, product_id, quantity)

    async def clear(self, user_id: int) -> None:
        await self._db.clear_cart(user_id)

    async def get_snapshot(self, user_id: int) -> CartSnapshot:
        return await self._db.get_cart(user_id)

    async def get_total_quantity(self, user_id: int) -> int:
        return (await self._db.get_cart(user_id)).total_quantity

    @staticmethod
    def format_snapshot(snapshot: CartSnapshot) -> str:
        if snapshot.is_empty:
            return (
                "В корзине пока пусто.\n\n"
                "Откройте каталог, выберите категорию и добавьте понравившиеся позиции."
            )

        lines = ["<b>Ваша корзина</b>", ""]
        for item in snapshot.items:
            lines.append(
                f"• {item.title} x{item.quantity} — {item.subtotal_stars} Stars "
                f"({item.unit_price_stars} за штуку)"
            )
        lines.extend(["", f"Итого: <b>{snapshot.total_stars} Stars</b>"])
        return "\n".join(lines)
