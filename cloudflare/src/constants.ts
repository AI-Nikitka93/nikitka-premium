export const BUTTON_CATALOG = "🧥 Каталог";
export const BUTTON_CART = "🛒 Корзина";
export const BUTTON_CONTACT = "👤 Менеджер";
export const BUTTON_HELP = "❓ Помощь";
export const BUTTON_AI_HELP = "🤖 AI-менеджер";
export const BUTTON_CANCEL = "✖️ Отмена";
export const BUTTON_SEARCH = "🔎 Поиск";
export const BUTTON_FAVORITES = "❤️ Избранное";
export const BUTTON_APP = "✨ Открыть витрину";

export const DIALOG_NONE = "none";
export const DIALOG_MANAGER = "manager";
export const DIALOG_PAYMENT_SUPPORT = "payment_support";
export const DIALOG_ADMIN_REPLY = "admin_reply";
export const DIALOG_SEARCH = "search";
export const DIALOG_AI_HELP = "ai_help";

export const ORDER_STATUS_AWAITING_PAYMENT = "awaiting_payment";
export const ORDER_STATUS_PENDING = "pending";
export const ORDER_STATUS_SHIPPED = "shipped";

export const WEBHOOK_PATH = "/telegram/webhook";

export const SEED_CATEGORIES = [
  { slug: "tshirts", title: "Футболки" },
  { slug: "hoodies", title: "Худи" },
  { slug: "jeans", title: "Джинсы" }
] as const;

export const SEED_PRODUCTS = [
  {
    category_slug: "tshirts",
    title: "Silk Touch Tee",
    description: "Плотный премиальный хлопок, ровная посадка и чистая фактура для базового образа.",
    price_stars: 249,
    old_price_stars: 299,
    photo_url: "https://placehold.co/1200x1600/png?text=Silk+Touch+Tee",
    sku: "TEE-001",
    badge: "Bestseller",
    stock_qty: 12,
    is_active: 1,
    search_text: "silk touch tee футболка белая хлопок premium bestseller"
  },
  {
    category_slug: "tshirts",
    title: "Monogram Tee",
    description: "Лаконичная футболка с чистым кроем и мягкой обработкой швов под городской гардероб.",
    price_stars: 279,
    old_price_stars: null,
    photo_url: "https://placehold.co/1200x1600/png?text=Monogram+Tee",
    sku: "TEE-002",
    badge: "New",
    stock_qty: 8,
    is_active: 1,
    search_text: "monogram tee футболка черная минимализм new"
  },
  {
    category_slug: "hoodies",
    title: "Tailored Hoodie",
    description: "Плотное футер-полотно, капюшон держит форму, посадка relaxed premium.",
    price_stars: 389,
    old_price_stars: 449,
    photo_url: "https://placehold.co/1200x1600/png?text=Tailored+Hoodie",
    sku: "HD-001",
    badge: "Limited",
    stock_qty: 6,
    is_active: 1,
    search_text: "tailored hoodie худи серый premium limited"
  },
  {
    category_slug: "hoodies",
    title: "Studio Zip Hoodie",
    description: "Минималистичный худи на молнии для layered-образов и ежедневного wear.",
    price_stars: 419,
    old_price_stars: null,
    photo_url: "https://placehold.co/1200x1600/png?text=Studio+Zip+Hoodie",
    sku: "HD-002",
    badge: "Core",
    stock_qty: 10,
    is_active: 1,
    search_text: "studio zip hoodie худи на молнии графит core"
  },
  {
    category_slug: "jeans",
    title: "Raw Indigo Jeans",
    description: "Прямой силуэт, плотный деним и глубокий оттенок индиго.",
    price_stars: 499,
    old_price_stars: 549,
    photo_url: "https://placehold.co/1200x1600/png?text=Raw+Indigo+Jeans",
    sku: "JN-001",
    badge: "Archive",
    stock_qty: 5,
    is_active: 1,
    search_text: "raw indigo jeans джинсы темный деним archive"
  },
  {
    category_slug: "jeans",
    title: "Modern Straight Jeans",
    description: "Чистая линия, комфортная посадка и универсальный темно-серый wash.",
    price_stars: 529,
    old_price_stars: null,
    photo_url: "https://placehold.co/1200x1600/png?text=Modern+Straight+Jeans",
    sku: "JN-002",
    badge: "Premium",
    stock_qty: 9,
    is_active: 1,
    search_text: "modern straight jeans джинсы серые premium straight"
  }
] as const;
