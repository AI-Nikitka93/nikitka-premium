# Architecture

## Repository Classification

This repository is best treated as:

- SaaS/app repository
- AI/bot repository
- Telegram automation repository

The active runtime is Cloudflare-first, while an older Python/Vercel implementation remains in the tree as legacy context.

## System Overview

The Worker in [cloudflare/src/worker.ts](../cloudflare/src/worker.ts) serves four main roles:

1. receive Telegram bot updates through a webhook
2. render the Telegram Mini App shell
3. expose JSON APIs for storefront state and cart operations
4. process background admin notifications through a Queue consumer

Persistent state is stored in D1 through [cloudflare/src/db.ts](../cloudflare/src/db.ts).

## Runtime Components

### Telegram bot surface

- receives `message`, `callback_query`, and `pre_checkout_query` updates
- renders bot menus, product cards, cart views, and admin actions
- drives the AI manager mode inside the bot chat

### Mini App surface

- `GET /app` returns an HTML shell rendered by [cloudflare/src/miniapp.ts](../cloudflare/src/miniapp.ts)
- client-side code calls `/api/miniapp/bootstrap`, `/products`, `/cart`, `/favorites/toggle`, `/checkout`, and `/assistant`
- Telegram `initData` is validated server-side
- a public demo mode is available when Telegram auth is not present

### Data layer

The D1 schema covers:

- categories and products
- users and dialog state
- cart items and favorites
- orders and order items
- support requests
- audit events

The schema is ensured at runtime and then enriched with migration-style repair helpers for older product and cart layouts.

### AI assistant

[cloudflare/src/assistant.ts](../cloudflare/src/assistant.ts) receives:

- the current user message
- recent dialog history
- a product catalog context
- a structured product list for button suggestions

Model routing is configured through `OPENROUTER_MODEL` and `OPENROUTER_FALLBACK_MODELS`.

### Background notifications

Admin notifications can be sent directly or routed through the `NOTIFY_QUEUE` queue binding. This keeps support/admin alerts decoupled from the main request path when Queue bindings are available.

## Request Flows

### Bot flow

1. Telegram sends an update to `POST /telegram/webhook`.
2. The Worker validates `X-Telegram-Bot-Api-Secret-Token`.
3. The update is routed to command, callback, payment, or dialog handlers.
4. Data is read or written in D1.
5. Telegram messages are sent back through direct Bot API calls.

### Mini App flow

1. The user opens `/app` from Telegram or directly in a browser.
2. The HTML shell boots a client-side storefront.
3. API calls include Telegram `initData` when available.
4. The Worker authorizes the request and returns storefront or cart JSON.
5. Checkout triggers an invoice message back into the Telegram chat.

### AI manager flow

1. The user enters AI mode in the bot or calls the Mini App assistant endpoint.
2. The Worker builds catalog context from D1.
3. OpenRouter is queried through the assistant layer.
4. The response is normalized and optionally paired with product buttons.
5. Audit events are written for traceability.

### Support/admin flow

1. A user opens support or payment-support mode.
2. The request is stored in D1.
3. The admin is notified directly or via Queue.
4. The admin replies through a dedicated dialog state.
5. The response is delivered back to the user chat.

## Public And Internal Surfaces

Public endpoints:

- `GET /app`
- `GET /healthz`
- `POST /telegram/webhook`
- `GET/POST /api/miniapp/*`

Sensitive inputs:

- Telegram webhook secret
- bot token
- OpenRouter API key
- Telegram Mini App `initData`

## Legacy Path

The repository still contains:

- `app/`
- `api/`
- `.env.example`

These belong to the older Python/FastAPI/Vercel path. They are useful for history and test coverage, but they are not the recommended public deployment target anymore.
