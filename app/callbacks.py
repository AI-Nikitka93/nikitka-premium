from aiogram.filters.callback_data import CallbackData


class OpenCategoryCallback(CallbackData, prefix="oc"):
    slug: str


class BrowseCallback(CallbackData, prefix="br"):
    slug: str
    page: int


class AddToCartCallback(CallbackData, prefix="ac"):
    product_id: int
    slug: str
    page: int


class RemoveFromCartCallback(CallbackData, prefix="rc"):
    product_id: int


class AdjustCartQuantityCallback(CallbackData, prefix="aq"):
    product_id: int
    delta: int


class ClearCartCallback(CallbackData, prefix="cc"):
    confirm: int


class CheckoutCallback(CallbackData, prefix="co"):
    confirm: int


class MarkOrderShippedCallback(CallbackData, prefix="ship"):
    order_id: str


class ReplySupportCallback(CallbackData, prefix="reply"):
    request_id: int
    user_id: int
