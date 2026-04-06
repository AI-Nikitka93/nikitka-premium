INSERT INTO categories (slug, title) VALUES
  ('tshirts', 'Футболки'),
  ('hoodies', 'Худи'),
  ('jeans', 'Джинсы')
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title;

INSERT INTO products (
  id, category_slug, title, description, price_stars, photo_url,
  old_price_stars, sku, badge, stock_qty, is_active, search_text
) VALUES
  (1, 'tshirts', 'Silk Touch Tee', 'Плотный премиальный хлопок, ровная посадка и чистая фактура для базового образа.', 249, 'https://placehold.co/1200x1600/png?text=Silk+Touch+Tee', 299, 'TEE-001', 'Bestseller', 12, 1, 'silk touch tee футболка белая хлопок premium bestseller'),
  (2, 'tshirts', 'Monogram Tee', 'Лаконичная футболка с чистым кроем и мягкой обработкой швов под городской гардероб.', 279, 'https://placehold.co/1200x1600/png?text=Monogram+Tee', NULL, 'TEE-002', 'New', 8, 1, 'monogram tee футболка черная минимализм new'),
  (3, 'hoodies', 'Tailored Hoodie', 'Плотное футер-полотно, капюшон держит форму, посадка relaxed premium.', 389, 'https://placehold.co/1200x1600/png?text=Tailored+Hoodie', 449, 'HD-001', 'Limited', 6, 1, 'tailored hoodie худи серый premium limited'),
  (4, 'hoodies', 'Studio Zip Hoodie', 'Минималистичный худи на молнии для layered-образов и ежедневного wear.', 419, 'https://placehold.co/1200x1600/png?text=Studio+Zip+Hoodie', NULL, 'HD-002', 'Core', 10, 1, 'studio zip hoodie худи на молнии графит core'),
  (5, 'jeans', 'Raw Indigo Jeans', 'Прямой силуэт, плотный деним и глубокий оттенок индиго.', 499, 'https://placehold.co/1200x1600/png?text=Raw+Indigo+Jeans', 549, 'JN-001', 'Archive', 5, 1, 'raw indigo jeans джинсы темный деним archive'),
  (6, 'jeans', 'Modern Straight Jeans', 'Чистая линия, комфортная посадка и универсальный темно-серый wash.', 529, 'https://placehold.co/1200x1600/png?text=Modern+Straight+Jeans', NULL, 'JN-002', 'Premium', 9, 1, 'modern straight jeans джинсы серые premium straight')
ON CONFLICT(id) DO UPDATE SET
  category_slug = excluded.category_slug,
  title = excluded.title,
  description = excluded.description,
  price_stars = excluded.price_stars,
  photo_url = excluded.photo_url,
  old_price_stars = excluded.old_price_stars,
  sku = excluded.sku,
  badge = excluded.badge,
  stock_qty = excluded.stock_qty,
  is_active = excluded.is_active,
  search_text = excluded.search_text;

UPDATE products
SET category_slug = 'tshirts',
    title = 'Silk Touch Tee',
    description = 'Плотный премиальный хлопок, ровная посадка и чистая фактура для базового образа.',
    price_stars = 249,
    photo_url = 'https://placehold.co/1200x1600/png?text=Silk+Touch+Tee',
    old_price_stars = 299,
    sku = 'TEE-001',
    badge = 'Bestseller',
    stock_qty = 12,
    is_active = 1,
    search_text = 'silk touch tee футболка белая хлопок premium bestseller'
WHERE id = 1;

UPDATE products
SET category_slug = 'tshirts',
    title = 'Monogram Tee',
    description = 'Лаконичная футболка с чистым кроем и мягкой обработкой швов под городской гардероб.',
    price_stars = 279,
    photo_url = 'https://placehold.co/1200x1600/png?text=Monogram+Tee',
    old_price_stars = NULL,
    sku = 'TEE-002',
    badge = 'New',
    stock_qty = 8,
    is_active = 1,
    search_text = 'monogram tee футболка черная минимализм new'
WHERE id = 2;

UPDATE products
SET category_slug = 'hoodies',
    title = 'Tailored Hoodie',
    description = 'Плотное футер-полотно, капюшон держит форму, посадка relaxed premium.',
    price_stars = 389,
    photo_url = 'https://placehold.co/1200x1600/png?text=Tailored+Hoodie',
    old_price_stars = 449,
    sku = 'HD-001',
    badge = 'Limited',
    stock_qty = 6,
    is_active = 1,
    search_text = 'tailored hoodie худи серый premium limited'
WHERE id = 3;

UPDATE products
SET category_slug = 'hoodies',
    title = 'Studio Zip Hoodie',
    description = 'Минималистичный худи на молнии для layered-образов и ежедневного wear.',
    price_stars = 419,
    photo_url = 'https://placehold.co/1200x1600/png?text=Studio+Zip+Hoodie',
    old_price_stars = NULL,
    sku = 'HD-002',
    badge = 'Core',
    stock_qty = 10,
    is_active = 1,
    search_text = 'studio zip hoodie худи на молнии графит core'
WHERE id = 4;

UPDATE products
SET category_slug = 'jeans',
    title = 'Raw Indigo Jeans',
    description = 'Прямой силуэт, плотный деним и глубокий оттенок индиго.',
    price_stars = 499,
    photo_url = 'https://placehold.co/1200x1600/png?text=Raw+Indigo+Jeans',
    old_price_stars = 549,
    sku = 'JN-001',
    badge = 'Archive',
    stock_qty = 5,
    is_active = 1,
    search_text = 'raw indigo jeans джинсы темный деним archive'
WHERE id = 5;

UPDATE products
SET category_slug = 'jeans',
    title = 'Modern Straight Jeans',
    description = 'Чистая линия, комфортная посадка и универсальный темно-серый wash.',
    price_stars = 529,
    photo_url = 'https://placehold.co/1200x1600/png?text=Modern+Straight+Jeans',
    old_price_stars = NULL,
    sku = 'JN-002',
    badge = 'Premium',
    stock_qty = 9,
    is_active = 1,
    search_text = 'modern straight jeans джинсы серые premium straight'
WHERE id = 6;
