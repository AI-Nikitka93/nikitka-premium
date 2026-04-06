# NIKITKA PREMIUM

Telegram bot and Mini App storefront demo built on Cloudflare Workers, D1, Telegram Bot API, and OpenRouter.

**Language:** [English](README.md) | [Русский](README.ru.md)

> [!IMPORTANT]
> This repository is a portfolio-style test concept. The store is not real, products are not sold, and the catalog imagery is demo content created for presentation and testing.

> [!WARNING]
> This repository is source-available for review, not open-source for reuse. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).

![NIKITKA PREMIUM Mini App visual](public/miniapp/hero-background.jpeg)

## Quick Links

- Bot: <https://t.me/botikovodlj_bot>
- Mini App: <https://flat-brook-a0f7.zimoaiart.workers.dev/app>
- Production Worker: <https://flat-brook-a0f7.zimoaiart.workers.dev>
- Healthcheck: <https://flat-brook-a0f7.zimoaiart.workers.dev/healthz>
- Webhook endpoint: <https://flat-brook-a0f7.zimoaiart.workers.dev/telegram/webhook>

## What It Does

`NIKITKA PREMIUM` is a solo-built, AI-assisted Telegram-first shopping experience around a Belarus Heritage visual direction.

It is designed as a portfolio case that shows how a developer can go from idea to a working bot and Mini App in a short timeframe, even without prior commercial experience in this exact stack.

`NIKITKA PREMIUM` packages:

- Telegram bot with catalog, search, favorites, cart, checkout, and admin flow
- Telegram Mini App storefront with mobile-first product browsing
- AI manager mode for gift ideas, sizes, style guidance, and product suggestions
- Cloudflare-first deployment with Worker assets, D1 storage, and Queue-based notifications
- Demo-safe public preview mode for the Mini App outside Telegram

## Why This Repo Exists

This project is a public demo case for shipping a production-like Telegram commerce experience on a low-cost stack. It is designed to show:

- a working bot + Mini App surface
- a realistic checkout and admin workflow
- AI-assisted product guidance inside Telegram
- a deployable Cloudflare Workers architecture without paid infrastructure assumptions

## What This Demonstrates

This repository is meant to show employers and clients that I can:

- learn a new stack quickly and turn it into a working product surface
- build a Telegram bot and Mini App solo with AI-assisted development
- connect backend logic, UI, data storage, and AI features into one coherent flow
- take a project from concept to live public demo in a short time
- package the result as a professional, reviewable GitHub portfolio project

## My Role

This is a solo portfolio build. I used AI as an accelerator, but the project direction, integration work, deployment flow, repository packaging, and final implementation decisions were mine.

## Quickstart

The current recommended target is the Cloudflare implementation.

```powershell
.\install.bat
Copy-Item ".dev.vars.example" ".dev.vars" -ErrorAction SilentlyContinue
```

Fill `.dev.vars` with at least:

- `BOT_TOKEN`
- `ADMIN_CHAT_ID`
- `BOT_USERNAME`
- `WEBHOOK_SECRET_TOKEN`
- `WORKER_PUBLIC_URL`
- `OPENROUTER_API_KEY`

Then build, deploy, and sync Telegram:

```powershell
npm run cf:build
.\deploy-cloudflare.bat
```

For the detailed setup flow, see [Getting Started](docs/getting-started.md).

## Verification

```powershell
npm run cf:build
.\.venv\Scripts\python.exe -m pytest
```

The repository still contains an older Python/Vercel implementation for historical reference, but the active production path is Cloudflare-first.

## Capabilities

### Telegram Bot

- `/start`, `/catalog`, `/cart`, `/search`, `/favorites`, `/contact`, `/aihelp`, `/admin`
- inline product cards with category navigation
- cart quantity controls and Telegram Stars checkout flow
- support escalation and admin reply loop
- dedicated AI manager mode with short conversational prompts

### Mini App

- public storefront at `/app`
- category filters, search, favorites, and cart
- Telegram-authenticated session flow with demo fallback
- mobile and tablet-oriented visual layout
- checkout handoff back into the bot chat

### AI Manager

- gift and outfit suggestions
- size-aware recommendations
- short conversational replies for bot users
- product-button suggestions inside Telegram responses
- guardrails against off-topic or secret-revealing prompts

## Architecture

Core request surfaces:

- `POST /telegram/webhook` receives Telegram bot updates
- `GET /app` renders the Mini App shell
- `GET/POST /api/miniapp/*` serves storefront, cart, favorites, checkout, and assistant APIs
- `GET /healthz` returns a simple Worker health probe

Key implementation files:

- [cloudflare/src/worker.ts](cloudflare/src/worker.ts)
- [cloudflare/src/db.ts](cloudflare/src/db.ts)
- [cloudflare/src/assistant.ts](cloudflare/src/assistant.ts)
- [cloudflare/src/miniapp.ts](cloudflare/src/miniapp.ts)

For a fuller system map, see [Architecture](docs/architecture.md).

## Repository Guide

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

## Limitations

- This is not a real store or payment operation.
- Public demo mode does not expose full cart, favorites, or checkout state outside Telegram.
- The AI manager is intentionally available only inside the Telegram bot, not to anonymous public demo traffic.
- Full end-to-end Telegram automation tests are not included yet.
- Some repository metadata still has to be configured in GitHub UI, not in source files.

## Support

Use the issue templates for bugs, features, and docs changes. For security-sensitive reports, follow [SECURITY.md](SECURITY.md). For general usage guidance, start with [SUPPORT.md](SUPPORT.md).

## License

This repository is published under an [UNLICENSED](LICENSE) posture for portfolio review only. Source is visible, but reuse and redeployment are not permitted without written permission. See [NOTICE.md](NOTICE.md).
