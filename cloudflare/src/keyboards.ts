import {
  BUTTON_APP,
  BUTTON_AI_HELP,
  BUTTON_CANCEL,
  BUTTON_CART,
  BUTTON_CATALOG,
  BUTTON_CONTACT,
  BUTTON_FAVORITES,
  BUTTON_HELP,
  BUTTON_SEARCH
} from "./constants";

type ButtonStyle = "primary" | "success" | "danger";

type InlineButton = {
  text: string;
  callback_data?: string;
  style?: ButtonStyle;
  web_app?: {
    url: string;
  };
};

type KeyboardButton = {
  text: string;
  style?: ButtonStyle;
  web_app?: {
    url: string;
  };
};

function storefrontButton(url?: string, style: ButtonStyle = "primary") {
  if (!url) return null;
  return {
    text: BUTTON_APP,
    web_app: { url },
    style
  } satisfies KeyboardButton;
}

function storefrontInlineButton(url?: string, style: ButtonStyle = "primary") {
  if (!url) return null;
  return {
    text: BUTTON_APP,
    web_app: { url },
    style
  } satisfies InlineButton;
}

export function mainMenuKeyboard(storefrontUrl?: string) {
  const keyboard: KeyboardButton[][] = [];
  const appButton = storefrontButton(storefrontUrl);
  if (appButton) {
    keyboard.push([appButton]);
  }
  keyboard.push(
    [{ text: BUTTON_CATALOG } satisfies KeyboardButton, { text: BUTTON_CART } satisfies KeyboardButton],
    [{ text: BUTTON_SEARCH } satisfies KeyboardButton, { text: BUTTON_FAVORITES } satisfies KeyboardButton],
    [{ text: BUTTON_AI_HELP, style: "primary" } satisfies KeyboardButton, { text: BUTTON_HELP } satisfies KeyboardButton],
    [{ text: BUTTON_CONTACT, style: "primary" } satisfies KeyboardButton]
  );
  return {
    keyboard,
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Откройте витрину или выберите действие"
  };
}

export function aiHelpKeyboard(storefrontUrl?: string) {
  const keyboard: KeyboardButton[][] = [];
  const appButton = storefrontButton(storefrontUrl);
  if (appButton) {
    keyboard.push([appButton]);
  }
  keyboard.push(
    [{ text: BUTTON_CANCEL, style: "danger" } satisfies KeyboardButton],
    [{ text: BUTTON_CATALOG } satisfies KeyboardButton, { text: BUTTON_CART } satisfies KeyboardButton],
    [{ text: BUTTON_SEARCH } satisfies KeyboardButton, { text: BUTTON_FAVORITES } satisfies KeyboardButton],
    [{ text: BUTTON_CONTACT, style: "primary" } satisfies KeyboardButton]
  );
  return {
    keyboard,
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Задайте вопрос AI-менеджеру или выйдите из режима"
  };
}

export function categoriesKeyboard(categories: Array<{ slug: string; title: string }>, storefrontUrl?: string) {
  const rows: InlineButton[][] = categories.map((category) => [
    {
      text: category.title,
      callback_data: `open_category:${category.slug}`
    } satisfies InlineButton
  ]);
  const appButton = storefrontInlineButton(storefrontUrl);
  if (appButton) {
    rows.unshift([appButton]);
  }
  rows.push([
    { text: BUTTON_SEARCH, callback_data: "open_search" },
    { text: BUTTON_FAVORITES, callback_data: "open_favorites" }
  ]);
  rows.push([
    { text: BUTTON_CART, callback_data: "open_cart" },
    { text: BUTTON_CONTACT, callback_data: "open_contact" }
  ]);
  return { inline_keyboard: rows };
}

export function productKeyboard(params: {
  categorySlug: string;
  page: number;
  totalPages: number;
  productId: number;
  cartQuantity: number;
  isFavorite: boolean;
  isAvailable: boolean;
  storefrontUrl?: string;
}) {
  const prevPage = Math.max(params.page - 1, 0);
  const nextPage = Math.min(params.page + 1, params.totalPages - 1);

  const inlineKeyboard: InlineButton[][] = [];
  const appButton = storefrontInlineButton(params.storefrontUrl);
  if (appButton) {
    inlineKeyboard.push([appButton]);
  }
  inlineKeyboard.push(
    [
      {
        text: params.isAvailable ? "🛒 В корзину" : "⛔ Нет в наличии",
        callback_data: params.isAvailable
          ? `add_to_cart:${params.productId}:${params.categorySlug}:${params.page}`
          : "noop",
        style: params.isAvailable ? "success" : undefined
      }
    ],
    [
      {
        text: params.isFavorite ? "💔 Убрать из избранного" : "❤️ В избранное",
        callback_data: `toggle_favorite:${params.productId}:${params.categorySlug}:${params.page}`,
        style: "primary"
      }
    ],
    [
      {
        text: "⬅️",
        callback_data: params.page === 0 ? "noop" : `browse:${params.categorySlug}:${prevPage}`
      },
      {
        text: `${params.page + 1}/${params.totalPages}`,
        callback_data: "noop"
      },
      {
        text: "➡️",
        callback_data:
          params.page === params.totalPages - 1 ? "noop" : `browse:${params.categorySlug}:${nextPage}`
      }
    ],
    [
      {
        text: `🛒 Корзина (${params.cartQuantity})`,
        callback_data: "open_cart"
      },
      {
        text: "🧥 Категории",
        callback_data: "open_catalog"
      }
    ],
    [
      {
        text: BUTTON_SEARCH,
        callback_data: "open_search"
      },
      {
        text: BUTTON_FAVORITES,
        callback_data: "open_favorites"
      }
    ],
    [
      {
        text: BUTTON_CONTACT,
        callback_data: "open_contact",
        style: "primary"
      }
    ]
  );

  return {
    inline_keyboard: inlineKeyboard
  };
}

export function searchResultsKeyboard(
  items: Array<{ productId: number; title: string; priceStars: number }>,
  storefrontUrl?: string
) {
  const rows: InlineButton[][] = items.map((item) => [
    {
      text: `${item.title} • ${item.priceStars} Stars`,
      callback_data: `show_product:${item.productId}`
    } satisfies InlineButton
  ]);
  const appButton = storefrontInlineButton(storefrontUrl);
  if (appButton) {
    rows.unshift([appButton]);
  }
  rows.push([
    { text: BUTTON_CATALOG, callback_data: "open_catalog" },
    { text: BUTTON_FAVORITES, callback_data: "open_favorites" }
  ]);
  return { inline_keyboard: rows };
}

export function favoritesKeyboard(
  items: Array<{ productId: number; title: string; priceStars: number }>,
  storefrontUrl?: string
) {
  const rows: InlineButton[][] = items.map((item) => [
    {
      text: `${item.title} • ${item.priceStars} Stars`,
      callback_data: `show_product:${item.productId}`
    } satisfies InlineButton
  ]);
  const appButton = storefrontInlineButton(storefrontUrl);
  if (appButton) {
    rows.unshift([appButton]);
  }
  rows.push([
    { text: BUTTON_CATALOG, callback_data: "open_catalog" },
    { text: BUTTON_SEARCH, callback_data: "open_search" }
  ]);
  return { inline_keyboard: rows };
}

export function aiSuggestionsKeyboard(
  items: Array<{ productId: number; title: string; priceStars: number }>,
  storefrontUrl?: string
) {
  const rows: InlineButton[][] = items.slice(0, 4).map((item) => [
    {
      text: `${item.title} • ${item.priceStars} Stars`,
      callback_data: `show_product:${item.productId}`
    } satisfies InlineButton
  ]);
  const appButton = storefrontInlineButton(storefrontUrl, "success");
  if (appButton) {
    rows.push([appButton]);
  }
  return { inline_keyboard: rows };
}

export function cartKeyboard(
  items: Array<{ productId: number; title: string; sizeLabel: string; quantity: number }>,
  allowCheckout: boolean,
  storefrontUrl?: string
) {
  const inlineKeyboard: InlineButton[][] = [];
  const appButton = storefrontInlineButton(storefrontUrl);
  if (appButton) {
    inlineKeyboard.push([appButton]);
  }
  for (const item of items) {
    const encodedSize = encodeURIComponent(item.sizeLabel || "");
    inlineKeyboard.push([
      { text: "-", callback_data: `cart_qty:${item.productId}:${encodedSize}:-1` },
      { text: `${item.quantity} шт${item.sizeLabel ? ` • ${item.sizeLabel}` : ""}`, callback_data: "noop" },
      { text: "+", callback_data: `cart_qty:${item.productId}:${encodedSize}:1` }
    ]);
    inlineKeyboard.push([
      { text: `🗑 Удалить ${item.title}${item.sizeLabel ? ` • ${item.sizeLabel}` : ""}`, callback_data: `cart_remove:${item.productId}:${encodedSize}` }
    ]);
  }

  if (allowCheckout) {
    inlineKeyboard.push([{ text: "⭐ Оплатить через Stars", callback_data: "checkout", style: "success" }]);
    inlineKeyboard.push([{ text: "🗑 Очистить корзину", callback_data: "clear_cart", style: "danger" }]);
  }

  inlineKeyboard.push([
    { text: BUTTON_CATALOG, callback_data: "open_catalog" },
    { text: BUTTON_FAVORITES, callback_data: "open_favorites" }
  ]);
  inlineKeyboard.push([
    { text: BUTTON_SEARCH, callback_data: "open_search" },
    { text: "👤 Менеджер", callback_data: "open_contact" }
  ]);

  return { inline_keyboard: inlineKeyboard };
}

export function adminMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "Необработанные заказы", callback_data: "admin_pending_orders" }],
      [{ text: "Управление каталогом", callback_data: "admin_catalog" }],
      [{ text: "Последние события", callback_data: "admin_audit" }]
    ]
  };
}

export function orderActionsKeyboard(orderId: string) {
  return {
    inline_keyboard: [[{ text: "Отметить как отправленный", callback_data: `ship_order:${orderId}` }]]
  };
}

export function supportReplyKeyboard(requestId: number, userId: number) {
  return {
    inline_keyboard: [[{ text: "Ответить", callback_data: `reply_support:${requestId}:${userId}` }]]
  };
}

export function adminCatalogKeyboard(params: {
  productId: number;
  page: number;
  totalPages: number;
  isActive: boolean;
  stockQty: number;
}) {
  const prevPage = Math.max(params.page - 1, 0);
  const nextPage = Math.min(params.page + 1, params.totalPages - 1);

  return {
    inline_keyboard: [
      [
        { text: "-", callback_data: `admin_stock:${params.productId}:-1:${params.page}` },
        { text: `Остаток ${params.stockQty}`, callback_data: "noop" },
        { text: "+", callback_data: `admin_stock:${params.productId}:1:${params.page}` }
      ],
      [
        {
          text: params.isActive ? "Скрыть товар" : "Показать товар",
          callback_data: `admin_toggle:${params.productId}:${params.page}`
        }
      ],
      [
        { text: "⬅️", callback_data: params.page === 0 ? "noop" : `admin_catalog_page:${prevPage}` },
        { text: `${params.page + 1}/${params.totalPages}`, callback_data: "noop" },
        {
          text: "➡️",
          callback_data: params.page === params.totalPages - 1 ? "noop" : `admin_catalog_page:${nextPage}`
        }
      ]
    ]
  };
}
