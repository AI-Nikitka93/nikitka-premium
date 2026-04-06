# Getting Started

This guide covers the active Cloudflare deployment path for `NIKITKA PREMIUM`.

## Stack

- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues
- Telegram Bot API
- OpenRouter
- TypeScript for the Worker runtime
- Python only for legacy code and tests

## Prerequisites

- Node.js 20+ with `npm`
- Python 3.11+ if you want to run the legacy tests
- A Telegram bot token
- A Cloudflare account with Wrangler access
- An OpenRouter API key for the AI manager flow

## Install

From the repository root:

```powershell
.\install.bat
```

This script:

- creates `.venv` when needed
- installs Python dependencies
- installs Node dependencies
- creates `.env` from `.env.example` when missing
- creates `.dev.vars` from `.dev.vars.example` when missing

## Configure Environment

The current Cloudflare deployment reads from `.dev.vars`.

Required keys:

- `BOT_TOKEN`
- `ADMIN_CHAT_ID`
- `ADMIN_HANDLE`
- `BOT_TITLE`
- `BOT_USERNAME`
- `WEBHOOK_SECRET_TOKEN`
- `PAYMENTS_CURRENCY`
- `WORKER_PUBLIC_URL`
- `OPENROUTER_API_KEY`

Optional AI routing keys:

- `OPENROUTER_MODEL`
- `OPENROUTER_FALLBACK_MODELS`

`wrangler.jsonc` already defines:

- Worker entrypoint: `cloudflare/src/worker.ts`
- assets directory: `public`
- D1 binding: `DB`
- Queue binding: `NOTIFY_QUEUE`

## Build And Verify

Before deploying, run:

```powershell
npm run cf:build
.\.venv\Scripts\python.exe -m pytest
```

`npm run cf:build` validates the TypeScript Worker.

`.\.venv\Scripts\python.exe -m pytest` covers the legacy Python service layer that still exists in the repository. It is useful as a regression check, but it is not the primary runtime anymore.

## Deploy

### Fast path

```powershell
.\deploy-cloudflare.bat
```

The deployment script:

1. checks for `npx`
2. ensures `.dev.vars` exists
3. runs `npm install`
4. deploys the Worker with `wrangler deploy`
5. configures the Telegram webhook
6. synchronizes bot profile fields and commands

### Manual path

```powershell
npx wrangler login
npx wrangler deploy
npm run cf:webhook
npm run cf:profile
```

## Post-Deploy Checks

After deployment, verify:

- `GET /healthz` returns `{ "status": "ok" }`
- the bot responds to `/start`
- the menu button opens `/app`
- `/catalog`, `/cart`, `/favorites`, and `/aihelp` work
- admin-only `/admin` is reachable for the configured admin

## Production URLs

- Worker: <https://flat-brook-a0f7.zimoaiart.workers.dev>
- Mini App: <https://flat-brook-a0f7.zimoaiart.workers.dev/app>
- Healthcheck: <https://flat-brook-a0f7.zimoaiart.workers.dev/healthz>

## Local Notes

- `.env` belongs to the older Python/Vercel path and is still kept for historical compatibility.
- `.dev.vars` is the active config surface for the Cloudflare Worker flow.
- The Mini App supports a demo fallback outside Telegram, but authenticated cart and checkout behavior requires Telegram `initData`.

## Troubleshooting

### `wrangler` is not authenticated

Run:

```powershell
npx wrangler login
```

### Webhook setup fails

Confirm these values in `.dev.vars`:

- `BOT_TOKEN`
- `WEBHOOK_SECRET_TOKEN`
- `WORKER_PUBLIC_URL`

Then retry:

```powershell
npm run cf:webhook
```

### Bot profile sync fails

Retry:

```powershell
npm run cf:profile
```

If Telegram returns a rate-limit response, wait briefly and run the command again.

### Mini App works only partially in the browser

That is expected in demo mode. Full cart, favorites, and checkout flows depend on Telegram-authenticated Mini App requests.
