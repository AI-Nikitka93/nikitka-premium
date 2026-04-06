import {
  DIALOG_NONE,
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_SHIPPED,
  SEED_CATEGORIES,
  SEED_PRODUCTS
} from "./constants";

export interface Env {
  DB: D1Database;
  NOTIFY_QUEUE?: Queue<unknown>;
  BOT_TOKEN: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODELS?: string;
  ADMIN_CHAT_ID?: string;
  ADMIN_HANDLE?: string;
  BOT_TITLE?: string;
  BOT_USERNAME?: string;
  WORKER_PUBLIC_URL?: string;
  WEBHOOK_SECRET_TOKEN: string;
  PAYMENTS_CURRENCY?: string;
}

type DialogState = {
  state: string;
  payload: string;
};

type ProductRow = {
  id: number;
  category_slug: string;
  title: string;
  description: string;
  price_stars: number;
  old_price_stars: number | null;
  photo_url: string;
  sku: string | null;
  badge: string | null;
  stock_qty: number | null;
  is_active: number | null;
  search_text: string | null;
  size_group: string | null;
  available_sizes_json: string | null;
};

type PendingOrderRow = {
  order_id: string;
  user_id: number;
  total_stars: number;
  status: string;
  created_at: string;
  username: string | null;
  full_name: string;
};

export type CartItem = {
  productId: number;
  title: string;
  sizeLabel: string;
  unitPriceStars: number;
  quantity: number;
  subtotalStars: number;
};

export type CartSnapshot = {
  items: CartItem[];
  totalStars: number;
  totalQuantity: number;
  isEmpty: boolean;
};

export type ProductPage = {
  productId: number;
  categorySlug: string;
  categoryTitle: string;
  title: string;
  description: string;
  priceStars: number;
  oldPriceStars: number | null;
  photoUrl: string;
  page: number;
  totalPages: number;
  sku: string;
  badge: string | null;
  stockQty: number;
  isActive: boolean;
  sizeGroup: string;
  availableSizes: string[];
};

export type ProductSearchItem = {
  productId: number;
  title: string;
  priceStars: number;
};

export type StorefrontProduct = {
  productId: number;
  categorySlug: string;
  categoryTitle: string;
  title: string;
  description: string;
  priceStars: number;
  oldPriceStars: number | null;
  photoUrl: string;
  sku: string;
  badge: string | null;
  stockQty: number;
  isActive: boolean;
  isFavorite: boolean;
  sizeGroup: string;
  availableSizes: string[];
};

export type AdminCatalogPage = {
  productId: number;
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
};

export type OrderRecord = {
  orderId: string;
  userId: number;
  totalStars: number;
  status: string;
  title: string;
  description: string;
  photoUrl: string;
  createdAt: string;
};

export type PendingOrder = {
  orderId: string;
  userId: number;
  username: string | null;
  fullName: string;
  totalStars: number;
  status: string;
  createdAt: string;
  items: Array<{ title: string; quantity: number; subtotalStars: number }>;
};

export type SupportRequest = {
  requestId: number;
  userId: number;
  requestType: string;
  messageText: string;
  status: string;
};

export type AuditEvent = {
  eventId: number;
  eventType: string;
  userId: number | null;
  entityId: string | null;
  payloadJson: string;
  createdAt: string;
};

export type CartMutationResult =
  | { ok: true; quantity: number }
  | { ok: false; reason: "not_found" | "inactive" | "out_of_stock" };

export type OrderDraftResult =
  | {
      ok: true;
      orderId: string;
      totalStars: number;
      title: string;
      description: string;
      photoUrl: string;
    }
  | { ok: false; reason: "empty_cart" | "unavailable_product" | "out_of_stock"; title?: string };

let schemaPromise: Promise<void> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_slug TEXT NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_stars INTEGER NOT NULL CHECK(price_stars > 0),
  photo_url TEXT NOT NULL,
  old_price_stars INTEGER,
  sku TEXT,
  badge TEXT,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  search_text TEXT NOT NULL DEFAULT '',
  size_group TEXT NOT NULL DEFAULT 'one-size',
  available_sizes_json TEXT NOT NULL DEFAULT '["ONE SIZE"]'
);

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  username TEXT,
  full_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_dialogs (
  user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id, size_label)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  total_stars INTEGER NOT NULL CHECK(total_stars > 0),
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  telegram_payment_charge_id TEXT,
  provider_payment_charge_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  size_label TEXT NOT NULL DEFAULT '',
  unit_price_stars INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  PRIMARY KEY (order_id, product_id, size_label)
);

CREATE TABLE IF NOT EXISTS support_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  entity_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

async function exec(env: Env, sql: string): Promise<void> {
  const statements = sql
    .split(";")
    .map((statement) => statement.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }
}

async function first<T>(env: Env, sql: string, ...params: unknown[]): Promise<T | null> {
  const result = await env.DB.prepare(sql).bind(...params).first<T>();
  return result ?? null;
}

async function all<T>(env: Env, sql: string, ...params: unknown[]): Promise<T[]> {
  const result = await env.DB.prepare(sql).bind(...params).all<T>();
  return result.results ?? [];
}

async function run(env: Env, sql: string, ...params: unknown[]) {
  return env.DB.prepare(sql).bind(...params).run();
}

async function ensureProductColumns(env: Env): Promise<void> {
  const columns = await all<{ name: string }>(env, "PRAGMA table_info(products)");
  const existing = new Set(columns.map((column) => column.name));
  const statements: string[] = [];

  if (!existing.has("old_price_stars")) statements.push("ALTER TABLE products ADD COLUMN old_price_stars INTEGER");
  if (!existing.has("sku")) statements.push("ALTER TABLE products ADD COLUMN sku TEXT");
  if (!existing.has("badge")) statements.push("ALTER TABLE products ADD COLUMN badge TEXT");
  if (!existing.has("stock_qty")) statements.push("ALTER TABLE products ADD COLUMN stock_qty INTEGER NOT NULL DEFAULT 0");
  if (!existing.has("is_active")) statements.push("ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  if (!existing.has("search_text")) statements.push("ALTER TABLE products ADD COLUMN search_text TEXT NOT NULL DEFAULT ''");
  if (!existing.has("size_group")) statements.push("ALTER TABLE products ADD COLUMN size_group TEXT NOT NULL DEFAULT 'one-size'");
  if (!existing.has("available_sizes_json")) {
    statements.push("ALTER TABLE products ADD COLUMN available_sizes_json TEXT NOT NULL DEFAULT '[\"ONE SIZE\"]'");
  }

  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }

  await run(
    env,
    `UPDATE products
     SET size_group = CASE
       WHEN category_slug = 'footwear' THEN 'footwear'
       WHEN category_slug IN ('tshirts', 'hoodies', 'outerwear', 'bottoms') THEN 'clothing'
       ELSE 'one-size'
     END
     WHERE TRIM(COALESCE(size_group, '')) = '' OR size_group IS NULL OR
       (category_slug = 'footwear' AND size_group = 'one-size') OR
       (category_slug IN ('tshirts', 'hoodies', 'outerwear', 'bottoms') AND size_group = 'one-size')`
  );

  await run(
    env,
    `UPDATE products
     SET available_sizes_json = CASE
       WHEN category_slug = 'footwear' THEN '["39","40","41","42","43","44","45"]'
       WHEN category_slug IN ('tshirts', 'hoodies', 'outerwear') THEN '["XS","S","M","L","XL","XXL"]'
       WHEN category_slug = 'bottoms' THEN '["S","M","L","XL"]'
       ELSE '["ONE SIZE"]'
     END
     WHERE TRIM(COALESCE(available_sizes_json, '')) = '' OR available_sizes_json IS NULL OR
       (category_slug = 'footwear' AND available_sizes_json = '["ONE SIZE"]') OR
       (category_slug IN ('tshirts', 'hoodies', 'outerwear') AND available_sizes_json = '["ONE SIZE"]') OR
       (category_slug = 'bottoms' AND available_sizes_json = '["ONE SIZE"]')`
  );
}

async function ensureVariantCartTables(env: Env): Promise<void> {
  const cartColumns = await all<{ name: string }>(env, "PRAGMA table_info(cart_items)");
  const hasCartSize = cartColumns.some((column) => column.name === "size_label");
  if (!hasCartSize) {
    await exec(
      env,
      `ALTER TABLE cart_items RENAME TO cart_items_legacy;
       CREATE TABLE cart_items (
         user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
         product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
         size_label TEXT NOT NULL DEFAULT '',
         quantity INTEGER NOT NULL CHECK(quantity > 0),
         created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (user_id, product_id, size_label)
       );
       INSERT INTO cart_items (user_id, product_id, size_label, quantity, created_at, updated_at)
       SELECT user_id, product_id, '', quantity, created_at, updated_at
       FROM cart_items_legacy;
       DROP TABLE cart_items_legacy;`
    );
  }

  const orderItemColumns = await all<{ name: string }>(env, "PRAGMA table_info(order_items)");
  const hasOrderSize = orderItemColumns.some((column) => column.name === "size_label");
  if (!hasOrderSize) {
    await exec(
      env,
      `ALTER TABLE order_items RENAME TO order_items_legacy;
       CREATE TABLE order_items (
         order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
         product_id INTEGER NOT NULL REFERENCES products(id),
         title TEXT NOT NULL,
         size_label TEXT NOT NULL DEFAULT '',
         unit_price_stars INTEGER NOT NULL,
         quantity INTEGER NOT NULL CHECK(quantity > 0),
         PRIMARY KEY (order_id, product_id, size_label)
       );
       INSERT INTO order_items (order_id, product_id, title, size_label, unit_price_stars, quantity)
       SELECT order_id, product_id, title, '', unit_price_stars, quantity
       FROM order_items_legacy;
       DROP TABLE order_items_legacy;`
    );
  }
}

export async function ensureSchema(env: Env): Promise<void> {
  if (schemaPromise) {
    return schemaPromise;
  }
  schemaPromise = (async () => {
    await exec(env, SCHEMA_SQL);
    await ensureProductColumns(env);
    await ensureVariantCartTables(env);

    const categoryCount = await first<{ count: number }>(env, "SELECT COUNT(*) AS count FROM categories");
    if ((categoryCount?.count ?? 0) === 0) {
      for (const category of SEED_CATEGORIES) {
        await run(env, "INSERT INTO categories (slug, title) VALUES (?, ?)", category.slug, category.title);
      }
    }

    const productCount = await first<{ count: number }>(env, "SELECT COUNT(*) AS count FROM products");
    if ((productCount?.count ?? 0) === 0) {
      for (const product of SEED_PRODUCTS) {
        await run(
          env,
          `INSERT INTO products (
            category_slug, title, description, price_stars, photo_url,
            old_price_stars, sku, badge, stock_qty, is_active, search_text
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          product.category_slug,
          product.title,
          product.description,
          product.price_stars,
          product.photo_url,
          product.old_price_stars,
          product.sku,
          product.badge,
          product.stock_qty,
          product.is_active,
          product.search_text
        );
      }
    }
  })();
  try {
    await schemaPromise;
  } catch (error) {
    schemaPromise = null;
    throw error;
  }
}

export async function ensureUser(env: Env, user: {
  id: number;
  username?: string;
  fullName: string;
}): Promise<void> {
  await run(
    env,
    `INSERT INTO users (user_id, username, full_name)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       full_name = excluded.full_name,
       updated_at = CURRENT_TIMESTAMP`,
    user.id,
    user.username ?? null,
    user.fullName
  );
  await run(
    env,
    `INSERT INTO user_dialogs (user_id, state, payload)
     VALUES (?, ?, '')
     ON CONFLICT(user_id) DO NOTHING`,
    user.id,
    DIALOG_NONE
  );
}

export async function writeAuditEvent(
  env: Env,
  eventType: string,
  userId: number | null,
  entityId: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  await run(
    env,
    `INSERT INTO audit_events (event_type, user_id, entity_id, payload_json)
     VALUES (?, ?, ?, ?)`,
    eventType,
    userId,
    entityId,
    JSON.stringify(payload)
  );
}

export async function listRecentAuditEvents(env: Env, limit = 10): Promise<AuditEvent[]> {
  const rows = await all<{
    id: number;
    event_type: string;
    user_id: number | null;
    entity_id: string | null;
    payload_json: string;
    created_at: string;
  }>(
    env,
    `SELECT id, event_type, user_id, entity_id, payload_json, created_at
     FROM audit_events
     ORDER BY id DESC
     LIMIT ?`,
    limit
  );
  return rows.map((row) => ({
    eventId: row.id,
    eventType: row.event_type,
    userId: row.user_id,
    entityId: row.entity_id,
    payloadJson: row.payload_json,
    createdAt: row.created_at
  }));
}

export async function countRecentAuditEvents(
  env: Env,
  params: {
    eventType: string;
    minutes: number;
    userId?: number | null;
    entityId?: string | null;
  }
): Promise<number> {
  const conditions = [
    "event_type = ?",
    "created_at >= datetime('now', ?)"
  ];
  const bindings: unknown[] = [
    params.eventType,
    `-${Math.max(1, Math.floor(params.minutes))} minutes`
  ];

  if (typeof params.userId === "number") {
    conditions.push("user_id = ?");
    bindings.push(params.userId);
  }

  if (params.entityId?.trim()) {
    conditions.push("entity_id = ?");
    bindings.push(params.entityId.trim());
  }

  const row = await first<{ count: number }>(
    env,
    `SELECT COUNT(*) AS count
     FROM audit_events
     WHERE ${conditions.join(" AND ")}`,
    ...bindings
  );

  return row?.count ?? 0;
}

export async function listCategories(env: Env): Promise<Array<{ slug: string; title: string }>> {
  return all(
    env,
    `SELECT DISTINCT c.slug, c.title
     FROM categories c
     JOIN products p ON p.category_slug = c.slug
     WHERE COALESCE(p.is_active, 1) = 1
     ORDER BY CASE c.slug
       WHEN 'tshirts' THEN 1
       WHEN 'hoodies' THEN 2
       WHEN 'outerwear' THEN 3
       WHEN 'bottoms' THEN 4
       WHEN 'footwear' THEN 5
       WHEN 'headwear' THEN 6
       WHEN 'accessories' THEN 7
       WHEN 'souvenirs' THEN 8
       ELSE 99
     END, c.title`
  );
}

export async function findCategoryByText(env: Env, text: string): Promise<{ slug: string; title: string } | null> {
  const normalized = text.trim().toLowerCase();
  const categories = await listCategories(env);
  return categories.find((item) => item.slug === normalized || item.title.toLowerCase() === normalized) ?? null;
}

function defaultSizeGroup(categorySlug: string): string {
  if (categorySlug === "footwear") return "footwear";
  if (["tshirts", "hoodies", "outerwear", "bottoms"].includes(categorySlug)) return "clothing";
  return "one-size";
}

function defaultSizes(categorySlug: string): string[] {
  if (categorySlug === "footwear") return ["39", "40", "41", "42", "43", "44", "45"];
  if (["tshirts", "hoodies", "outerwear"].includes(categorySlug)) return ["XS", "S", "M", "L", "XL", "XXL"];
  if (categorySlug === "bottoms") return ["S", "M", "L", "XL"];
  return ["ONE SIZE"];
}

function normalizeAvailableSizes(categorySlug: string, rawJson: string | null): string[] {
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        const values = parsed
          .map((item) => String(item ?? "").trim())
          .filter(Boolean)
          .slice(0, 12);
        if (values.length) return values;
      }
    } catch {
      console.log("Failed to parse available_sizes_json", rawJson);
    }
  }
  return defaultSizes(categorySlug);
}

function resolveSizeSelection(
  categorySlug: string,
  availableSizesJson: string | null,
  requestedSizeLabel?: string | null
): string | null {
  const sizes = normalizeAvailableSizes(categorySlug, availableSizesJson);
  if (!sizes.length) return null;
  if (!requestedSizeLabel?.trim()) return sizes[0];
  const normalized = requestedSizeLabel.trim().toUpperCase();
  return sizes.find((size) => size.toUpperCase() === normalized) ?? null;
}

function mapProductPage(row: ProductRow, categoryTitle: string, page: number, totalPages: number): ProductPage {
  return {
    productId: row.id,
    categorySlug: row.category_slug,
    categoryTitle,
    title: row.title,
    description: row.description,
    priceStars: row.price_stars,
    oldPriceStars: row.old_price_stars,
    photoUrl: row.photo_url,
    page,
    totalPages,
    sku: row.sku ?? `SKU-${row.id}`,
    badge: row.badge,
    stockQty: row.stock_qty ?? 0,
    isActive: (row.is_active ?? 1) === 1,
    sizeGroup: row.size_group ?? defaultSizeGroup(row.category_slug),
    availableSizes: normalizeAvailableSizes(row.category_slug, row.available_sizes_json)
  };
}

export async function getProductPage(env: Env, categorySlug: string, page: number): Promise<ProductPage | null> {
  const countRow = await first<{ count: number }>(
    env,
    "SELECT COUNT(*) AS count FROM products WHERE category_slug = ? AND COALESCE(is_active, 1) = 1",
    categorySlug
  );
  const totalItems = countRow?.count ?? 0;
  if (totalItems === 0) {
    return null;
  }

  const totalPages = Math.max(1, totalItems);
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const category = await first<{ title: string }>(env, "SELECT title FROM categories WHERE slug = ?", categorySlug);
  const row = await first<ProductRow>(
    env,
    `SELECT id, category_slug, title, description, price_stars, old_price_stars, photo_url, sku, badge, stock_qty, is_active, search_text, size_group, available_sizes_json
     FROM products
     WHERE category_slug = ? AND COALESCE(is_active, 1) = 1
     ORDER BY id
     LIMIT 1 OFFSET ?`,
    categorySlug,
    safePage
  );
  if (!row || !category) {
    return null;
  }
  return mapProductPage(row, category.title, safePage, totalPages);
}

export async function getProductPageById(env: Env, productId: number): Promise<ProductPage | null> {
  const row = await first<ProductRow>(
    env,
    `SELECT id, category_slug, title, description, price_stars, old_price_stars, photo_url, sku, badge, stock_qty, is_active, search_text, size_group, available_sizes_json
     FROM products
     WHERE id = ? AND COALESCE(is_active, 1) = 1`,
    productId
  );
  if (!row) {
    return null;
  }
  const category = await first<{ title: string }>(env, "SELECT title FROM categories WHERE slug = ?", row.category_slug);
  const countBefore = await first<{ count: number }>(
    env,
    `SELECT COUNT(*) AS count
     FROM products
     WHERE category_slug = ? AND COALESCE(is_active, 1) = 1 AND id < ?`,
    row.category_slug,
    row.id
  );
  const totalItems = await first<{ count: number }>(
    env,
    "SELECT COUNT(*) AS count FROM products WHERE category_slug = ? AND COALESCE(is_active, 1) = 1",
    row.category_slug
  );
  return mapProductPage(row, category?.title ?? row.category_slug, countBefore?.count ?? 0, totalItems?.count ?? 1);
}

export async function searchProducts(env: Env, query: string, limit = 8): Promise<ProductSearchItem[]> {
  const normalized = `%${query.trim().toLowerCase()}%`;
  const rows = await all<{ id: number; title: string; price_stars: number }>(
    env,
    `SELECT id, title, price_stars
     FROM products
     WHERE COALESCE(is_active, 1) = 1
       AND (
         LOWER(title) LIKE ?
         OR LOWER(description) LIKE ?
         OR LOWER(COALESCE(search_text, '')) LIKE ?
         OR LOWER(COALESCE(sku, '')) LIKE ?
       )
     ORDER BY id
     LIMIT ?`,
    normalized,
    normalized,
    normalized,
    normalized,
    limit
  );
  return rows.map((row) => ({
    productId: row.id,
    title: row.title,
    priceStars: row.price_stars
  }));
}

export async function listFavoriteProducts(env: Env, userId: number): Promise<ProductSearchItem[]> {
  const rows = await all<{ id: number; title: string; price_stars: number }>(
    env,
    `SELECT p.id, p.title, p.price_stars
     FROM favorites f
     JOIN products p ON p.id = f.product_id
     WHERE f.user_id = ? AND COALESCE(p.is_active, 1) = 1
     ORDER BY f.created_at DESC`,
    userId
  );
  return rows.map((row) => ({
    productId: row.id,
    title: row.title,
    priceStars: row.price_stars
  }));
}

export async function isFavorite(env: Env, userId: number, productId: number): Promise<boolean> {
  const row = await first<{ product_id: number }>(
    env,
    "SELECT product_id FROM favorites WHERE user_id = ? AND product_id = ?",
    userId,
    productId
  );
  return !!row;
}

export async function toggleFavorite(env: Env, userId: number, productId: number): Promise<boolean> {
  const exists = await isFavorite(env, userId, productId);
  if (exists) {
    await run(env, "DELETE FROM favorites WHERE user_id = ? AND product_id = ?", userId, productId);
    return false;
  }
  await run(
    env,
    "INSERT INTO favorites (user_id, product_id) VALUES (?, ?) ON CONFLICT(user_id, product_id) DO NOTHING",
    userId,
    productId
  );
  return true;
}

export async function getCartSnapshot(env: Env, userId: number): Promise<CartSnapshot> {
  const rows = await all<{
    product_id: number;
    title: string;
    size_label: string;
    unit_price_stars: number;
    quantity: number;
  }>(
    env,
    `SELECT
       p.id AS product_id,
       p.title AS title,
       c.size_label AS size_label,
       p.price_stars AS unit_price_stars,
       c.quantity AS quantity
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY p.id, c.size_label`,
    userId
  );
  const items = rows.map((row) => ({
    productId: row.product_id,
    title: row.title,
    sizeLabel: row.size_label || "ONE SIZE",
    unitPriceStars: row.unit_price_stars,
    quantity: row.quantity,
    subtotalStars: row.unit_price_stars * row.quantity
  }));
  const totalStars = items.reduce((sum, item) => sum + item.subtotalStars, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    items,
    totalStars,
    totalQuantity,
    isEmpty: items.length === 0
  };
}

async function productAvailability(env: Env, productId: number): Promise<{
  exists: boolean;
  isActive: boolean;
  stockQty: number;
  categorySlug: string;
  availableSizesJson: string | null;
}> {
  const row = await first<{
    stock_qty: number | null;
    is_active: number | null;
    category_slug: string;
    available_sizes_json: string | null;
  }>(
    env,
    "SELECT stock_qty, is_active, category_slug, available_sizes_json FROM products WHERE id = ?",
    productId
  );
  if (!row) {
    return { exists: false, isActive: false, stockQty: 0, categorySlug: "", availableSizesJson: null };
  }
  return {
    exists: true,
    isActive: (row.is_active ?? 1) === 1,
    stockQty: row.stock_qty ?? 0,
    categorySlug: row.category_slug,
    availableSizesJson: row.available_sizes_json
  };
}

export async function addToCart(
  env: Env,
  userId: number,
  productId: number,
  sizeLabel?: string | null
): Promise<CartMutationResult> {
  const availability = await productAvailability(env, productId);
  if (!availability.exists) {
    return { ok: false, reason: "not_found" };
  }
  if (!availability.isActive) {
    return { ok: false, reason: "inactive" };
  }
  const resolvedSize = resolveSizeSelection(availability.categorySlug, availability.availableSizesJson, sizeLabel);
  if (!resolvedSize) {
    return { ok: false, reason: "not_found" };
  }

  const existing = await first<{ quantity: number }>(
    env,
    "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size_label = ?",
    userId,
    productId,
    resolvedSize
  );
  const nextQuantity = (existing?.quantity ?? 0) + 1;
  if (availability.stockQty <= 0 || nextQuantity > availability.stockQty) {
    return { ok: false, reason: "out_of_stock" };
  }

  if (!existing) {
    await run(
      env,
      "INSERT INTO cart_items (user_id, product_id, size_label, quantity) VALUES (?, ?, ?, 1)",
      userId,
      productId,
      resolvedSize
    );
    return { ok: true, quantity: 1 };
  }

  await run(
    env,
     `UPDATE cart_items
     SET quantity = quantity + 1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND product_id = ? AND size_label = ?`,
    userId,
    productId,
    resolvedSize
  );
  return { ok: true, quantity: nextQuantity };
}

export async function setCartQuantity(
  env: Env,
  userId: number,
  productId: number,
  sizeLabel: string | null,
  quantity: number
): Promise<CartMutationResult> {
  const availability = await productAvailability(env, productId);
  if (!availability.exists) {
    return { ok: false, reason: "not_found" };
  }
  if (!availability.isActive) {
    return { ok: false, reason: "inactive" };
  }
  const resolvedSize = resolveSizeSelection(availability.categorySlug, availability.availableSizesJson, sizeLabel);
  if (!resolvedSize) {
    return { ok: false, reason: "not_found" };
  }
  if (quantity <= 0) {
    await removeFromCart(env, userId, productId, resolvedSize);
    return { ok: true, quantity: 0 };
  }
  if (availability.stockQty <= 0 || quantity > availability.stockQty) {
    return { ok: false, reason: "out_of_stock" };
  }
  await run(
    env,
     `UPDATE cart_items
     SET quantity = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND product_id = ? AND size_label = ?`,
    quantity,
    userId,
    productId,
    resolvedSize
  );
  return { ok: true, quantity };
}

export async function removeFromCart(
  env: Env,
  userId: number,
  productId: number,
  sizeLabel: string | null
): Promise<void> {
  await run(
    env,
    "DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size_label = ?",
    userId,
    productId,
    sizeLabel?.trim() || ""
  );
}

export async function clearCart(env: Env, userId: number): Promise<void> {
  await run(env, "DELETE FROM cart_items WHERE user_id = ?", userId);
}

export async function getDialogState(env: Env, userId: number): Promise<DialogState> {
  const row = await first<{ state: string; payload: string }>(
    env,
    "SELECT state, payload FROM user_dialogs WHERE user_id = ?",
    userId
  );
  return row ?? { state: DIALOG_NONE, payload: "" };
}

export async function setDialogState(env: Env, userId: number, state: string, payload = ""): Promise<void> {
  const existing = await first<{ user_id: number }>(env, "SELECT user_id FROM user_dialogs WHERE user_id = ?", userId);
  if (!existing) {
    await run(env, "INSERT INTO user_dialogs (user_id, state, payload) VALUES (?, ?, ?)", userId, state, payload);
    return;
  }
  await run(
    env,
    `UPDATE user_dialogs
     SET state = ?, payload = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    state,
    payload,
    userId
  );
}

export async function clearDialogState(env: Env, userId: number): Promise<void> {
  await setDialogState(env, userId, DIALOG_NONE, "");
}

export async function createOrderFromCart(
  env: Env,
  userId: number,
  currency: string,
  botTitle: string
): Promise<OrderDraftResult> {
  const items = await all<{
    product_id: number;
    title: string;
    size_label: string;
    unit_price_stars: number;
    photo_url: string;
    quantity: number;
    stock_qty: number | null;
    is_active: number | null;
  }>(
    env,
    `SELECT
       p.id AS product_id,
       p.title AS title,
       c.size_label AS size_label,
       p.price_stars AS unit_price_stars,
       p.photo_url AS photo_url,
       p.stock_qty AS stock_qty,
       p.is_active AS is_active,
       c.quantity AS quantity
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY p.id`,
    userId
  );
  if (items.length === 0) {
    return { ok: false, reason: "empty_cart" };
  }

  for (const item of items) {
    if ((item.is_active ?? 1) !== 1) {
      return { ok: false, reason: "unavailable_product", title: item.title };
    }
    if ((item.stock_qty ?? 0) < item.quantity) {
      return { ok: false, reason: "out_of_stock", title: item.title };
    }
  }

  const orderId = crypto.randomUUID().replaceAll("-", "");
  const totalStars = items.reduce((sum, item) => sum + item.unit_price_stars * item.quantity, 0);
  const title = `${botTitle} order`;
  const description = items
    .slice(0, 3)
    .map((item) => `${item.title}${item.size_label ? ` (${item.size_label})` : ""} x${item.quantity}`)
    .concat(items.length > 3 ? [`И еще ${items.length - 3} поз.`] : [])
    .join(", ");
  const photoUrl = items[0].photo_url;

  await run(
    env,
    `INSERT INTO orders (
       order_id, user_id, currency, total_stars, status, title, description, photo_url
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    orderId,
    userId,
    currency,
    totalStars,
    ORDER_STATUS_AWAITING_PAYMENT,
    title,
    description,
    photoUrl
  );

  for (const item of items) {
    await run(
      env,
      `INSERT INTO order_items (order_id, product_id, title, size_label, unit_price_stars, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      orderId,
      item.product_id,
      item.title,
      item.size_label || "",
      item.unit_price_stars,
      item.quantity
    );
  }

  return { ok: true, orderId, totalStars, title, description, photoUrl };
}

export async function getOrder(env: Env, orderId: string): Promise<OrderRecord | null> {
  const row = await first<{
    order_id: string;
    user_id: number;
    total_stars: number;
    status: string;
    title: string;
    description: string;
    photo_url: string;
    created_at: string;
  }>(
    env,
    `SELECT order_id, user_id, total_stars, status, title, description, photo_url, created_at
     FROM orders
     WHERE order_id = ?`,
    orderId
  );
  if (!row) {
    return null;
  }
  return {
    orderId: row.order_id,
    userId: row.user_id,
    totalStars: row.total_stars,
    status: row.status,
    title: row.title,
    description: row.description,
    photoUrl: row.photo_url,
    createdAt: row.created_at
  };
}

export async function markOrderPaid(
  env: Env,
  orderId: string,
  telegramPaymentChargeId: string,
  providerPaymentChargeId: string
): Promise<void> {
  const order = await getOrder(env, orderId);
  if (!order) {
    return;
  }
  const items = await all<{ product_id: number; quantity: number }>(
    env,
    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
    orderId
  );
  for (const item of items) {
    await run(
      env,
      `UPDATE products
       SET stock_qty = MAX(stock_qty - ?, 0)
       WHERE id = ?`,
      item.quantity,
      item.product_id
    );
  }
  await run(
    env,
    `UPDATE orders
     SET status = ?, telegram_payment_charge_id = ?, provider_payment_charge_id = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`,
    ORDER_STATUS_PENDING,
    telegramPaymentChargeId,
    providerPaymentChargeId,
    orderId
  );
  await clearCart(env, order.userId);
}

export async function listPendingOrders(env: Env): Promise<PendingOrder[]> {
  const orders = await all<PendingOrderRow>(
    env,
    `SELECT
       o.order_id,
       o.user_id,
       o.total_stars,
       o.status,
       o.created_at,
       u.username,
       u.full_name
     FROM orders o
     JOIN users u ON u.user_id = o.user_id
     WHERE o.status = ?
     ORDER BY o.created_at ASC`,
    ORDER_STATUS_PENDING
  );
  return Promise.all(orders.map((order) => hydratePendingOrder(env, order)));
}

export async function getPendingOrderById(env: Env, orderId: string): Promise<PendingOrder | null> {
  const order = await first<PendingOrderRow>(
    env,
    `SELECT
       o.order_id,
       o.user_id,
       o.total_stars,
       o.status,
       o.created_at,
       u.username,
       u.full_name
     FROM orders o
     JOIN users u ON u.user_id = o.user_id
     WHERE o.order_id = ?`,
    orderId
  );
  if (!order) {
    return null;
  }
  return hydratePendingOrder(env, order);
}

export async function markOrderShipped(env: Env, orderId: string): Promise<OrderRecord | null> {
  const order = await getOrder(env, orderId);
  if (!order || order.status !== ORDER_STATUS_PENDING) {
    return null;
  }
  await run(
    env,
    `UPDATE orders
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`,
    ORDER_STATUS_SHIPPED,
    orderId
  );
  return getOrder(env, orderId);
}

export async function createSupportRequest(
  env: Env,
  userId: number,
  requestType: string,
  messageText: string
): Promise<number> {
  const result = await run(
    env,
    `INSERT INTO support_requests (user_id, request_type, message_text, status)
     VALUES (?, ?, ?, 'open')`,
    userId,
    requestType,
    messageText
  );
  return Number(result.meta.last_row_id);
}

export async function getSupportRequest(env: Env, requestId: number): Promise<SupportRequest | null> {
  const row = await first<{
    id: number;
    user_id: number;
    request_type: string;
    message_text: string;
    status: string;
  }>(
    env,
    `SELECT id, user_id, request_type, message_text, status
     FROM support_requests
     WHERE id = ?`,
    requestId
  );
  if (!row) {
    return null;
  }
  return {
    requestId: row.id,
    userId: row.user_id,
    requestType: row.request_type,
    messageText: row.message_text,
    status: row.status
  };
}

export async function markSupportRequestAnswered(env: Env, requestId: number): Promise<void> {
  await run(
    env,
    `UPDATE support_requests
     SET status = 'answered', answered_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    requestId
  );
}

export async function getAdminCatalogPage(env: Env, page: number): Promise<AdminCatalogPage | null> {
  const count = await first<{ count: number }>(env, "SELECT COUNT(*) AS count FROM products");
  const totalItems = count?.count ?? 0;
  if (totalItems === 0) {
    return null;
  }
  const totalPages = Math.max(1, totalItems);
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const row = await first<ProductRow & { category_title: string }>(
    env,
    `SELECT
       p.id, p.category_slug, p.title, p.description, p.price_stars, p.old_price_stars, p.photo_url,
       p.sku, p.badge, p.stock_qty, p.is_active, p.search_text, p.size_group, p.available_sizes_json, c.title AS category_title
     FROM products p
     JOIN categories c ON c.slug = p.category_slug
     ORDER BY p.id
     LIMIT 1 OFFSET ?`,
    safePage
  );
  if (!row) {
    return null;
  }
  return {
    productId: row.id,
    title: row.title,
    sku: row.sku ?? `SKU-${row.id}`,
    categoryTitle: row.category_title,
    priceStars: row.price_stars,
    oldPriceStars: row.old_price_stars,
    stockQty: row.stock_qty ?? 0,
    isActive: (row.is_active ?? 1) === 1,
    badge: row.badge,
    page: safePage,
    totalPages
  };
}

export async function updateProductStock(env: Env, productId: number, delta: number): Promise<AdminCatalogPage | null> {
  await run(
    env,
    `UPDATE products
     SET stock_qty = MAX(stock_qty + ?, 0)
     WHERE id = ?`,
    delta,
    productId
  );
  return getAdminCatalogPageByProductId(env, productId);
}

export async function toggleProductActive(env: Env, productId: number): Promise<AdminCatalogPage | null> {
  await run(
    env,
    `UPDATE products
     SET is_active = CASE WHEN COALESCE(is_active, 1) = 1 THEN 0 ELSE 1 END
     WHERE id = ?`,
    productId
  );
  return getAdminCatalogPageByProductId(env, productId);
}

export async function getAdminCatalogPageByProductId(env: Env, productId: number): Promise<AdminCatalogPage | null> {
  const pageOffset = await first<{ count: number }>(env, "SELECT COUNT(*) AS count FROM products WHERE id < ?", productId);
  return getAdminCatalogPage(env, pageOffset?.count ?? 0);
}

export async function listStorefrontProducts(
  env: Env,
  options: {
    userId?: number;
    categorySlug?: string;
    query?: string;
    favoritesOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<StorefrontProduct[]> {
  const limit = options.limit ?? 12;
  const offset = options.offset ?? 0;
  const conditions = ["COALESCE(p.is_active, 1) = 1"];
  const params: unknown[] = [];

  if (options.categorySlug) {
    conditions.push("p.category_slug = ?");
    params.push(options.categorySlug);
  }

  if (options.query?.trim()) {
    const normalized = `%${options.query.trim().toLowerCase()}%`;
    conditions.push(
      "(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(COALESCE(p.search_text, '')) LIKE ? OR LOWER(COALESCE(p.sku, '')) LIKE ?)"
    );
    params.push(normalized, normalized, normalized, normalized);
  }

  if (options.favoritesOnly && options.userId) {
    conditions.push("EXISTS (SELECT 1 FROM favorites f WHERE f.product_id = p.id AND f.user_id = ?)");
    params.push(options.userId);
  }

  const rows = await all<{
    id: number;
    category_slug: string;
    category_title: string;
    title: string;
    description: string;
    price_stars: number;
    old_price_stars: number | null;
    photo_url: string;
    sku: string | null;
    badge: string | null;
    stock_qty: number | null;
    is_active: number | null;
    size_group: string | null;
    available_sizes_json: string | null;
    favorite_product_id: number | null;
  }>(
    env,
    `SELECT
       p.id,
       p.category_slug,
       c.title AS category_title,
       p.title,
       p.description,
       p.price_stars,
       p.old_price_stars,
       p.photo_url,
       p.sku,
       p.badge,
       p.stock_qty,
       p.is_active,
       p.size_group,
       p.available_sizes_json,
       uf.product_id AS favorite_product_id
     FROM products p
     JOIN categories c ON c.slug = p.category_slug
     LEFT JOIN favorites uf ON uf.product_id = p.id AND uf.user_id = ?
     WHERE ${conditions.join(" AND ")}
     ORDER BY p.id
     LIMIT ? OFFSET ?`,
    options.userId ?? 0,
    ...params,
    limit,
    offset
  );

  return rows.map((row) => ({
    productId: row.id,
    categorySlug: row.category_slug,
    categoryTitle: row.category_title,
    title: row.title,
    description: row.description,
    priceStars: row.price_stars,
    oldPriceStars: row.old_price_stars,
    photoUrl: row.photo_url,
    sku: row.sku ?? `SKU-${row.id}`,
    badge: row.badge,
    stockQty: row.stock_qty ?? 0,
    isActive: (row.is_active ?? 1) === 1,
    isFavorite: !!row.favorite_product_id,
    sizeGroup: row.size_group ?? defaultSizeGroup(row.category_slug),
    availableSizes: normalizeAvailableSizes(row.category_slug, row.available_sizes_json)
  }));
}

export async function getStorefrontCounts(env: Env, userId?: number): Promise<{
  cartQuantity: number;
  favoritesCount: number;
}> {
  const cart = userId ? await getCartSnapshot(env, userId) : { totalQuantity: 0 };
  const favoritesCountRow = userId
    ? await first<{ count: number }>(env, "SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?", userId)
    : { count: 0 };
  return {
    cartQuantity: cart.totalQuantity,
    favoritesCount: favoritesCountRow?.count ?? 0
  };
}

async function hydratePendingOrder(env: Env, order: PendingOrderRow): Promise<PendingOrder> {
  const items = await all<{
    title: string;
    size_label: string;
    quantity: number;
    unit_price_stars: number;
  }>(
    env,
    `SELECT title, size_label, quantity, unit_price_stars
     FROM order_items
     WHERE order_id = ?
     ORDER BY product_id, size_label`,
    order.order_id
  );
  return {
    orderId: order.order_id,
    userId: order.user_id,
    username: order.username,
    fullName: order.full_name,
    totalStars: order.total_stars,
    status: order.status,
    createdAt: order.created_at,
    items: items.map((item) => ({
      title: item.size_label ? `${item.title} [${item.size_label}]` : item.title,
      quantity: item.quantity,
      subtotalStars: item.quantity * item.unit_price_stars
    }))
  };
}
