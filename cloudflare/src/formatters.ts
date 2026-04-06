import {
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_SHIPPED
} from "./constants";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fullName(user: { first_name?: string; last_name?: string }): string {
  const parts = [user.first_name ?? "", user.last_name ?? ""].map((part) => part.trim()).filter(Boolean);
  return parts.join(" ") || "Покупатель";
}

function adminSignature(adminHandle?: string): string {
  return adminHandle?.trim() ? `\n\nАдмин: ${escapeHtml(adminHandle.trim())}` : "";
}

export function welcomeText(botTitle: string, adminHandle?: string): string {
  return (
    `<b>${escapeHtml(botTitle)}</b>\n` +
    "Тестовая витрина магазина Nikitka AI в Telegram.\n\n" +
    "Реального магазина и реальных товаров здесь нет.\n\n" +
    "Открыть витрину можно кнопкой ниже или через menu button в профиле бота. Вопросы по товарам и размерам: «🤖 AI-менеджер»." +
    adminSignature(adminHandle)
  );
}

export function helpText(adminHandle?: string): string {
  return (
    "Важно: это тестовый проект. Реальных товаров и реального магазина здесь нет.\n\n" +
    "Доступные действия:\n" +
    "• ✨ Открыть витрину — открыть Telegram Mini App магазина Nikitka AI\n" +
    "• 🤖 AI-менеджер — вопросы по товарам, размерам и стилю\n" +
    "• 🧥 Каталог — открыть витрину\n" +
    "• 🔎 Поиск — найти товар по названию или ключевому слову\n" +
    "• ❤️ Избранное — сохранить понравившиеся позиции\n" +
    "• 🛒 Корзина — посмотреть выбранные товары\n" +
    "• 👤 Менеджер — оставить сообщение\n" +
    "• /paysupport — вопрос по оплате\n" +
    "• /cancel — выйти из режима ввода\n\n" +
    "Если вместо кнопки вы напишете текст, бот мягко подскажет следующий шаг." +
    adminSignature(adminHandle)
  );
}

export function productCaption(product: {
  title: string;
  description: string;
  priceStars: number;
  oldPriceStars: number | null;
  categoryTitle: string;
  page: number;
  totalPages: number;
  sku: string;
  badge: string | null;
  stockQty: number;
  availableSizes: string[];
}): string {
  const priceBlock = product.oldPriceStars && product.oldPriceStars > product.priceStars
    ? `Цена: <b>${product.priceStars} Stars</b>  <s>${product.oldPriceStars} Stars</s>`
    : `Цена: <b>${product.priceStars} Stars</b>`;
  const stockLabel = product.stockQty > 0 ? `В наличии: <b>${product.stockQty} шт</b>` : "Статус: <b>нет в наличии</b>";
  const badgeBlock = product.badge ? `Дроп: <b>${escapeHtml(product.badge)}</b>\n` : "";
  const sizesBlock = product.availableSizes.length
    ? `Размеры: <b>${escapeHtml(product.availableSizes.join(", "))}</b>\n`
    : "";

  return (
    `<b>${escapeHtml(product.title)}</b>\n` +
    `SKU: <code>${escapeHtml(product.sku)}</code>\n` +
    `Категория: ${escapeHtml(product.categoryTitle)}\n` +
    badgeBlock +
    sizesBlock +
    `${priceBlock}\n` +
    `${stockLabel}\n\n` +
    `${escapeHtml(product.description)}\n\n` +
    `Страница ${product.page + 1} из ${product.totalPages}`
  );
}

export function cartText(items: Array<{
  title: string;
  sizeLabel: string;
  quantity: number;
  unitPriceStars: number;
  subtotalStars: number;
}>, totalStars: number): string {
  if (items.length === 0) {
    return "В корзине пока пусто.\n\nОткройте каталог, найдите товар через поиск или добавьте позиции в избранное.";
  }

  const lines = ["<b>Ваша корзина</b>", ""];
  for (const item of items) {
    lines.push(
      `• ${escapeHtml(item.title)}${item.sizeLabel ? ` [${escapeHtml(item.sizeLabel)}]` : ""} x${item.quantity} — ${item.subtotalStars} Stars (${item.unitPriceStars} за штуку)`
    );
  }
  lines.push("", `Итого: <b>${totalStars} Stars</b>`);
  return lines.join("\n");
}

export function adminOrderText(order: {
  orderId: string;
  status: string;
  fullName: string;
  username: string | null;
  userId: number;
  totalStars: number;
  createdAt: string;
  items: Array<{ title: string; quantity: number; subtotalStars: number }>;
}): string {
  const username = order.username ? `@${order.username}` : "без username";
  const itemsBlock = order.items
    .map((item) => `• ${escapeHtml(item.title)} x${item.quantity} — ${item.subtotalStars} Stars`)
    .join("\n");
  return (
    `<b>Заказ ${escapeHtml(order.orderId)}</b>\n` +
    `Статус: <b>${escapeHtml(statusLabel(order.status))}</b>\n` +
    `Клиент: ${escapeHtml(order.fullName)} (${escapeHtml(username)})\n` +
    `User ID: <code>${order.userId}</code>\n` +
    `Создан: ${escapeHtml(order.createdAt)}\n` +
    `Сумма: <b>${order.totalStars} Stars</b>\n\n` +
    itemsBlock
  );
}

export function supportAlertText(params: {
  requestId: number;
  requestType: string;
  fullName: string;
  username: string | null;
  userId: number;
  messageText: string;
}): string {
  const requestLabel = params.requestType === "payment_support" ? "Платежный вопрос" : "Запрос менеджеру";
  const username = params.username ? `@${params.username}` : "без username";
  return (
    `<b>${requestLabel}</b>\n` +
    `Request ID: <b>#${params.requestId}</b>\n` +
    `Клиент: ${escapeHtml(params.fullName)}\n` +
    `Username: ${escapeHtml(username)}\n` +
    `User ID: <code>${params.userId}</code>\n\n` +
    `Сообщение:\n${escapeHtml(params.messageText)}`
  );
}

export function adminNewOrderText(order: {
  orderId: string;
  status: string;
  fullName: string;
  username: string | null;
  userId: number;
  totalStars: number;
  createdAt: string;
  items: Array<{ title: string; quantity: number; subtotalStars: number }>;
}): string {
  return `<b>Новый оплаченный заказ</b>\n\n${adminOrderText(order)}`;
}

export function supportUnavailableText(adminHandle?: string): string {
  return (
    "Запрос сохранен, но менеджер сейчас недоступен в административном чате.\n" +
    "Попробуйте позже или свяжитесь с магазином вручную." +
    adminSignature(adminHandle)
  );
}

export function searchPromptText(): string {
  return "Напишите название товара, артикул или ключевое слово. Например: hoodie, denim, tee, premium.";
}

export function searchResultsText(query: string, count: number): string {
  return count > 0
    ? `<b>Результаты поиска</b>\nЗапрос: <code>${escapeHtml(query)}</code>\nНайдено: <b>${count}</b>`
    : `<b>Ничего не найдено</b>\nЗапрос: <code>${escapeHtml(query)}</code>\nПопробуйте другое слово или откройте каталог.`;
}

export function favoritesText(count: number): string {
  return count > 0
    ? `<b>Избранное</b>\nСохранено товаров: <b>${count}</b>`
    : "В избранном пока пусто.\n\nОткройте каталог и добавьте понравившиеся товары кнопкой «В избранное».";
}

export function adminCatalogText(product: {
  title: string;
  sku: string;
  categoryTitle: string;
  priceStars: number;
  oldPriceStars: number | null;
  stockQty: number;
  isActive: boolean;
  badge: string | null;
  page: number;
  totalPages: number;
}): string {
  const saleBlock =
    product.oldPriceStars && product.oldPriceStars > product.priceStars
      ? `\nСтарая цена: <s>${product.oldPriceStars} Stars</s>`
      : "";
  const badgeBlock = product.badge ? `\nБейдж: <b>${escapeHtml(product.badge)}</b>` : "";
  return (
    `<b>Управление товаром</b>\n` +
    `Название: <b>${escapeHtml(product.title)}</b>\n` +
    `SKU: <code>${escapeHtml(product.sku)}</code>\n` +
    `Категория: ${escapeHtml(product.categoryTitle)}\n` +
    `Цена: <b>${product.priceStars} Stars</b>${saleBlock}${badgeBlock}\n` +
    `Остаток: <b>${product.stockQty}</b>\n` +
    `Статус: <b>${product.isActive ? "показан" : "скрыт"}</b>\n\n` +
    `Карточка ${product.page + 1} из ${product.totalPages}`
  );
}

export function auditEventsText(events: Array<{
  eventType: string;
  userId: number | null;
  entityId: string | null;
  createdAt: string;
}>): string {
  if (events.length === 0) {
    return "Событий пока нет.";
  }
  return [
    "<b>Последние события</b>",
    "",
    ...events.map((event) =>
      `• ${escapeHtml(event.eventType)} | user=${event.userId ?? 0} | entity=${escapeHtml(event.entityId ?? "-")} | ${escapeHtml(event.createdAt)}`
    )
  ].join("\n");
}

export function statusLabel(status: string): string {
  if (status === ORDER_STATUS_AWAITING_PAYMENT) return "ожидает оплаты";
  if (status === ORDER_STATUS_PENDING) return "ожидает отправки";
  if (status === ORDER_STATUS_SHIPPED) return "отправлен";
  return status;
}
