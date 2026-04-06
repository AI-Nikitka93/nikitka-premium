from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class Category:
    slug: str
    title: str


@dataclass(slots=True)
class Product:
    id: int
    category_slug: str
    title: str
    description: str
    price_stars: int
    photo_url: str


@dataclass(slots=True)
class ProductPage:
    product: Product
    page: int
    total_pages: int
    category_title: str


@dataclass(slots=True)
class CartItem:
    product_id: int
    title: str
    unit_price_stars: int
    quantity: int

    @property
    def subtotal_stars(self) -> int:
        return self.unit_price_stars * self.quantity


@dataclass(slots=True)
class CartSnapshot:
    items: list[CartItem]

    @property
    def total_stars(self) -> int:
        return sum(item.subtotal_stars for item in self.items)

    @property
    def total_quantity(self) -> int:
        return sum(item.quantity for item in self.items)

    @property
    def is_empty(self) -> bool:
        return not self.items


@dataclass(slots=True)
class OrderDraft:
    order_id: str
    total_stars: int
    title: str
    description: str
    photo_url: str


@dataclass(slots=True)
class OrderRecord:
    order_id: str
    user_id: int
    total_stars: int
    status: str
    title: str = ""
    description: str = ""
    photo_url: str = ""
    created_at: str = ""


@dataclass(slots=True)
class OrderItemRecord:
    product_id: int
    title: str
    unit_price_stars: int
    quantity: int

    @property
    def subtotal_stars(self) -> int:
        return self.unit_price_stars * self.quantity


@dataclass(slots=True)
class AdminOrderSummary:
    order_id: str
    user_id: int
    username: str | None
    full_name: str
    total_stars: int
    status: str
    created_at: str
    items: list[OrderItemRecord]


@dataclass(slots=True)
class SupportRequestRecord:
    request_id: int
    user_id: int
    request_type: str
    message_text: str
    status: str


@dataclass(slots=True)
class DialogState:
    state: str
    payload: str
