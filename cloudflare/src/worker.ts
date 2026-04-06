import { answerStoreAssistant, type AssistantCatalogItem, type AssistantTurn } from "./assistant";
import {
  addToCart,
  clearCart,
  clearDialogState,
  countRecentAuditEvents,
  createOrderFromCart,
  createSupportRequest,
  ensureSchema,
  ensureUser,
  Env,
  findCategoryByText,
  getAdminCatalogPage,
  getCartSnapshot,
  getDialogState,
  getOrder,
  getPendingOrderById,
  getProductPage,
  getProductPageById,
  getStorefrontCounts,
  getSupportRequest,
  isFavorite,
  listCategories,
  listFavoriteProducts,
  listPendingOrders,
  listRecentAuditEvents,
  listStorefrontProducts,
  markOrderPaid,
  markOrderShipped,
  markSupportRequestAnswered,
  removeFromCart,
  searchProducts,
  setCartQuantity,
  setDialogState
  ,
  toggleFavorite,
  toggleProductActive,
  updateProductStock,
  writeAuditEvent
} from "./db";
import {
  BUTTON_AI_HELP,
  BUTTON_CANCEL,
  BUTTON_CART,
  BUTTON_CATALOG,
  BUTTON_CONTACT,
  BUTTON_FAVORITES,
  BUTTON_HELP,
  BUTTON_SEARCH,
  DIALOG_ADMIN_REPLY,
  DIALOG_AI_HELP,
  DIALOG_MANAGER,
  DIALOG_NONE,
  DIALOG_PAYMENT_SUPPORT,
  DIALOG_SEARCH,
  ORDER_STATUS_AWAITING_PAYMENT,
  WEBHOOK_PATH
} from "./constants";
import {
  aiHelpKeyboard,
  adminCatalogKeyboard,
  adminMenuKeyboard,
  aiSuggestionsKeyboard,
  cartKeyboard,
  categoriesKeyboard,
  favoritesKeyboard,
  mainMenuKeyboard,
  orderActionsKeyboard,
  productKeyboard,
  searchResultsKeyboard,
  supportReplyKeyboard
} from "./keyboards";
import {
  adminCatalogText,
  adminNewOrderText,
  adminOrderText,
  auditEventsText,
  cartText,
  favoritesText,
  fullName,
  helpText,
  productCaption,
  searchPromptText,
  searchResultsText,
  supportAlertText,
  supportUnavailableText,
  welcomeText
} from "./formatters";
import { authorizeMiniAppRequest, renderMiniAppHtml } from "./miniapp";
import { TelegramApi } from "./telegram";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramChat = {
  id: number;
};

type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  successful_payment?: {
    currency: string;
    total_amount: number;
    invoice_payload: string;
    telegram_payment_charge_id: string;
    provider_payment_charge_id: string;
  };
};

type CallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};

type PreCheckoutQuery = {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
};

type Update = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: CallbackQuery;
  pre_checkout_query?: PreCheckoutQuery;
};

type NotificationJob = {
  kind: "admin_message";
  text: string;
  parse_mode?: "HTML";
  reply_markup?: unknown;
};

function logStructured(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...data }));
}

async function readJson<T>(request: Request): Promise<T> {
  return request.json<T>();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function adminChatId(env: Env): number {
  return Number(env.ADMIN_CHAT_ID ?? "0");
}

function botTitle(env: Env): string {
  return env.BOT_TITLE?.trim() || "NIKITKA PREMIUM";
}

function adminHandle(env: Env): string {
  return env.ADMIN_HANDLE?.trim() || "@ai_nikitka93";
}

function storefrontUrl(env: Env): string | undefined {
  const raw = env.WORKER_PUBLIC_URL?.trim();
  return raw ? `${raw.replace(/\/$/, "")}/app` : undefined;
}

function paymentsCurrency(env: Env): string {
  return env.PAYMENTS_CURRENCY?.trim().toUpperCase() || "XTR";
}

const BOT_AI_LIMIT_WINDOW_MINUTES = 10;
const BOT_AI_LIMIT_REQUESTS = 12;
const MINIAPP_AI_LIMIT_WINDOW_MINUTES = 10;
const MINIAPP_AI_LIMIT_REQUESTS = 6;

async function isAiRateLimited(env: Env, eventType: string, userId: number, limit: number, minutes: number): Promise<boolean> {
  const recent = await countRecentAuditEvents(env, {
    eventType,
    userId,
    minutes
  });
  return recent >= limit;
}

async function buildAssistantCatalogContext(env: Env, userId?: number): Promise<string> {
  const [categories, products] = await Promise.all([
    listCategories(env),
    listStorefrontProducts(env, { userId, limit: 64, offset: 0 })
  ]);

  const categoryMap = new Map(categories.map((category) => [category.slug, category.title]));
  return products
    .map((product) => {
      const sizes = product.availableSizes.length ? product.availableSizes.join("/") : "ONE SIZE";
      const categoryTitle = categoryMap.get(product.categorySlug) || product.categoryTitle;
      return `${product.title} [${categoryTitle}] — ${product.priceStars} Stars, SKU ${product.sku}, размеры ${sizes}, бейдж ${product.badge ?? "none"}`;
    })
    .join("\n");
}

async function buildAssistantCatalogItems(env: Env, userId?: number): Promise<AssistantCatalogItem[]> {
  const products = await listStorefrontProducts(env, { userId, limit: 64, offset: 0 });
  return products.map((product) => ({
    productId: product.productId,
    title: product.title,
    categorySlug: product.categorySlug,
    categoryTitle: product.categoryTitle,
    priceStars: product.priceStars,
    sku: product.sku,
    badge: product.badge,
    availableSizes: product.availableSizes
  }));
}

function extractCommand(text: string): string {
  return text.trim().split(/\s+/, 1)[0].toLowerCase();
}

function extractOrderId(payload: string): string | null {
  return payload.startsWith("order:") ? payload.slice("order:".length) : null;
}

function isCancelText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized === "/cancel" || normalized === BUTTON_CANCEL.toLowerCase();
}

function isBotNavigationText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return [
    "/start",
    "/menu",
    "/help",
    "/aihelp",
    "/catalog",
    "/cart",
    "/search",
    "/favorites",
    "/contact",
    "/paysupport",
    "/admin",
    BUTTON_AI_HELP.toLowerCase(),
    BUTTON_CATALOG.toLowerCase(),
    BUTTON_CART.toLowerCase(),
    BUTTON_SEARCH.toLowerCase(),
    BUTTON_FAVORITES.toLowerCase(),
    BUTTON_CONTACT.toLowerCase(),
    BUTTON_HELP.toLowerCase(),
    "витрина",
    "менеджер",
    "моя корзина",
    "помощь по товарам",
    "общение с ai-менеджером"
  ].includes(normalized);
}

async function notifyAdmin(
  env: Env,
  tg: TelegramApi,
  payload: { text: string; parse_mode?: "HTML"; reply_markup?: unknown }
): Promise<boolean> {
  const chatId = adminChatId(env);
  if (!chatId) {
    return false;
  }
  try {
    if (env.NOTIFY_QUEUE) {
      await env.NOTIFY_QUEUE.send({
        kind: "admin_message",
        text: payload.text,
        parse_mode: payload.parse_mode,
        reply_markup: payload.reply_markup
      } satisfies NotificationJob);
      return true;
    }
    await tg.sendMessage({
      chat_id: chatId,
      text: payload.text,
      parse_mode: payload.parse_mode,
      reply_markup: payload.reply_markup
    });
    return true;
  } catch (error) {
    console.error("Failed to notify admin", error);
    return false;
  }
}

async function processQueue(env: Env, batch: MessageBatch<NotificationJob>): Promise<void> {
  const tg = new TelegramApi(env.BOT_TOKEN);
  for (const message of batch.messages) {
    try {
      if (message.body.kind === "admin_message") {
        const chatId = adminChatId(env);
        if (chatId) {
          await tg.sendMessage({
            chat_id: chatId,
            text: message.body.text,
            parse_mode: message.body.parse_mode,
            reply_markup: message.body.reply_markup
          });
        }
      }
      message.ack();
    } catch (error) {
      console.error("Queue message failed", error);
      message.retry();
    }
  }
}

async function cancelDialogIfNeeded(env: Env, tg: TelegramApi, message: TelegramMessage): Promise<boolean> {
  if (!message.from || !message.text || !isCancelText(message.text)) {
    return false;
  }

  const dialog = await getDialogState(env, message.from.id);
  if (dialog.state === DIALOG_NONE) {
    await tg.sendMessage({
      chat_id: message.chat.id,
      text: "Сейчас нет активного режима ввода.",
      reply_markup: mainMenuKeyboard(storefrontUrl(env))
    });
    return true;
  }

  await clearDialogState(env, message.from.id);
  await tg.sendMessage({
    chat_id: message.chat.id,
    text: "Текущий режим ввода отменен.",
    reply_markup: mainMenuKeyboard(storefrontUrl(env))
  });
  return true;
}

async function sendCatalogSelector(env: Env, tg: TelegramApi, chatId: number) {
  const categories = await listCategories(env);
  await tg.sendMessage({
    chat_id: chatId,
    text: "Выберите категорию, используйте поиск или сохраненные товары.",
    parse_mode: "HTML",
    reply_markup: categoriesKeyboard(categories, storefrontUrl(env))
  });
}

async function sendProductCard(
  env: Env,
  tg: TelegramApi,
  chatId: number,
  userId: number,
  categorySlug: string,
  pageIndex: number
) {
  const page = await getProductPage(env, categorySlug, pageIndex);
  if (!page) {
    await tg.sendMessage({ chat_id: chatId, text: "Категория пока пуста. Откройте другую категорию." });
    return;
  }
  const cart = await getCartSnapshot(env, userId);
  const favorite = await isFavorite(env, userId, page.productId);
  await tg.sendPhoto({
    chat_id: chatId,
    photo: page.photoUrl,
    caption: productCaption(page),
    parse_mode: "HTML",
    reply_markup: productKeyboard({
      categorySlug: page.categorySlug,
      page: page.page,
      totalPages: page.totalPages,
      productId: page.productId,
      cartQuantity: cart.totalQuantity,
      isFavorite: favorite,
      isAvailable: page.isActive && page.stockQty > 0,
      storefrontUrl: storefrontUrl(env)
    })
  });
}

async function sendProductById(env: Env, tg: TelegramApi, chatId: number, userId: number, productId: number) {
  const page = await getProductPageById(env, productId);
  if (!page) {
    await tg.sendMessage({ chat_id: chatId, text: "Товар недоступен или скрыт." });
    return;
  }
  const cart = await getCartSnapshot(env, userId);
  const favorite = await isFavorite(env, userId, page.productId);
  await tg.sendPhoto({
    chat_id: chatId,
    photo: page.photoUrl,
    caption: productCaption(page),
    parse_mode: "HTML",
    reply_markup: productKeyboard({
      categorySlug: page.categorySlug,
      page: page.page,
      totalPages: page.totalPages,
      productId: page.productId,
      cartQuantity: cart.totalQuantity,
      isFavorite: favorite,
      isAvailable: page.isActive && page.stockQty > 0,
      storefrontUrl: storefrontUrl(env)
    })
  });
}

async function editProductCard(
  env: Env,
  tg: TelegramApi,
  callback: CallbackQuery,
  categorySlug: string,
  pageIndex: number
) {
  if (!callback.message) {
    return;
  }
  const page = await getProductPage(env, categorySlug, pageIndex);
  if (!page) {
    await tg.answerCallbackQuery({
      callback_query_id: callback.id,
      text: "Карточка недоступна.",
      show_alert: true
    });
    return;
  }
  const cart = await getCartSnapshot(env, callback.from.id);
  const favorite = await isFavorite(env, callback.from.id, page.productId);
  await tg.editMessageMedia({
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    media: {
      type: "photo",
      media: page.photoUrl,
      caption: productCaption(page),
      parse_mode: "HTML"
    },
    reply_markup: productKeyboard({
      categorySlug: page.categorySlug,
      page: page.page,
      totalPages: page.totalPages,
      productId: page.productId,
      cartQuantity: cart.totalQuantity,
      isFavorite: favorite,
      isAvailable: page.isActive && page.stockQty > 0,
      storefrontUrl: storefrontUrl(env)
    })
  });
}

async function sendSearchPrompt(env: Env, tg: TelegramApi, chatId: number) {
  await tg.sendMessage({
    chat_id: chatId,
    text: searchPromptText(),
    reply_markup: mainMenuKeyboard(storefrontUrl(env))
  });
}

async function sendSearchResults(env: Env, tg: TelegramApi, chatId: number, query: string, userId: number) {
  const results = await searchProducts(env, query);
  await writeAuditEvent(env, "search", userId, null, { query, results: results.length });
  await tg.sendMessage({
    chat_id: chatId,
    text: searchResultsText(query, results.length),
    parse_mode: "HTML",
    reply_markup: searchResultsKeyboard(results, storefrontUrl(env))
  });
}

async function sendFavoritesView(env: Env, tg: TelegramApi, chatId: number, userId: number) {
  const favorites = await listFavoriteProducts(env, userId);
  await tg.sendMessage({
    chat_id: chatId,
    text: favoritesText(favorites.length),
    parse_mode: "HTML",
    reply_markup: favoritesKeyboard(favorites, storefrontUrl(env))
  });
}

async function sendAdminCatalogView(env: Env, tg: TelegramApi, chatId: number, pageIndex: number) {
  const page = await getAdminCatalogPage(env, pageIndex);
  if (!page) {
    await tg.sendMessage({ chat_id: chatId, text: "Каталог пуст." });
    return;
  }
  await tg.sendMessage({
    chat_id: chatId,
    text: adminCatalogText(page),
    parse_mode: "HTML",
    reply_markup: adminCatalogKeyboard({
      productId: page.productId,
      page: page.page,
      totalPages: page.totalPages,
      isActive: page.isActive,
      stockQty: page.stockQty
    })
  });
}

async function editAdminCatalogView(env: Env, tg: TelegramApi, callback: CallbackQuery, pageIndex: number) {
  if (!callback.message) {
    return;
  }
  const page = await getAdminCatalogPage(env, pageIndex);
  if (!page) {
    await tg.answerCallbackQuery({
      callback_query_id: callback.id,
      text: "Товар недоступен.",
      show_alert: true
    });
    return;
  }
  await tg.editMessageText({
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    text: adminCatalogText(page),
    parse_mode: "HTML",
    reply_markup: adminCatalogKeyboard({
      productId: page.productId,
      page: page.page,
      totalPages: page.totalPages,
      isActive: page.isActive,
      stockQty: page.stockQty
    })
  });
}

async function sendAuditEvents(env: Env, tg: TelegramApi, chatId: number) {
  const events = await listRecentAuditEvents(env, 12);
  await tg.sendMessage({
    chat_id: chatId,
    text: auditEventsText(events),
    parse_mode: "HTML"
  });
}

async function sendCartView(env: Env, tg: TelegramApi, chatId: number, userId: number) {
  const cart = await getCartSnapshot(env, userId);
  await tg.sendMessage({
    chat_id: chatId,
    text: cartText(cart.items, cart.totalStars),
    parse_mode: "HTML",
    reply_markup: cartKeyboard(
      cart.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        sizeLabel: item.sizeLabel,
        quantity: item.quantity
      })),
      !cart.isEmpty,
      storefrontUrl(env)
    )
  });
}

async function editCartView(env: Env, tg: TelegramApi, callback: CallbackQuery) {
  if (!callback.message) {
    return;
  }
  const cart = await getCartSnapshot(env, callback.from.id);
  await tg.editMessageText({
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    text: cartText(cart.items, cart.totalStars),
    parse_mode: "HTML",
    reply_markup: cartKeyboard(
      cart.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        sizeLabel: item.sizeLabel,
        quantity: item.quantity
      })),
      !cart.isEmpty,
      storefrontUrl(env)
    )
  });
}

async function sendAdminPendingOrders(env: Env, tg: TelegramApi, chatId: number) {
  const orders = await listPendingOrders(env);
  if (orders.length === 0) {
    await tg.sendMessage({ chat_id: chatId, text: "Необработанных заказов нет." });
    return;
  }
  for (const order of orders) {
    await tg.sendMessage({
      chat_id: chatId,
      text: adminOrderText(order),
      parse_mode: "HTML",
      reply_markup: orderActionsKeyboard(order.orderId)
    });
  }
}

async function enterSupportMode(env: Env, tg: TelegramApi, userId: number, chatId: number, dialog: string) {
  await setDialogState(env, userId, dialog, "");
  const label = dialog === DIALOG_PAYMENT_SUPPORT ? "по оплате" : "для менеджера";
  await tg.sendMessage({
    chat_id: chatId,
    text:
      `Напишите одним сообщением ваш вопрос ${label}.\n` +
      "Я передам его человеку и подтвержу, что запрос создан.\n\n" +
      "Если передумали, отправьте /cancel.",
    reply_markup: mainMenuKeyboard(storefrontUrl(env))
  });
}

async function enterAiHelpMode(env: Env, tg: TelegramApi, userId: number, chatId: number) {
  await setDialogState(env, userId, DIALOG_AI_HELP, JSON.stringify({ history: [] }));
  await tg.sendMessage({
    chat_id: chatId,
    text:
      "Напишите, что ищете: подарок, размер, стиль, одежду или обувь.\n" +
      "Это отдельный чат с AI-менеджером.\n" +
      "Выйти можно через /cancel или кнопкой ниже.",
    reply_markup: aiHelpKeyboard(storefrontUrl(env))
  });
}

function readAiDialogHistory(payload: string): AssistantTurn[] {
  if (!payload) {
    return [];
  }
  try {
    const parsed = JSON.parse(payload) as { history?: AssistantTurn[] };
    if (!Array.isArray(parsed.history)) {
      return [];
    }
    return parsed.history
      .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
      .slice(-6);
  } catch {
    return [];
  }
}

function writeAiDialogHistory(history: AssistantTurn[]): string {
  return JSON.stringify({ history: history.slice(-6) });
}

async function handleDialogText(env: Env, tg: TelegramApi, message: TelegramMessage): Promise<boolean> {
  if (!message.from || !message.text) {
    return false;
  }

  const dialog = await getDialogState(env, message.from.id);
  if (dialog.state === DIALOG_NONE) {
    return false;
  }

  if (dialog.state === DIALOG_ADMIN_REPLY) {
    if (message.from.id !== adminChatId(env)) {
      await clearDialogState(env, message.from.id);
      await tg.sendMessage({ chat_id: message.chat.id, text: "Режим ответа администратора сброшен: недостаточно прав." });
      return true;
    }
    const [requestIdRaw, targetUserIdRaw] = dialog.payload.split(":");
    const requestId = Number(requestIdRaw);
    const targetUserId = Number(targetUserIdRaw);
    if (!requestId || !targetUserId) {
      await clearDialogState(env, message.from.id);
      await tg.sendMessage({
        chat_id: message.chat.id,
        text: "Не удалось восстановить контекст ответа. Нажмите кнопку «Ответить» заново."
      });
      return true;
    }
    await tg.sendMessage({
      chat_id: targetUserId,
      text: `<b>${botTitle(env)}</b>\n${message.text}\n\nАдмин: ${adminHandle(env)}`,
      parse_mode: "HTML"
    });
    await markSupportRequestAnswered(env, requestId);
    await clearDialogState(env, message.from.id);
    await writeAuditEvent(env, "support_reply_sent", message.from.id, String(requestId), { targetUserId });
    await tg.sendMessage({ chat_id: message.chat.id, text: "Ответ клиенту отправлен." });
    return true;
  }

  if (dialog.state === DIALOG_SEARCH) {
    await clearDialogState(env, message.from.id);
    await sendSearchResults(env, tg, message.chat.id, message.text, message.from.id);
    return true;
  }

  if (dialog.state === DIALOG_AI_HELP) {
    if (isBotNavigationText(message.text)) {
      await clearDialogState(env, message.from.id);
      return false;
    }
    if (await isAiRateLimited(env, "bot_ai_manager", message.from.id, BOT_AI_LIMIT_REQUESTS, BOT_AI_LIMIT_WINDOW_MINUTES)) {
      await writeAuditEvent(env, "bot_ai_manager_rate_limited", message.from.id, null, {
        limit: BOT_AI_LIMIT_REQUESTS,
        windowMinutes: BOT_AI_LIMIT_WINDOW_MINUTES
      });
      await tg.sendMessage({
        chat_id: message.chat.id,
        text:
          "AI-менеджер временно на паузе из-за лимита запросов. Подождите несколько минут и попробуйте снова.",
        reply_markup: aiHelpKeyboard(storefrontUrl(env))
      });
      return true;
    }
    const history = readAiDialogHistory(dialog.payload);
    const [catalogContext, catalogItems] = await Promise.all([
      buildAssistantCatalogContext(env, message.from.id),
      buildAssistantCatalogItems(env, message.from.id)
    ]);
    const answer = await answerStoreAssistant(env, {
      message: message.text,
      history,
      userId: message.from.id,
      catalogContext,
      catalogItems
    });
    const nextHistory: AssistantTurn[] = [
      ...history,
      { role: "user" as const, text: message.text },
      { role: "assistant" as const, text: answer.text }
    ].slice(-6);
    await setDialogState(env, message.from.id, DIALOG_AI_HELP, writeAiDialogHistory(nextHistory));
    await writeAuditEvent(env, "bot_ai_manager", message.from.id, null, {
      blocked: answer.blocked,
      escalatedToAdmin: answer.escalatedToAdmin,
      model: answer.model
    });
    await tg.sendMessage({
      chat_id: message.chat.id,
      text: answer.text,
      reply_markup: answer.suggestions?.length
        ? aiSuggestionsKeyboard(answer.suggestions, storefrontUrl(env))
        : aiHelpKeyboard(storefrontUrl(env))
    });
    return true;
  }

  const requestType = dialog.state === DIALOG_PAYMENT_SUPPORT ? "payment_support" : "manager_request";
  const requestId = await createSupportRequest(env, message.from.id, requestType, message.text);
  await clearDialogState(env, message.from.id);
  await writeAuditEvent(env, "support_request_created", message.from.id, String(requestId), { requestType });
  const delivered = await notifyAdmin(env, tg, {
    text: supportAlertText({
      requestId,
      requestType,
      fullName: fullName(message.from),
      username: message.from.username ?? null,
      userId: message.from.id,
      messageText: message.text
    }),
    parse_mode: "HTML",
    reply_markup: supportReplyKeyboard(requestId, message.from.id)
  });
  await tg.sendMessage({
    chat_id: message.chat.id,
    text: delivered
      ? `Готово. Запрос #${requestId} отправлен менеджеру. Мы вернемся к вам в этом чате.`
      : supportUnavailableText(adminHandle(env))
  });
  return true;
}

async function handleMessage(env: Env, tg: TelegramApi, message: TelegramMessage): Promise<void> {
  if (!message.from) {
    return;
  }

  await ensureUser(env, {
    id: message.from.id,
    username: message.from.username,
    fullName: fullName(message.from)
  });

  if (await cancelDialogIfNeeded(env, tg, message)) {
    return;
  }

  if (message.successful_payment) {
    const orderId = extractOrderId(message.successful_payment.invoice_payload);
    if (!orderId) {
      await tg.sendMessage({
        chat_id: message.chat.id,
        text: "Платеж получен, но payload заказа не распознан. Менеджер уже уведомлен."
      });
      return;
    }
    await markOrderPaid(
      env,
      orderId,
      message.successful_payment.telegram_payment_charge_id,
      message.successful_payment.provider_payment_charge_id
    );
    await writeAuditEvent(env, "order_paid", message.from.id, orderId, {
      totalAmount: message.successful_payment.total_amount,
      currency: message.successful_payment.currency
    });
    await tg.sendMessage({
      chat_id: message.chat.id,
      text:
        `<b>Оплата подтверждена</b>\n` +
        `Заказ: <code>${orderId}</code>\n` +
        `Сумма: <b>${message.successful_payment.total_amount} ${message.successful_payment.currency}</b>\n\n` +
        "Спасибо за покупку. Менеджер увидит заказ в административном чате.",
      parse_mode: "HTML"
    });
    const pendingOrder = await getPendingOrderById(env, orderId);
    if (pendingOrder) {
      await notifyAdmin(env, tg, {
        text: adminNewOrderText(pendingOrder),
        parse_mode: "HTML",
        reply_markup: orderActionsKeyboard(pendingOrder.orderId)
      });
    }
    return;
  }

  if (message.text && (await handleDialogText(env, tg, message))) {
    return;
  }

  if (!message.text) {
    const dialog = await getDialogState(env, message.from.id);
    const text =
      dialog.state === DIALOG_NONE
        ? "Сейчас я понимаю только текст и кнопки. Нажмите нужную кнопку в меню или отправьте команду /help."
        : "Сейчас я жду обычное текстовое сообщение для менеджера.";
    await tg.sendMessage({
      chat_id: message.chat.id,
      text,
      reply_markup: mainMenuKeyboard(storefrontUrl(env))
    });
    return;
  }

  const text = message.text.trim();
  const lowered = text.toLowerCase();
  const command = extractCommand(text);

  if (command === "/start" || command === "/menu") {
    await tg.sendMessage({
      chat_id: message.chat.id,
      text: welcomeText(botTitle(env), adminHandle(env)),
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(storefrontUrl(env))
    });
    return;
  }

  if (command === "/help" || text === BUTTON_HELP || lowered === "help") {
    await tg.sendMessage({
      chat_id: message.chat.id,
      text: helpText(adminHandle(env)),
      reply_markup: mainMenuKeyboard(storefrontUrl(env))
    });
    return;
  }

  if (command === "/aihelp" || text === BUTTON_AI_HELP || lowered === "помощь по товарам" || lowered === "общение с ai-менеджером") {
    await enterAiHelpMode(env, tg, message.from.id, message.chat.id);
    return;
  }

  if (command === "/catalog" || text === BUTTON_CATALOG || lowered === "каталог" || lowered === "витрина") {
    await sendCatalogSelector(env, tg, message.chat.id);
    return;
  }

  if (command === "/cart" || text === BUTTON_CART || lowered === "корзина" || lowered === "моя корзина") {
    await sendCartView(env, tg, message.chat.id, message.from.id);
    return;
  }

  if (command === "/search" || text === BUTTON_SEARCH || lowered === "поиск") {
    await setDialogState(env, message.from.id, DIALOG_SEARCH, "");
    await sendSearchPrompt(env, tg, message.chat.id);
    return;
  }

  if (command === "/favorites" || text === BUTTON_FAVORITES || lowered === "избранное") {
    await sendFavoritesView(env, tg, message.chat.id, message.from.id);
    return;
  }

  if (command === "/contact" || text === BUTTON_CONTACT || lowered === "менеджер" || lowered === "связаться с менеджером") {
    await enterSupportMode(env, tg, message.from.id, message.chat.id, DIALOG_MANAGER);
    return;
  }

  if (command === "/paysupport") {
    await enterSupportMode(env, tg, message.from.id, message.chat.id, DIALOG_PAYMENT_SUPPORT);
    return;
  }

  if (command === "/admin") {
    if (message.from.id !== adminChatId(env)) {
      await tg.sendMessage({ chat_id: message.chat.id, text: "Команда /admin доступна только администратору." });
      return;
    }
    await tg.sendMessage({
      chat_id: message.chat.id,
      text: "Админ-панель",
      reply_markup: adminMenuKeyboard()
    });
    return;
  }

  const category = await findCategoryByText(env, text);
  if (category) {
    await sendProductCard(env, tg, message.chat.id, message.from.id, category.slug, 0);
    return;
  }

  if (text.length >= 3) {
    const quickResults = await searchProducts(env, text, 5);
    if (quickResults.length > 0) {
      await tg.sendMessage({
        chat_id: message.chat.id,
        text: "Похоже, вы ищете товар. Показываю быстрые результаты поиска.",
        reply_markup: searchResultsKeyboard(quickResults, storefrontUrl(env))
      });
      return;
    }
  }

  await tg.sendMessage({
    chat_id: message.chat.id,
    text:
      "Я жду нажатие кнопки или понятную команду.\n" +
      "Попробуйте: Каталог, Поиск, Избранное, Корзина, Связаться с менеджером или /help.",
    reply_markup: mainMenuKeyboard(storefrontUrl(env))
  });
}

async function handleCallback(env: Env, tg: TelegramApi, callback: CallbackQuery): Promise<void> {
  const data = callback.data ?? "";
  await ensureUser(env, {
    id: callback.from.id,
    username: callback.from.username,
    fullName: fullName(callback.from)
  });

  if (data === "noop") {
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "open_catalog") {
    if (callback.message) {
      try {
        await tg.deleteMessage({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id
        });
      } catch (error) {
        console.log("deleteMessage failed while opening catalog", error);
      }
      await sendCatalogSelector(env, tg, callback.message.chat.id);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "open_cart") {
    if (callback.message) {
      try {
        await editCartView(env, tg, callback);
      } catch (error) {
        console.log("editCartView failed while opening cart", error);
        await sendCartView(env, tg, callback.message.chat.id, callback.from.id);
      }
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "open_contact") {
    if (callback.message) {
      await enterSupportMode(env, tg, callback.from.id, callback.message.chat.id, DIALOG_MANAGER);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "open_search") {
    if (callback.message) {
      await setDialogState(env, callback.from.id, DIALOG_SEARCH, "");
      await sendSearchPrompt(env, tg, callback.message.chat.id);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "open_favorites") {
    if (callback.message) {
      await sendFavoritesView(env, tg, callback.message.chat.id, callback.from.id);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data.startsWith("open_category:")) {
    const categorySlug = data.split(":")[1];
    if (callback.message) {
      try {
        await tg.deleteMessage({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id
        });
      } catch {
        console.log("deleteMessage failed while switching to product card");
      }
      await sendProductCard(env, tg, callback.message.chat.id, callback.from.id, categorySlug, 0);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data.startsWith("show_product:")) {
    const productId = Number(data.split(":")[1]);
    if (callback.message) {
      try {
        await tg.deleteMessage({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id
        });
      } catch (error) {
        console.log("deleteMessage failed while showing product", error);
      }
      await sendProductById(env, tg, callback.message.chat.id, callback.from.id, productId);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data.startsWith("browse:")) {
    const [, categorySlug, pageRaw] = data.split(":");
    await editProductCard(env, tg, callback, categorySlug, Number(pageRaw));
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data.startsWith("toggle_favorite:")) {
    const [, productIdRaw, categorySlug, pageRaw] = data.split(":");
    const favorite = await toggleFavorite(env, callback.from.id, Number(productIdRaw));
    await writeAuditEvent(env, favorite ? "favorite_added" : "favorite_removed", callback.from.id, productIdRaw, {});
    await editProductCard(env, tg, callback, categorySlug, Number(pageRaw));
    await tg.answerCallbackQuery({
      callback_query_id: callback.id,
      text: favorite ? "Товар добавлен в избранное" : "Товар убран из избранного"
    });
    return;
  }

  if (data.startsWith("add_to_cart:")) {
    const [, productIdRaw, categorySlug, pageRaw] = data.split(":");
    const result = await addToCart(env, callback.from.id, Number(productIdRaw));
    if (!result.ok) {
      const errorText =
        result.reason === "out_of_stock"
          ? "Товар закончился."
          : result.reason === "inactive"
            ? "Товар скрыт."
            : "Товар не найден.";
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: errorText, show_alert: true });
      return;
    }
    await writeAuditEvent(env, "cart_add", callback.from.id, productIdRaw, { quantity: result.quantity });
    await editProductCard(env, tg, callback, categorySlug, Number(pageRaw));
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Товар добавлен в корзину" });
    return;
  }

  if (data.startsWith("cart_remove:")) {
    const [, productIdRaw, encodedSize = ""] = data.split(":");
    await removeFromCart(env, callback.from.id, Number(productIdRaw), decodeURIComponent(encodedSize));
    await writeAuditEvent(env, "cart_remove", callback.from.id, productIdRaw, {});
    await editCartView(env, tg, callback);
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Позиция удалена" });
    return;
  }

  if (data.startsWith("cart_qty:")) {
    const parts = data.split(":");
    const productIdRaw = parts[1];
    const encodedSize = parts.length >= 4 ? parts[2] : "";
    const deltaRaw = parts.length >= 4 ? parts[3] : parts[2];
    const productId = Number(productIdRaw);
    const delta = Number(deltaRaw);
    const sizeLabel = decodeURIComponent(encodedSize);
    const cart = await getCartSnapshot(env, callback.from.id);
    const item = cart.items.find((entry) => entry.productId === productId && entry.sizeLabel === sizeLabel);
    if (!item) {
      await tg.answerCallbackQuery({
        callback_query_id: callback.id,
        text: "Товар не найден в корзине.",
        show_alert: true
      });
      return;
    }
    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 1) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Минимальное количество: 1 шт." });
      return;
    }
    const result = await setCartQuantity(env, callback.from.id, productId, sizeLabel, nextQuantity);
    if (!result.ok) {
      await tg.answerCallbackQuery({
        callback_query_id: callback.id,
        text: result.reason === "out_of_stock" ? "Недостаточно товара на складе." : "Товар недоступен.",
        show_alert: true
      });
      return;
    }
    await writeAuditEvent(env, "cart_quantity_changed", callback.from.id, productIdRaw, { quantity: nextQuantity });
    await editCartView(env, tg, callback);
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Количество обновлено" });
    return;
  }

  if (data === "clear_cart") {
    await clearCart(env, callback.from.id);
    await writeAuditEvent(env, "cart_cleared", callback.from.id, null, {});
    await editCartView(env, tg, callback);
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Корзина очищена" });
    return;
  }

  if (data === "checkout") {
    const cart = await getCartSnapshot(env, callback.from.id);
    if (cart.isEmpty) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Корзина пуста.", show_alert: true });
      return;
    }
    const order = await createOrderFromCart(env, callback.from.id, paymentsCurrency(env), botTitle(env));
    if (!order.ok) {
      const reasonText =
        order.reason === "empty_cart"
          ? "Корзина пуста."
          : order.reason === "out_of_stock"
            ? `Недостаточно остатка для товара: ${order.title ?? "позиция"}`
            : `Товар недоступен: ${order.title ?? "позиция"}`;
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: reasonText, show_alert: true });
      return;
    }
    await writeAuditEvent(env, "order_draft_created", callback.from.id, order.orderId, { totalStars: order.totalStars });
    try {
      await tg.sendInvoice({
        chat_id: callback.from.id,
        title: order.title,
        description: order.description,
        payload: `order:${order.orderId}`,
        provider_token: "",
        currency: paymentsCurrency(env),
        prices: [{ label: "Premium order", amount: order.totalStars }],
        photo_url: order.photoUrl,
        start_parameter: `premium-order-${order.orderId.slice(0, 8)}`
      });
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Инвойс отправлен. Проверьте сообщение ниже." });
    } catch (error) {
      console.error("sendInvoice failed", error);
      await tg.answerCallbackQuery({
        callback_query_id: callback.id,
        text: "Не удалось отправить инвойс. Попробуйте еще раз через пару секунд.",
        show_alert: true
      });
    }
    return;
  }

  if (data === "admin_pending_orders") {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    if (callback.message) {
      await sendAdminPendingOrders(env, tg, callback.message.chat.id);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "admin_catalog") {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    if (callback.message) {
      await sendAdminCatalogView(env, tg, callback.message.chat.id, 0);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data === "admin_audit") {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    if (callback.message) {
      await sendAuditEvents(env, tg, callback.message.chat.id);
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data.startsWith("admin_catalog_page:")) {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    await editAdminCatalogView(env, tg, callback, Number(data.split(":")[1]));
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  if (data.startsWith("admin_stock:")) {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    const [, productIdRaw, deltaRaw, pageRaw] = data.split(":");
    const page = await updateProductStock(env, Number(productIdRaw), Number(deltaRaw));
    await writeAuditEvent(env, "admin_stock_updated", callback.from.id, productIdRaw, { delta: Number(deltaRaw) });
    await editAdminCatalogView(env, tg, callback, page?.page ?? Number(pageRaw));
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Остаток обновлен" });
    return;
  }

  if (data.startsWith("admin_toggle:")) {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    const [, productIdRaw, pageRaw] = data.split(":");
    const page = await toggleProductActive(env, Number(productIdRaw));
    await writeAuditEvent(env, "admin_product_toggled", callback.from.id, productIdRaw, {
      isActive: page?.isActive ?? false
    });
    await editAdminCatalogView(env, tg, callback, page?.page ?? Number(pageRaw));
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Статус товара обновлен" });
    return;
  }

  if (data.startsWith("ship_order:")) {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    const orderId = data.slice("ship_order:".length);
    const order = await markOrderShipped(env, orderId);
    if (!order) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Заказ уже обработан или не найден.", show_alert: true });
      return;
    }
    await writeAuditEvent(env, "order_shipped", callback.from.id, orderId, {});
    if (callback.message) {
      const originalText = callback.message.text ?? "Заказ";
      await tg.editMessageText({
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: `${originalText}\n\nСтатус обновлен: отправлен`,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      });
    }
    await tg.sendMessage({
      chat_id: order.userId,
      text: `<b>${botTitle(env)}</b>\nВаш заказ <code>${order.orderId}</code> отмечен как отправленный.\n\nАдмин: ${adminHandle(env)}`,
      parse_mode: "HTML"
    });
    await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Заказ отмечен как отправленный." });
    return;
  }

  if (data.startsWith("reply_support:")) {
    if (callback.from.id !== adminChatId(env)) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Недостаточно прав.", show_alert: true });
      return;
    }
    const [, requestIdRaw, userIdRaw] = data.split(":");
    const requestId = Number(requestIdRaw);
    const userId = Number(userIdRaw);
    const request = await getSupportRequest(env, requestId);
    if (!request) {
      await tg.answerCallbackQuery({ callback_query_id: callback.id, text: "Запрос не найден.", show_alert: true });
      return;
    }
    await setDialogState(env, callback.from.id, DIALOG_ADMIN_REPLY, `${requestId}:${userId}`);
    if (callback.message) {
      await tg.sendMessage({
        chat_id: callback.message.chat.id,
        text: `Ответ клиенту <code>${userId}</code>.\nСледующим сообщением отправьте текст ответа от имени магазина.`,
        parse_mode: "HTML"
      });
    }
    await tg.answerCallbackQuery({ callback_query_id: callback.id });
    return;
  }

  await tg.answerCallbackQuery({ callback_query_id: callback.id });
}

async function handlePreCheckout(env: Env, tg: TelegramApi, query: PreCheckoutQuery): Promise<void> {
  const orderId = extractOrderId(query.invoice_payload);
  if (!orderId) {
    await tg.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: "Некорректный payload заказа."
    });
    return;
  }
  const order = await getOrder(env, orderId);
  if (!order) {
    await tg.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: "Заказ не найден."
    });
    return;
  }
  if (order.userId !== query.from.id) {
    await tg.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: "Этот заказ принадлежит другому пользователю."
    });
    return;
  }
  if (order.status !== ORDER_STATUS_AWAITING_PAYMENT) {
    await tg.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: "Этот заказ уже обработан."
    });
    return;
  }
  if (query.currency !== paymentsCurrency(env)) {
    await tg.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: "Валюта заказа не совпадает."
    });
    return;
  }
  if (query.total_amount !== order.totalStars) {
    await tg.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: "Сумма заказа изменилась. Создайте инвойс заново."
    });
    return;
  }
  await tg.answerPreCheckoutQuery({ pre_checkout_query_id: query.id, ok: true });
}

async function handleUpdate(env: Env, update: Update): Promise<void> {
  const tg = new TelegramApi(env.BOT_TOKEN);
  logStructured("update_received", { updateId: update.update_id });
  if (update.message) {
    await handleMessage(env, tg, update.message);
    return;
  }
  if (update.callback_query) {
    await handleCallback(env, tg, update.callback_query);
    return;
  }
  if (update.pre_checkout_query) {
    await handlePreCheckout(env, tg, update.pre_checkout_query);
  }
}

async function handleMiniAppRequest(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/app") {
    return new Response(renderMiniAppHtml(botTitle(env)), {
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    });
  }

  if (!url.pathname.startsWith("/api/miniapp/")) {
    return null;
  }

  const auth = await authorizeMiniAppRequest(request, env.BOT_TOKEN);
  if (!auth.ok) {
    return json({ ok: false, error: auth.error }, auth.status);
  }

  const userId = auth.user?.id;

  if (request.method === "GET" && url.pathname === "/api/miniapp/bootstrap") {
    const categories = await listCategories(env);
    const summary = await getStorefrontCounts(env, userId);
    const featured = await listStorefrontProducts(env, { userId, limit: 6, offset: 0 });
    return json({
      ok: true,
      demo: auth.demo,
      title: botTitle(env),
      categories,
      summary,
      featured
    });
  }

  if (request.method === "GET" && url.pathname === "/api/miniapp/products") {
    const category = url.searchParams.get("category") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const favoritesOnly = url.searchParams.get("favorites") === "1";
    const items = await listStorefrontProducts(env, {
      userId,
      categorySlug: category,
      query: q,
      favoritesOnly,
      limit: 18,
      offset: 0
    });
    return json({ ok: true, items });
  }

  if (request.method === "GET" && url.pathname === "/api/miniapp/cart") {
    if (!userId) {
      return json({ ok: false, error: "Telegram user required" }, 401);
    }
    return json({ ok: true, cart: await getCartSnapshot(env, userId) });
  }

  if (request.method === "POST" && url.pathname === "/api/miniapp/cart/add") {
    if (!userId) {
      return json({ ok: false, error: "Telegram user required" }, 401);
    }
    const body = await readJson<{ productId: number; sizeLabel?: string }>(request);
    const result = await addToCart(env, userId, Number(body.productId), body.sizeLabel);
    if (!result.ok) {
      return json({ ok: false, error: result.reason }, 400);
    }
    await writeAuditEvent(env, "miniapp_cart_add", userId, String(body.productId), { quantity: result.quantity });
    return json({ ok: true });
  }

  if (request.method === "POST" && url.pathname === "/api/miniapp/cart/set") {
    if (!userId) {
      return json({ ok: false, error: "Telegram user required" }, 401);
    }
    const body = await readJson<{ productId: number; sizeLabel?: string; quantity: number }>(request);
    const result = await setCartQuantity(env, userId, Number(body.productId), body.sizeLabel ?? "", Number(body.quantity));
    if (!result.ok) {
      return json({ ok: false, error: result.reason }, 400);
    }
    await writeAuditEvent(env, "miniapp_cart_set", userId, String(body.productId), { quantity: body.quantity });
    return json({ ok: true });
  }

  if (request.method === "POST" && url.pathname === "/api/miniapp/favorites/toggle") {
    if (!userId) {
      return json({ ok: false, error: "Telegram user required" }, 401);
    }
    const body = await readJson<{ productId: number }>(request);
    const favorite = await toggleFavorite(env, userId, Number(body.productId));
    await writeAuditEvent(env, favorite ? "miniapp_favorite_add" : "miniapp_favorite_remove", userId, String(body.productId), {});
    return json({ ok: true, favorite });
  }

  if (request.method === "POST" && url.pathname === "/api/miniapp/checkout") {
    if (!userId) {
      return json({ ok: false, error: "Telegram user required" }, 401);
    }
    const order = await createOrderFromCart(env, userId, paymentsCurrency(env), botTitle(env));
    if (!order.ok) {
      return json({ ok: false, error: order.reason, title: order.title ?? null }, 400);
    }
    const tg = new TelegramApi(env.BOT_TOKEN);
    await tg.sendInvoice({
      chat_id: userId,
      title: order.title,
      description: order.description,
      payload: `order:${order.orderId}`,
      provider_token: "",
      currency: paymentsCurrency(env),
      prices: [{ label: "Premium order", amount: order.totalStars }],
      photo_url: order.photoUrl,
      start_parameter: `premium-order-${order.orderId.slice(0, 8)}`
    });
    await writeAuditEvent(env, "miniapp_checkout_started", userId, order.orderId, { totalStars: order.totalStars });
    return json({ ok: true, message: "Инвойс отправлен в чат с ботом." });
  }

  if (request.method === "POST" && url.pathname === "/api/miniapp/assistant") {
    if (!userId || auth.demo) {
      return json(
        {
          ok: false,
          error: "AI manager is available only inside the Telegram bot for authenticated users."
        },
        403
      );
    }
    if (await isAiRateLimited(env, "miniapp_ai_manager", userId, MINIAPP_AI_LIMIT_REQUESTS, MINIAPP_AI_LIMIT_WINDOW_MINUTES)) {
      await writeAuditEvent(env, "miniapp_ai_manager_rate_limited", userId, null, {
        limit: MINIAPP_AI_LIMIT_REQUESTS,
        windowMinutes: MINIAPP_AI_LIMIT_WINDOW_MINUTES
      });
      return json(
        {
          ok: false,
          error: "AI manager is temporarily rate limited. Please try again later in the bot chat."
        },
        429
      );
    }
    const body = await readJson<{ message: string; history?: Array<{ role: string; text: string }> }>(request);
    const [catalogContext, catalogItems] = await Promise.all([
      buildAssistantCatalogContext(env, userId),
      buildAssistantCatalogItems(env, userId)
    ]);
    const answer = await answerStoreAssistant(env, {
      message: body.message,
      history: body.history,
      userId,
      catalogContext,
      catalogItems
    });
    await writeAuditEvent(env, "miniapp_ai_manager", userId ?? null, null, {
      blocked: answer.blocked,
      escalatedToAdmin: answer.escalatedToAdmin,
      model: answer.model
    });
    return json({ ok: true, answer });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      await ensureSchema(env);

      const miniAppResponse = await handleMiniAppRequest(request, env);
      if (miniAppResponse) {
        return miniAppResponse;
      }

      if (request.method === "GET" && url.pathname === "/healthz") {
        return Response.json({ status: "ok" });
      }

      if (request.method === "POST" && url.pathname === WEBHOOK_PATH) {
        const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
        if (secret !== env.WEBHOOK_SECRET_TOKEN) {
          return new Response("Forbidden", { status: 403 });
        }
        const update = (await request.json()) as Update;
        await handleUpdate(env, update);
        return Response.json({ ok: true });
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker error", error);
      return new Response("Internal error", { status: 500 });
    }
  },
  async queue(batch: MessageBatch<NotificationJob>, env: Env): Promise<void> {
    await processQueue(env, batch);
  }
} satisfies ExportedHandler<Env, NotificationJob>;
