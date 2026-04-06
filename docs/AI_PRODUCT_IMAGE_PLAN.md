# AI Product Image Plan

Этот файл нужен, чтобы быстро заменить тестовые `placehold.co` изображения на нормальные AI-рендеры товаров.

## Куда класть картинки

Для текущего Cloudflare-бота локальная папка сама по себе не подойдет: бот и Mini App ожидают `public HTTPS URL` в поле `photo_url`.

Нормальный вариант:

1. Сгенерировать картинки.
2. Сохранить локально в папку:
   - `assets/products/`
3. Залить их в публичное хранилище:
   - предпочтительно `Cloudflare R2`
4. Получить публичные URL вида:
   - `https://pub-<your-bucket-id>.r2.dev/products/silk-touch-tee-01.jpg`
   - `https://pub-<your-bucket-id>.r2.dev/products/monogram-tee-01.jpg`

Если R2 пока не подключен, временно можно использовать любой публичный HTTPS-хостинг изображений. Для прод-портфолио лучше R2.

## Локальная структура файлов

Создай файлы в:

- `assets/products/silk-touch-tee-01.jpg`
- `assets/products/monogram-tee-01.jpg`
- `assets/products/tailored-hoodie-01.jpg`
- `assets/products/studio-zip-hoodie-01.jpg`
- `assets/products/raw-indigo-jeans-01.jpg`
- `assets/products/modern-straight-jeans-01.jpg`

## Куда подставлять URL в коде

Замени `photo_url` в:

- [cloudflare/seeds/0001_seed_catalog.sql](/m:/Projects/Bot/test1/cloudflare/seeds/0001_seed_catalog.sql)
- [cloudflare/src/constants.ts](/m:/Projects/Bot/test1/cloudflare/src/constants.ts)
- при необходимости в legacy-версии: [app/constants.py](/m:/Projects/Bot/test1/app/constants.py)

После замены URL для Cloudflare-прода выполни:

```bat
npm run cf:seed:remote
cmd /c deploy-cloudflare.bat
```

## Общие требования к AI-изображениям

- формат: `4:5`
- размер: `1200x1500` или `1600x2000`
- стиль: premium fashion campaign / clean studio ecommerce
- фон: светлый, чистый, без лишних объектов
- 1 товар = 1 главный объект
- без текста, логотипов, водяных знаков
- без лишних рук, пальцев, искажений ткани
- свет мягкий студийный
- кадр ровный, фронтальный или слегка под углом

## Фирменный стиль бренда

Во все промпты добавляй одно и то же ДНК бренда:

- premium modern streetwear
- understated luxury
- clean tailoring
- neutral palette
- tactile fabric
- no mass-market vibe
- calm expensive visual language
- subtle premium branding with the text "Nikitka AI"

Базовый фирменный модификатор:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI"`

Правило брендинга:

- бренд должен быть встроен в вещь аккуратно
- не огромный принт на всю грудь
- лучше как маленькая вышивка, аккуратный chest mark, woven label или минимальный typography detail
- текст бренда: `Nikitka AI`
- надпись должна быть читаемой
- цвет надписи или патча должен контрастировать с цветом самой одежды
- нельзя делать branding тон-в-тон с тканью
- брендинг должен быть размещен в заметной, но премиальной зоне: chest mark, sleeve patch, neck label detail, waistband patch

Правило контраста:

- на светлой одежде использовать темный брендовый текст: `charcoal`, `deep graphite`, `espresso brown`
- на темной одежде использовать светлый брендовый текст: `ivory`, `warm sand`, `soft silver`
- для денима использовать контрастный patch или woven label: `sand patch`, `ivory label`, `copper embroidery`

Правило оригинальности:

- не использовать только банальные однотонные решения без акцента
- у каждой вещи должен быть один фирменный акцент besides base color
- акцент может быть через:
  - контрастную вышивку `Nikitka AI`
  - sleeve patch
  - woven hem label
  - waistband patch
  - contrast stitching

## Негативный промпт

Используй почти для всех:

`low quality, blurry, noisy, distorted garment, extra fingers, extra hands, duplicated clothing, warped sleeves, bad stitching, text, watermark, logo, oversaturated, messy background, cropped product, mannequin artifacts`

## Промпты

Ниже для каждого товара есть 2 версии:

- `Packshot` — для основной карточки товара
- `Editorial` — для дополнительного фирменного кадра

### 1. Silk Touch Tee

Файл:
- `assets/products/silk-touch-tee-01.jpg`
- `assets/products/silk-touch-tee-02.jpg`

Packshot:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI", premium white luxury t-shirt, dense cotton fabric, clean silhouette, minimal fashion ecommerce product photo, front view, soft studio lighting, subtle fabric texture, premium tailoring, small embroidered chest branding with text "Nikitka AI", isolated on warm light beige background, no model, centered composition, 4:5`

Editorial:

`premium modern streetwear brand, understated luxury, quiet luxury aesthetic, editorial fashion campaign, male model wearing a premium white t-shirt with subtle chest branding text "Nikitka AI", dense cotton fabric, minimal styling, clean relaxed trousers, soft directional studio light, neutral beige backdrop, expensive calm mood, realistic garment texture, luxury lookbook composition, 4:5`

### 2. Monogram Tee

Файл:
- `assets/products/monogram-tee-01.jpg`
- `assets/products/monogram-tee-02.jpg`

Packshot:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI", premium black minimal t-shirt, structured cotton jersey, urban luxury fashion ecommerce product photo, front view, soft diffused studio lighting, clean hem and sleeve construction, subtle premium texture, small tonal chest branding with text "Nikitka AI", isolated on soft gray-beige background, realistic folds, centered composition, 4:5`

Editorial:

`premium modern streetwear brand, quiet luxury aesthetic, editorial fashion portrait, model wearing a premium black minimal t-shirt with subtle chest branding text "Nikitka AI", monochrome styling, dark straight pants, soft studio shadows, muted taupe backdrop, calm expensive luxury streetwear mood, realistic cotton texture, clean composition, 4:5`

### 3. Tailored Hoodie

Файл:
- `assets/products/tailored-hoodie-01.jpg`
- `assets/products/tailored-hoodie-02.jpg`

Packshot:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI", premium gray hoodie, heavyweight french terry cotton, tailored relaxed fit, luxury streetwear ecommerce product photo, front view, crisp hood structure, soft studio lighting, premium construction details, small embroidered chest branding with text "Nikitka AI", clean minimalist background, elegant neutral tones, realistic fabric texture, centered high-end fashion composition, 4:5`

Editorial:

`premium modern streetwear brand, editorial fashion campaign, model wearing a premium gray hoodie with subtle branding text "Nikitka AI" on the chest, heavyweight cotton fleece, clean relaxed fit, luxury streetwear styling, neutral studio backdrop, soft dramatic side lighting, expensive calm tone, realistic fabric drape, high-end lookbook image, 4:5`

### 4. Studio Zip Hoodie

Файл:
- `assets/products/studio-zip-hoodie-01.jpg`
- `assets/products/studio-zip-hoodie-02.jpg`

Packshot:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI", premium graphite zip hoodie, minimalist luxury streetwear, clean front-facing ecommerce product render, high-quality cotton fleece, structured zipper line, soft studio shadows, realistic premium texture, small chest branding with text "Nikitka AI", isolated on muted warm gray background, centered composition, 4:5`

Editorial:

`premium modern streetwear brand, editorial street-luxury campaign, model wearing a graphite zip hoodie half-zipped with subtle chest branding text "Nikitka AI", clean layered styling, premium minimal look, soft studio lighting, neutral gray-beige backdrop, refined expensive mood, realistic cotton fleece texture, 4:5`

### 5. Raw Indigo Jeans

Файл:
- `assets/products/raw-indigo-jeans-01.jpg`
- `assets/products/raw-indigo-jeans-02.jpg`

Packshot:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI", premium raw indigo straight jeans, luxury denim ecommerce product photo, front view, rich dark indigo color, structured straight fit, subtle premium stitching, realistic denim texture, small branded waistband patch or premium label with text "Nikitka AI", soft studio lighting, clean beige-gray background, high-end fashion catalog style, centered composition, 4:5`

Editorial:

`premium modern streetwear brand, editorial luxury denim campaign, model wearing raw indigo straight jeans with a subtle visible branded patch reading "Nikitka AI", minimal premium styling, tucked neutral top, soft studio light, refined expensive mood, realistic denim texture and stitching, clean warm gray backdrop, 4:5`

### 6. Modern Straight Jeans

Файл:
- `assets/products/modern-straight-jeans-01.jpg`
- `assets/products/modern-straight-jeans-02.jpg`

Packshot:

`premium modern streetwear brand, understated luxury, clean tailoring, tactile fabric, refined silhouette, quiet luxury aesthetic, elevated ecommerce campaign, realistic garment construction, subtle premium branding with readable text "Nikitka AI", premium dark gray straight jeans, minimalist luxury denim product photo, clean front view, modern tailored fit, refined premium wash, realistic stitching and pocket details, small branded waistband patch or luxury label with text "Nikitka AI", soft studio lighting, elegant neutral background, fashion ecommerce campaign aesthetic, centered composition, 4:5`

Editorial:

`premium modern streetwear brand, editorial menswear campaign, model wearing premium dark gray straight jeans with a subtle branded patch reading "Nikitka AI", clean modern fit, luxury minimalist styling, soft diffused studio light, neutral backdrop, quiet expensive visual language, realistic denim details, 4:5`

## Улучшенная версия для более живой витрины

Если хочешь не только packshot, а более дорогой вид, сгенерируй по 2 изображения на товар:

- `*-01.jpg` — чистый studio packshot
- `*-02.jpg` — editorial shot на модели

Пример editorial prompt:

`luxury fashion editorial shot of a model wearing a premium gray hoodie, clean premium streetwear styling, soft studio lighting, elegant neutral backdrop, high-end brand campaign look, realistic garment texture, minimal composition, 4:5`

Но для карточек каталога основным URL лучше оставлять именно `*-01.jpg`.

## Быстрый mapping URL

Когда загрузишь картинки в R2, замени ссылки так:

- `Silk Touch Tee` -> `https://.../products/silk-touch-tee-01.jpg`
- `Monogram Tee` -> `https://.../products/monogram-tee-01.jpg`
- `Tailored Hoodie` -> `https://.../products/tailored-hoodie-01.jpg`
- `Studio Zip Hoodie` -> `https://.../products/studio-zip-hoodie-01.jpg`
- `Raw Indigo Jeans` -> `https://.../products/raw-indigo-jeans-01.jpg`
- `Modern Straight Jeans` -> `https://.../products/modern-straight-jeans-01.jpg`

## Belarus Heritage Drop 01

Ниже новая более оригинальная линейка для бренда `Nikitka AI`.
Концепция: современный premium streetwear, вдохновленный Беларусью, но без ощущения дешевого сувенира.

Общие правила для всей линейки:

- бренд: `Nikitka AI`
- стиль: `premium modern streetwear`, `quiet luxury`, `designer heritage capsule`
- обязательна белорусская тема
- можно использовать:
  - белорусский орнамент
  - мотивы флага Беларуси
  - силуэты Мирского и Несвижского замков
  - зубра
  - васильки
  - леса, туманы, реки и болота Полесья
  - урбанистику Минска
- не делать вещи похожими на сувенирную лавку
- дизайн должен выглядеть как дорогая дизайнерская капсула
- надпись `Nikitka AI` должна быть читаемой
- графика должна быть интегрирована в одежду как fashion design element

### 1. White Tee "Belarus Ornament Core"

```text
Создай фотореалистичное e-commerce изображение белой премиальной футболки бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- современная премиальная белая футболка
- главный дизайнерский акцент: крупная, но элегантная красно-графитовая полоса орнамента в белорусской эстетике
- орнамент должен быть переработан в luxury streetwear style
- не этно-костюм, а современная дизайнерская вещь
- на груди или в нижней части композиции должна быть читаемая надпись "Nikitka AI"
- надпись сделать контрастной: deep graphite or dark red
- орнамент должен выглядеть дорого и минималистично

Требования:
- плотный премиальный хлопок
- clean silhouette
- фронтальный packshot
- формат 4:5
- теплый светлый фон
- soft studio light
- luxury ecommerce fashion photo
- без модели, без манекена, без вешалки
```

### 2. Black Tee "Flag Motion"

```text
Создай фотореалистичное e-commerce изображение черной премиальной футболки бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- черная дизайнерская футболка
- основной визуальный элемент: абстрактная диагональная композиция, вдохновленная флагом Беларуси
- использовать глубокий красный, темный зеленый и тонкий белый орнаментальный акцент
- это должно выглядеть как luxury designer graphic, а не просто флаг
- надпись "Nikitka AI" встроить в графику и сделать читаемой, светлой или серебристой

Требования:
- premium cotton jersey
- дорогая фактура
- фронтальный ракурс
- clean soft taupe background
- studio lighting
- premium fashion storefront style
- без модели
```

### 3. Oversized Tee "Zubr Line"

```text
Создай фотореалистичное e-commerce изображение премиальной oversize футболки бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- молочно-белая или light sand oversized t-shirt
- центральный дизайнерский мотив: минималистичная линейная графика зубра
- графика должна быть выполнена как дорогой art print в графитовом и темно-красном цвете
- добавить маленькую читаемую подпись "Nikitka AI"
- общий стиль: premium streetwear art piece inspired by Belarusian wildlife

Требования:
- фотореализм
- плотный premium cotton
- front ecommerce packshot
- format 4:5
- soft studio lighting
- clean background
- no mannequin, no hanger
```

### 4. Gray Hoodie "Minsk Grid"

```text
Создай фотореалистичное e-commerce изображение премиального серого худи бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- светло-серый heavyweight hoodie
- дизайн вдохновлен урбанистикой Минска: строгая геометрия, архитектурные линии, grid composition
- на груди маленький читаемый текст "Nikitka AI"
- на спине или в нижней части худи абстрактная архитектурная схема в стиле modern brutal elegance
- цвета графики: graphite, muted red, stone gray
- выглядит как luxury city capsule

Требования:
- clean premium silhouette
- readable branding
- front product shot
- format 4:5
- neutral studio background
- soft light
- no model
```

### 5. Black Hoodie "Castle Shadows"

```text
Создай фотореалистичное e-commerce изображение премиального черного худи бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- черный premium hoodie
- дизайнерская тема: силуэты Мирского и Несвижского замков, переработанные в темную luxury graphic composition
- использовать оттенки black, charcoal, dark burgundy, muted stone
- спереди маленький контрастный брендинг "Nikitka AI" цвета ivory
- графика должна выглядеть как дорогой editorial streetwear print, а не туристический сувенир

Требования:
- heavyweight cotton fleece
- premium folds
- front packshot
- format 4:5
- clean soft background
- photorealistic
```

### 6. Zip Hoodie "Red Forest Signal"

```text
Создай фотореалистичное e-commerce изображение премиального графитового худи на молнии бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- graphite zip hoodie
- фирменный акцент: абстрактный красный лесной мотив, вдохновленный белорусскими хвойными лесами
- графика должна быть выполнена как premium tonal print plus red accent
- текст "Nikitka AI" сделать читаемым светлым цветом
- можно добавить sleeve patch с маленьким орнаментом
- выглядит как luxury outdoor streetwear capsule

Требования:
- premium fleece
- ровная молния
- front view
- format 4:5
- elegant neutral background
- soft studio shadow
```

### 7. Crewneck "Cornflower Code"

```text
Создай фотореалистичное e-commerce изображение премиального crewneck свитшота бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- теплый off-white или oatmeal crewneck
- главный мотив: василек как переработанный цифровой символ
- сделать graphic embroidery or print в оттенках blue, red, graphite
- добавить читаемый бренд "Nikitka AI"
- дизайн должен сочетать природу и digital premium fashion language

Требования:
- heavyweight premium cotton
- front product shot
- clean centered composition
- format 4:5
- luxury ecommerce look
- photorealistic
```

### 8. Coach Jacket "Nesvizh Night"

```text
Создай фотореалистичное e-commerce изображение премиальной coach jacket бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- темно-оливковая или deep graphite jacket
- вдохновение: ночной силуэт Несвижского замка
- графика минимальная, luxury, placed on back or chest zone conceptually
- front side должна иметь маленький читаемый логотип "Nikitka AI"
- стиль: premium historical-modern fusion
- не костюмно, а very contemporary designer outerwear

Требования:
- premium nylon or matte technical fabric look
- front packshot
- clean elegant background
- 4:5
- soft studio lighting
```

### 9. Windbreaker "Polesie Mist"

```text
Создай фотореалистичное e-commerce изображение премиальной windbreaker куртки бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- тонкая дизайнерская ветровка
- цвет: fog gray with muted swamp green accents
- вдохновение: туманы Полесья, реки, болота, влажный воздух
- использовать плавные градиентные линии и один контрастный красный акцент
- добавить читаемый брендинг "Nikitka AI"
- общий вид: luxury technical streetwear inspired by Belarusian landscape

Требования:
- front product image
- premium outerwear presentation
- format 4:5
- neutral soft background
- realistic technical fabric
```

### 10. Denim Jacket "Heritage Patch"

```text
Создай фотореалистичное e-commerce изображение премиальной джинсовой куртки бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- dark indigo denim jacket
- главный акцент: крупный дизайнерский patch на спине, вдохновленный белорусским орнаментом
- patch должен выглядеть дорого, как woven designer panel
- на груди маленький читаемый бренд "Nikitka AI"
- можно добавить контрастную красную строчку
- стиль: premium heritage denim capsule

Требования:
- realistic denim texture
- front ecommerce packshot
- format 4:5
- soft luxury light
- clean background
```

### 11. Raw Denim Jeans "State Line"

```text
Создай фотореалистичное e-commerce изображение премиальных raw denim jeans бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- темный premium denim
- акцент: waistband patch в цветах warm sand, red and green inspired by Belarusian identity
- patch должен быть дизайнерским и дорогим
- добавить subtle contrast stitching
- бренд "Nikitka AI" должен быть читаемым на patch
- общий стиль: quiet luxury denim with Belarusian coded details

Требования:
- front product shot
- realistic denim texture
- premium lighting
- format 4:5
- clean background
```

### 12. Gray Cargo Pants "Border Rhythm"

```text
Создай фотореалистичное e-commerce изображение премиальных серо-графитовых cargo pants бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- luxury cargo pants
- акцентные линии и детали вдохновлены ритмом белорусского орнамента
- использовать red stitching accents and subtle green tab detail
- бренд "Nikitka AI" должен быть читаемым на карманном label
- выглядит как premium tactical streetwear, не military costume

Требования:
- realistic fabric
- front ecommerce shot
- 4:5
- soft studio background
- premium minimal presentation
```

### 13. Knit Polo "Slavic Minimal"

```text
Создай фотореалистичное e-commerce изображение премиального knit polo бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- premium knit polo цвета warm sand or muted stone
- на вороте или планке тонкий красно-зеленый акцент, вдохновленный Беларусью
- маленький читаемый логотип "Nikitka AI"
- общий стиль: refined Slavic minimal luxury
- вещь должна выглядеть очень дорого и небанально

Требования:
- photorealistic knit texture
- front centered packshot
- format 4:5
- elegant neutral background
- soft premium light
```

### 14. Puffer Vest "Bison Winter"

```text
Создай фотореалистичное e-commerce изображение премиального пухового жилета бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- deep forest green or charcoal puffer vest
- вдохновение: зимний белорусский лес и мощь зубра
- графика минимальная, но можно добавить abstract bison horn line motif
- текст "Nikitka AI" должен быть читаемым и контрастным
- визуал как luxury winter streetwear drop

Требования:
- premium outerwear look
- front product image
- format 4:5
- neutral foggy background
- photorealistic
```

### 15. Varsity Jacket "Red Line Minsk"

```text
Создай фотореалистичное e-commerce изображение премиальной varsity jacket бренда Nikitka AI из коллекции Belarus Heritage Drop 01.

Концепция:
- дизайнерская varsity jacket
- основа: dark graphite body, contrasting sleeves
- вдохновение: красная линия метро Минска как графический элемент
- добавить тонкий белорусский орнаментальный мотив на ribbing или patch
- логотип "Nikitka AI" должен быть читаемым и интегрированным в дизайн
- стиль: premium city heritage streetwear

Требования:
- realistic premium materials
- front ecommerce packshot
- format 4:5
- elegant clean background
- soft studio light
```

## Belarus Heritage Footwear Drop 01

Ниже отдельная обувная линейка бренда `Nikitka AI`.

Критические ограничения для всей обуви:

- использовать только красно-зеленую государственную цветовую логику Беларуси
- можно добавлять графитовый, темно-серый, песочный, металлический, темно-коричневый
- не использовать бело-красно-белую композицию как главный визуальный код
- не делать никаких отсылок к бело-красно-белому флагу
- если нужен светлый цвет, использовать `warm sand`, `stone`, `oat`, `muted beige`, а не ярко-белый флаговый контраст
- все модели должны выглядеть как designer footwear, а не спортивный массмаркет или сувенирка

Обязательные элементы для всей линейки:

- бренд `Nikitka AI` должен быть читаемым
- можно размещать бренд на tongue label, heel tab, side embroidery, outsole detail
- белорусская тема должна читаться через формы, линии, орнамент, архитектуру, лес, туман, метро, зубра, а не через прямолинейную агитацию
