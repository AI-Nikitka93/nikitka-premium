# NIKITKA PREMIUM

Демо Telegram-бота и Mini App витрины на Cloudflare Workers, D1, Telegram Bot API и OpenRouter.

**Язык:** [English](README.md) | [Русский](README.ru.md)

> [!IMPORTANT]
> Это portfolio-проект и тестовый концепт. Реального магазина не существует, товары не продаются, а изображения и ассортимент используются только для демонстрации.

> [!WARNING]
> Репозиторий открыт для ознакомления, а не как open-source база для переиспользования. Смотрите [LICENSE](LICENSE) и [NOTICE.md](NOTICE.md).

![NIKITKA PREMIUM Mini App visual](public/miniapp/hero-background.jpeg)

## Быстрые ссылки

- Бот: <https://t.me/botikovodlj_bot>
- Mini App: <https://flat-brook-a0f7.zimoaiart.workers.dev/app>
- Production Worker: <https://flat-brook-a0f7.zimoaiart.workers.dev>
- Healthcheck: <https://flat-brook-a0f7.zimoaiart.workers.dev/healthz>
- Webhook endpoint: <https://flat-brook-a0f7.zimoaiart.workers.dev/telegram/webhook>

## Что это такое

`NIKITKA PREMIUM` — это solo-built, AI-assisted проект Telegram-витрины в визуальном направлении Belarus Heritage.

Проект задуман как portfolio-case, который показывает, что разработчик может за короткий срок пройти путь от идеи до рабочего бота и Mini App, даже без предыдущего коммерческого опыта именно в этом стеке.

Внутри проекта есть:

- Telegram-бот с каталогом, поиском, избранным, корзиной, checkout и admin flow
- Telegram Mini App витрина с mobile-first интерфейсом
- AI-менеджер для подбора подарков, размеров, образов и товаров
- Cloudflare-first deployment с Worker assets, D1 и Queue-уведомлениями
- безопасный публичный demo-режим Mini App вне Telegram

## Зачем этот проект

Это публичный demo-case того, как можно собрать production-like Telegram commerce flow на недорогом стеке. Проект показывает:

- живой bot + Mini App surface
- реалистичный checkout и admin workflow
- AI-помощника внутри Telegram
- deployable Cloudflare Workers архитектуру без дорогой инфраструктуры

## Что это демонстрирует

Этот репозиторий должен показать работодателям и клиентам, что я умею:

- быстро осваивать новый стек и превращать его в рабочий продукт
- собирать Telegram-бота и Mini App solo с AI-assisted workflow
- связывать backend, UI, data storage и AI-фичи в один целостный flow
- доводить проект от концепта до живого публичного demo за короткий срок
- упаковывать результат как профессиональный GitHub portfolio project

## Моя роль

Это solo portfolio build. Я использовал AI как ускоритель, но архитектура, интеграция, deployment flow, packaging репозитория и финальные implementation decisions были за мной.

## Быстрый старт

Сейчас рекомендуемый deployment target — Cloudflare implementation.

```powershell
.\install.bat
Copy-Item ".dev.vars.example" ".dev.vars" -ErrorAction SilentlyContinue
```

Заполни `.dev.vars` минимум такими значениями:

- `BOT_TOKEN`
- `ADMIN_CHAT_ID`
- `BOT_USERNAME`
- `WEBHOOK_SECRET_TOKEN`
- `WORKER_PUBLIC_URL`
- `OPENROUTER_API_KEY`

После этого:

```powershell
npm run cf:build
.\deploy-cloudflare.bat
```

Подробный setup — в [docs/getting-started.md](docs/getting-started.md).

## Проверка

```powershell
npm run cf:build
.\.venv\Scripts\python.exe -m pytest
```

В репозитории все еще лежит старый Python/Vercel implementation для истории, но активный production path сейчас Cloudflare-first.

## Возможности

### Telegram-бот

- `/start`, `/catalog`, `/cart`, `/search`, `/favorites`, `/contact`, `/aihelp`, `/admin`
- inline product cards и навигация по категориям
- управление корзиной и checkout через Telegram Stars
- support escalation и admin reply loop
- отдельный режим общения с AI-менеджером

### Mini App

- публичная витрина на `/app`
- категории, поиск, избранное и корзина
- Telegram-authenticated session flow с demo fallback
- mobile и tablet-oriented layout
- checkout handoff обратно в чат с ботом

### AI-менеджер

- подбор подарков и образов
- size-aware рекомендации
- короткие живые ответы внутри бота
- товарные подсказки в Telegram-ответах
- guardrails против off-topic и попыток вытащить внутренние настройки

## Архитектура

Основные request surfaces:

- `POST /telegram/webhook` принимает Telegram updates
- `GET /app` рендерит Mini App shell
- `GET/POST /api/miniapp/*` обслуживает storefront, cart, favorites, checkout и assistant API
- `GET /healthz` возвращает health probe Worker'а

Ключевые файлы:

- [cloudflare/src/worker.ts](cloudflare/src/worker.ts)
- [cloudflare/src/db.ts](cloudflare/src/db.ts)
- [cloudflare/src/assistant.ts](cloudflare/src/assistant.ts)
- [cloudflare/src/miniapp.ts](cloudflare/src/miniapp.ts)

Полная схема — в [docs/architecture.md](docs/architecture.md).

## Навигация по репозиторию

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Repository Packaging Audit](docs/repository-packaging-audit.md)
- [Project Note (RU)](docs/OBSIDIAN_BOT_NOTE.md)
- [Contributing](CONTRIBUTING.md)
- [Support](SUPPORT.md)
- [Security Policy](SECURITY.md)
- [Public Repo Safety](docs/public-repo-safety.md)
- [Changelog](CHANGELOG.md)
- [Usage Notice](NOTICE.md)

## Ограничения

- Это не реальный магазин и не настоящая платежная операция.
- Публичный demo-режим не открывает полный cart, favorites и checkout вне Telegram.
- AI-менеджер намеренно доступен только внутри Telegram-бота, а не для анонимного public demo traffic.
- Полных e2e Telegram tests в репозитории пока нет.
- Часть metadata еще настраивается через GitHub UI, а не через файлы репозитория.

## Поддержка

Для багов, фич и docs changes используй issue templates. Для security-sensitive случаев смотри [SECURITY.md](SECURITY.md). Для общей навигации по проекту начни с [SUPPORT.md](SUPPORT.md).

## Лицензия

Репозиторий опубликован в режиме [UNLICENSED](LICENSE) только для portfolio review. Код можно смотреть, но reuse и redeploy без письменного разрешения не допускаются. Смотрите [NOTICE.md](NOTICE.md).
