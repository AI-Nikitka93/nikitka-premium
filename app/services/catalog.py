from __future__ import annotations

import math

from app.database import Database
from app.models import ProductPage


class CatalogService:
    def __init__(self, db: Database, page_size: int) -> None:
        self._db = db
        self._page_size = page_size

    async def list_categories(self):
        return await self._db.list_categories()

    async def find_category_by_text(self, text: str):
        normalized = text.strip().lower()
        for category in await self._db.list_categories():
            if normalized in {category.title.lower(), category.slug.lower()}:
                return category
        return None

    async def get_product_page(self, category_slug: str, page: int) -> ProductPage | None:
        total_items = await self._db.count_products(category_slug)
        if total_items == 0:
            return None

        total_pages = max(1, math.ceil(total_items / self._page_size))
        safe_page = min(max(page, 0), total_pages - 1)
        products = await self._db.list_products(
            category_slug=category_slug,
            limit=self._page_size,
            offset=safe_page * self._page_size,
        )
        if not products:
            return None

        category_title = await self._db.get_category_title(category_slug)
        if category_title is None:
            return None

        return ProductPage(
            product=products[0],
            page=safe_page,
            total_pages=total_pages,
            category_title=category_title,
        )

    @staticmethod
    def format_product_caption(page: ProductPage) -> str:
        product = page.product
        return (
            f"<b>{product.title}</b>\n"
            f"Категория: {page.category_title}\n"
            f"Цена: <b>{product.price_stars} Stars</b>\n\n"
            f"{product.description}\n\n"
            f"Страница {page.page + 1} из {page.total_pages}"
        )
