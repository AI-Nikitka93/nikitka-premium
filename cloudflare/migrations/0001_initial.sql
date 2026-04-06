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
  search_text TEXT NOT NULL DEFAULT ''
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
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id)
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
  unit_price_stars INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  PRIMARY KEY (order_id, product_id)
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
