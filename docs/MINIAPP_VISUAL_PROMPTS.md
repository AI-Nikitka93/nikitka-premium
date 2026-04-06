# Mini App Visual Prompts

Текущий редизайн Mini App уже работает без дополнительных картинок: основа сделана на CSS.

Если захочешь усилить витрину отдельными фирменными визуалами, можно сгенерировать:

## 1. Hero Background Artwork

Файл:
- `public/products/miniapp-hero-background.jpg`

Промпт:
```text
Создай дизайнерское background artwork для premium Telegram Mini App storefront бренда Nikitka AI.

Концепция:
- Belarus heritage luxury visual
- использовать красно-зеленую палитру Беларуси
- добавить Мирский и Несвижский замок как абстрактные силуэты
- добавить современный орнамент, переработанный в premium graphic system
- добавить туманные слои, дорогую глубину, editorial composition
- никаких туристических клише
- никаких white-red-white references
- визуал должен выглядеть как дорогой fashion campaign background, а не постер из сувенирной лавки
- clean composition
- elegant geometry
- muted cream, sand, graphite background structure
- no text

Цвета:
- deep red
- dark green
- graphite
- warm sand
- muted cream

Формат:
- vertical 4:5
- high resolution
- premium editorial style
- clean layered graphic
- suitable as hero background image
```

## 2. Button Ornament Mark

Файл:
- `public/products/miniapp-button-ornament.png`

Промпт:
```text
Создай дизайнерский premium ornament mark для кнопок и UI-акцентов fashion storefront бренда Nikitka AI.

Концепция:
- small Belarus-inspired luxury emblem
- modern geometric ornament
- deep red and dark green palette
- subtle gold detail allowed
- no cheap souvenir vibe
- looks like premium icon for buttons, pills, badges and category accents
- clean transparent background
- no text

Формат:
- square
- transparent background
- crisp premium symbol
- should work at small sizes
```

## 3. Category Ribbon Texture

Файл:
- `public/products/miniapp-ribbon-texture.png`

Промпт:
```text
Создай узкий premium texture strip для интерфейса fashion storefront бренда Nikitka AI.

Концепция:
- Belarus-inspired ribbon texture
- red and green premium stripe logic
- subtle ornament geometry
- elegant designer UI texture
- not loud, not touristy
- no text
- transparent or soft fade edges

Формат:
- horizontal strip
- high resolution
- suitable for UI dividers and decorative bars
```

## Куда класть

Если сгенерируешь эти файлы, клади сюда:

- `public/products/miniapp-hero-background.jpg`
- `public/products/miniapp-button-ornament.png`
- `public/products/miniapp-ribbon-texture.png`

После этого я смогу встроить их в:

- [cloudflare/src/miniapp.ts](/m:/Projects/Bot/test1/cloudflare/src/miniapp.ts)
