from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, MetaData, String, Text, delete, func, select, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.pool import NullPool

from app.constants import (
    DIALOG_NONE,
    ORDER_STATUS_AWAITING_PAYMENT,
    ORDER_STATUS_PENDING,
    ORDER_STATUS_SHIPPED,
    SEED_CATEGORIES,
    SEED_PRODUCTS,
)
from app.models import (
    AdminOrderSummary,
    CartItem,
    CartSnapshot,
    Category,
    DialogState,
    OrderItemRecord,
    OrderRecord,
    Product,
    SupportRequestRecord,
)


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class CategoryModel(Base):
    __tablename__ = "categories"

    slug: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(128), nullable=False)


class ProductModel(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_slug: Mapped[str] = mapped_column(ForeignKey("categories.slug", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price_stars: Mapped[int] = mapped_column(Integer, nullable=False)
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)


class UserModel(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )


class UserDialogModel(Base):
    __tablename__ = "user_dialogs"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True,
    )
    state: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )


class CartItemModel(Base):
    __tablename__ = "cart_items"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True,
    )
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))


class OrderModel(Base):
    __tablename__ = "orders"

    order_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    currency: Mapped[str] = mapped_column(String(16), nullable=False)
    total_stars: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    telegram_payment_charge_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_payment_charge_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    items: Mapped[list["OrderItemModel"]] = relationship(cascade="all, delete-orphan")


class OrderItemModel(Base):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("orders.order_id", ondelete="CASCADE"),
        primary_key=True,
    )
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price_stars: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)


class SupportRequestModel(Base):
    __tablename__ = "support_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    request_type: Mapped[str] = mapped_column(String(64), nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Database:
    def __init__(self, url: str) -> None:
        self._url = url
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None

    def _build_engine(self) -> AsyncEngine:
        url = make_url(self._url)
        connect_args: dict[str, Any] = {}

        if url.drivername == "postgresql":
            url = url.set(drivername="postgresql+asyncpg")

        if url.drivername == "postgresql+asyncpg":
            query = dict(url.query)
            sslmode = query.pop("sslmode", None)
            query.pop("channel_binding", None)
            if sslmode:
                connect_args["ssl"] = sslmode
            url = URL.create(
                drivername=url.drivername,
                username=url.username,
                password=url.password,
                host=url.host,
                port=url.port,
                database=url.database,
                query=query,
            )

        common_kwargs: dict[str, Any] = {
            "echo": False,
            "pool_pre_ping": True,
        }
        if url.drivername == "postgresql+asyncpg":
            common_kwargs["poolclass"] = NullPool
            connect_args["statement_cache_size"] = 0
        if connect_args:
            common_kwargs["connect_args"] = connect_args
        return create_async_engine(url, **common_kwargs)

    async def connect(self) -> None:
        if self._engine is None:
            self._engine = self._build_engine()
            self._session_factory = async_sessionmaker(self._engine, expire_on_commit=False)

    async def close(self) -> None:
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None

    @property
    def session_factory(self) -> async_sessionmaker[AsyncSession]:
        if self._session_factory is None:
            raise RuntimeError("Database is not connected.")
        return self._session_factory

    async def initialize(self) -> None:
        async with self._engine.begin() as conn:  # type: ignore[union-attr]
            await conn.run_sync(Base.metadata.create_all)
        await self._seed_catalog()

    async def _seed_catalog(self) -> None:
        async with self.session_factory() as session:
            category_count = await session.scalar(select(func.count()).select_from(CategoryModel))
            if not category_count:
                session.add_all(CategoryModel(**item) for item in SEED_CATEGORIES)

            product_count = await session.scalar(select(func.count()).select_from(ProductModel))
            if not product_count:
                session.add_all(ProductModel(**item) for item in SEED_PRODUCTS)

            await session.commit()

    async def ensure_user(self, user_id: int, username: str | None, full_name: str) -> None:
        now = datetime.now(timezone.utc)
        async with self.session_factory() as session:
            user = await session.get(UserModel, user_id)
            if user is None:
                session.add(UserModel(user_id=user_id, username=username, full_name=full_name))
            else:
                user.username = username
                user.full_name = full_name
                user.updated_at = now

            dialog = await session.get(UserDialogModel, user_id)
            if dialog is None:
                session.add(UserDialogModel(user_id=user_id, state=DIALOG_NONE, payload=""))
            await session.commit()

    async def list_categories(self) -> list[Category]:
        async with self.session_factory() as session:
            result = await session.execute(select(CategoryModel).order_by(CategoryModel.title))
            rows = result.scalars().all()
        return [Category(slug=row.slug, title=row.title) for row in rows]

    async def get_category_title(self, slug: str) -> str | None:
        async with self.session_factory() as session:
            return await session.scalar(
                select(CategoryModel.title).where(CategoryModel.slug == slug)
            )

    async def count_products(self, category_slug: str) -> int:
        async with self.session_factory() as session:
            result = await session.scalar(
                select(func.count()).select_from(ProductModel).where(ProductModel.category_slug == category_slug)
            )
        return int(result or 0)

    async def list_products(self, category_slug: str, limit: int, offset: int) -> list[Product]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(ProductModel)
                .where(ProductModel.category_slug == category_slug)
                .order_by(ProductModel.id)
                .limit(limit)
                .offset(offset)
            )
            rows = result.scalars().all()
        return [
            Product(
                id=row.id,
                category_slug=row.category_slug,
                title=row.title,
                description=row.description,
                price_stars=row.price_stars,
                photo_url=row.photo_url,
            )
            for row in rows
        ]

    async def get_product(self, product_id: int) -> Product | None:
        async with self.session_factory() as session:
            row = await session.get(ProductModel, product_id)
        if row is None:
            return None
        return Product(
            id=row.id,
            category_slug=row.category_slug,
            title=row.title,
            description=row.description,
            price_stars=row.price_stars,
            photo_url=row.photo_url,
        )

    async def add_to_cart(self, user_id: int, product_id: int, quantity: int = 1) -> None:
        async with self.session_factory() as session:
            existing = await session.get(CartItemModel, {"user_id": user_id, "product_id": product_id})
            if existing is None:
                session.add(CartItemModel(user_id=user_id, product_id=product_id, quantity=max(1, quantity)))
            else:
                existing.quantity += quantity
            await session.commit()

    async def set_cart_quantity(self, user_id: int, product_id: int, quantity: int) -> int:
        async with self.session_factory() as session:
            existing = await session.get(CartItemModel, {"user_id": user_id, "product_id": product_id})
            if existing is None:
                return 0
            if quantity <= 0:
                await session.delete(existing)
                await session.commit()
                return 0
            existing.quantity = quantity
            await session.commit()
            return existing.quantity

    async def remove_from_cart(self, user_id: int, product_id: int) -> None:
        async with self.session_factory() as session:
            existing = await session.get(CartItemModel, {"user_id": user_id, "product_id": product_id})
            if existing is not None:
                await session.delete(existing)
                await session.commit()

    async def clear_cart(self, user_id: int) -> None:
        async with self.session_factory() as session:
            await session.execute(delete(CartItemModel).where(CartItemModel.user_id == user_id))
            await session.commit()

    async def get_cart(self, user_id: int) -> CartSnapshot:
        async with self.session_factory() as session:
            result = await session.execute(
                select(
                    ProductModel.id,
                    ProductModel.title,
                    ProductModel.price_stars,
                    CartItemModel.quantity,
                )
                .join(CartItemModel, CartItemModel.product_id == ProductModel.id)
                .where(CartItemModel.user_id == user_id)
                .order_by(ProductModel.id)
            )
            rows = result.all()
        items = [
            CartItem(
                product_id=row.id,
                title=row.title,
                unit_price_stars=row.price_stars,
                quantity=row.quantity,
            )
            for row in rows
        ]
        return CartSnapshot(items=items)

    async def get_cart_items_for_order(self, user_id: int) -> list[dict[str, Any]]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(
                    ProductModel.id,
                    ProductModel.title,
                    ProductModel.price_stars,
                    ProductModel.photo_url,
                    CartItemModel.quantity,
                )
                .join(CartItemModel, CartItemModel.product_id == ProductModel.id)
                .where(CartItemModel.user_id == user_id)
                .order_by(ProductModel.id)
            )
            rows = result.all()
        return [
            {
                "product_id": row.id,
                "title": row.title,
                "unit_price_stars": row.price_stars,
                "photo_url": row.photo_url,
                "quantity": row.quantity,
            }
            for row in rows
        ]

    async def create_order(
        self,
        order_id: str,
        user_id: int,
        currency: str,
        total_stars: int,
        title: str,
        description: str,
        photo_url: str,
        items: list[dict[str, Any]],
    ) -> None:
        async with self.session_factory() as session:
            session.add(
                OrderModel(
                    order_id=order_id,
                    user_id=user_id,
                    currency=currency,
                    total_stars=total_stars,
                    status=ORDER_STATUS_AWAITING_PAYMENT,
                    title=title,
                    description=description,
                    photo_url=photo_url,
                )
            )
            session.add_all(
                OrderItemModel(
                    order_id=order_id,
                    product_id=item["product_id"],
                    title=item["title"],
                    unit_price_stars=item["unit_price_stars"],
                    quantity=item["quantity"],
                )
                for item in items
            )
            await session.commit()

    async def get_order(self, order_id: str) -> OrderRecord | None:
        async with self.session_factory() as session:
            row = await session.get(OrderModel, order_id)
        if row is None:
            return None
        return OrderRecord(
            order_id=row.order_id,
            user_id=row.user_id,
            total_stars=row.total_stars,
            status=row.status,
            title=row.title,
            description=row.description,
            photo_url=row.photo_url,
            created_at=row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at),
        )

    async def mark_order_paid(
        self,
        order_id: str,
        telegram_payment_charge_id: str,
        provider_payment_charge_id: str,
    ) -> None:
        now = datetime.now(timezone.utc)
        async with self.session_factory() as session:
            order = await session.get(OrderModel, order_id)
            if order is None:
                return
            order.status = ORDER_STATUS_PENDING
            order.telegram_payment_charge_id = telegram_payment_charge_id
            order.provider_payment_charge_id = provider_payment_charge_id
            order.updated_at = now
            await session.execute(delete(CartItemModel).where(CartItemModel.user_id == order.user_id))
            await session.commit()

    async def list_pending_orders(self, limit: int = 20) -> list[AdminOrderSummary]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(OrderModel, UserModel)
                .join(UserModel, UserModel.user_id == OrderModel.user_id)
                .where(OrderModel.status == ORDER_STATUS_PENDING)
                .order_by(OrderModel.created_at.asc())
                .limit(limit)
            )
            rows = result.all()
            summaries: list[AdminOrderSummary] = []
            for order, user in rows:
                items_result = await session.execute(
                    select(OrderItemModel).where(OrderItemModel.order_id == order.order_id).order_by(OrderItemModel.product_id)
                )
                items = [
                    OrderItemRecord(
                        product_id=item.product_id,
                        title=item.title,
                        unit_price_stars=item.unit_price_stars,
                        quantity=item.quantity,
                    )
                    for item in items_result.scalars().all()
                ]
                summaries.append(
                    AdminOrderSummary(
                        order_id=order.order_id,
                        user_id=order.user_id,
                        username=user.username,
                        full_name=user.full_name,
                        total_stars=order.total_stars,
                        status=order.status,
                        created_at=order.created_at.isoformat()
                        if hasattr(order.created_at, "isoformat")
                        else str(order.created_at),
                        items=items,
                    )
                )
        return summaries

    async def mark_order_shipped(self, order_id: str) -> bool:
        now = datetime.now(timezone.utc)
        async with self.session_factory() as session:
            order = await session.get(OrderModel, order_id)
            if order is None or order.status != ORDER_STATUS_PENDING:
                return False
            order.status = ORDER_STATUS_SHIPPED
            order.updated_at = now
            await session.commit()
            return True

    async def create_support_request(self, user_id: int, request_type: str, message_text: str) -> int:
        async with self.session_factory() as session:
            request = SupportRequestModel(
                user_id=user_id,
                request_type=request_type,
                message_text=message_text,
                status="open",
            )
            session.add(request)
            await session.commit()
            await session.refresh(request)
            return int(request.id)

    async def get_support_request(self, request_id: int) -> SupportRequestRecord | None:
        async with self.session_factory() as session:
            row = await session.get(SupportRequestModel, request_id)
        if row is None:
            return None
        return SupportRequestRecord(
            request_id=row.id,
            user_id=row.user_id,
            request_type=row.request_type,
            message_text=row.message_text,
            status=row.status,
        )

    async def mark_support_request_answered(self, request_id: int) -> None:
        now = datetime.now(timezone.utc)
        async with self.session_factory() as session:
            row = await session.get(SupportRequestModel, request_id)
            if row is not None:
                row.status = "answered"
                row.answered_at = now
                await session.commit()

    async def set_dialog_state(self, user_id: int, state: str, payload: str = "") -> None:
        now = datetime.now(timezone.utc)
        async with self.session_factory() as session:
            dialog = await session.get(UserDialogModel, user_id)
            if dialog is None:
                session.add(UserDialogModel(user_id=user_id, state=state, payload=payload))
            else:
                dialog.state = state
                dialog.payload = payload
                dialog.updated_at = now
            await session.commit()

    async def get_dialog_state(self, user_id: int) -> DialogState:
        async with self.session_factory() as session:
            row = await session.get(UserDialogModel, user_id)
        if row is None:
            return DialogState(state=DIALOG_NONE, payload="")
        return DialogState(state=row.state, payload=row.payload)

    async def clear_dialog_state(self, user_id: int) -> None:
        await self.set_dialog_state(user_id, DIALOG_NONE, "")
