BUTTON_CATALOG = "Каталог"
BUTTON_CART = "Корзина"
BUTTON_CONTACT = "Связаться с менеджером"
BUTTON_HELP = "Помощь"

DIALOG_NONE = "none"
DIALOG_MANAGER = "manager"
DIALOG_PAYMENT_SUPPORT = "payment_support"
DIALOG_ADMIN_REPLY = "admin_reply"

NOOP_CALLBACK = "noop"
ORDER_STATUS_AWAITING_PAYMENT = "awaiting_payment"
ORDER_STATUS_PENDING = "pending"
ORDER_STATUS_SHIPPED = "shipped"

DEFAULT_WEBHOOK_PATH = "/api/telegram/webhook"

SEED_CATEGORIES = [
    {"slug": "tshirts", "title": "Футболки"},
    {"slug": "hoodies", "title": "Худи"},
    {"slug": "jeans", "title": "Джинсы"},
]

SEED_PRODUCTS = [
    {
        "category_slug": "tshirts",
        "title": "Silk Touch Tee",
        "description": "Плотный премиальный хлопок, ровная посадка, акцент на фактуру.",
        "price_stars": 249,
        "photo_url": "https://placehold.co/1200x1600/png?text=Silk+Touch+Tee",
    },
    {
        "category_slug": "tshirts",
        "title": "Monogram Tee",
        "description": "Лаконичная футболка с чистым кроем и мягкой обработкой швов.",
        "price_stars": 279,
        "photo_url": "https://placehold.co/1200x1600/png?text=Monogram+Tee",
    },
    {
        "category_slug": "hoodies",
        "title": "Tailored Hoodie",
        "description": "Плотное футер-полотно, капюшон держит форму, посадка relaxed premium.",
        "price_stars": 389,
        "photo_url": "https://placehold.co/1200x1600/png?text=Tailored+Hoodie",
    },
    {
        "category_slug": "hoodies",
        "title": "Studio Zip Hoodie",
        "description": "Минималистичный худи на молнии для layered-образов и ежедневного wear.",
        "price_stars": 419,
        "photo_url": "https://placehold.co/1200x1600/png?text=Studio+Zip+Hoodie",
    },
    {
        "category_slug": "jeans",
        "title": "Raw Indigo Jeans",
        "description": "Прямой силуэт, плотный деним и глубокий оттенок индиго.",
        "price_stars": 499,
        "photo_url": "https://placehold.co/1200x1600/png?text=Raw+Indigo+Jeans",
    },
    {
        "category_slug": "jeans",
        "title": "Modern Straight Jeans",
        "description": "Чистая линия, комфортная посадка и универсальный темно-серый wash.",
        "price_stars": 529,
        "photo_url": "https://placehold.co/1200x1600/png?text=Modern+Straight+Jeans",
    },
]
