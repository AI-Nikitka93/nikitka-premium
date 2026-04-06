from __future__ import annotations

from pathlib import Path

import pytest

from app.database import Database
from app.services.catalog import CatalogService


@pytest.mark.asyncio
async def test_catalog_pagination(tmp_path: Path) -> None:
    db_path = (tmp_path / "test_catalog.db").as_posix()
    db = Database(f"sqlite+aiosqlite:///{db_path}")
    await db.connect()
    await db.initialize()

    service = CatalogService(db, page_size=1)
    page0 = await service.get_product_page("hoodies", 0)
    page1 = await service.get_product_page("hoodies", 1)

    assert page0 is not None
    assert page1 is not None
    assert page0.page == 0
    assert page1.page == 1
    assert page0.total_pages == 2
    assert page0.product.id != page1.product.id

    await db.close()
