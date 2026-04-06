# ZERO-COST HOSTING RESEARCH

Date checked: 2026-03-06

## Hosting decision

```text
=== HOSTING DECISION ===
Primary technical target: Cloudflare Workers + Telegram Webhook
Primary database: Cloudflare D1
Expected cost: $0 at low volume
Webhook mode: yes
Fallback: Hugging Face Spaces (Docker) + Neon Postgres
Important caveat: Python Workers are still a constrained runtime, so the Worker target is implemented with TypeScript and D1 instead of reusing aiogram code as-is
========================
```

## Current conclusion

For a no-card stack, `Cloudflare Workers + D1` is the cleanest zero-cost direction in this project. It avoids:

- Oracle free tier card verification
- Vercel Hobby non-commercial restriction
- local SQLite persistence problems in serverless functions

The main tradeoff is runtime compatibility. Instead of trying to run the original Python `aiogram` stack inside Cloudflare's Python environment, the production path here is a Cloudflare-native Worker implementation with:

- direct Telegram Bot API calls
- D1 database binding
- webhook handler at `/telegram/webhook`

## Official source review

### Cloudflare Workers

Official Cloudflare docs state that:

- Workers have a free tier,
- Workers can serve HTTP webhook requests globally,
- D1 is Cloudflare's serverless SQL database for Workers,
- bindings are the native way to connect a Worker to D1.

Sources:

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/d1/platform/limits/

Why chosen:

- no card was required for account creation in this path,
- webhook hosting fits the Worker request model,
- D1 removes the need for an external database provider.

### Cloudflare Python Workers

Official Cloudflare docs show that Python Workers exist and are in open beta, using `pywrangler` plus the `python_workers` compatibility flag.

Source:

- https://developers.cloudflare.com/workers/languages/python/

Reason not chosen:

- Python Workers remain a constrained environment compared to a normal Python VM.
- This bot previously relied on `aiogram`, `FastAPI`, `SQLAlchemy`, and `asyncpg`.
- Reusing that stack directly in Workers is a poor fit.
- The Cloudflare target in this repository therefore uses `TypeScript + D1`, while the Python target remains preserved separately.

### D1

Official D1 docs position it as Cloudflare's serverless SQL database for Worker applications.

Sources:

- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/d1/platform/limits/

Why chosen:

- native binding support in the Worker
- no separate database account required once Cloudflare is set up
- SQL model remains suitable for catalog, cart, orders, and support requests

### Neon Postgres

Neon remains a valid no-card fallback for non-Cloudflare hosts.

Source:

- https://neon.com/pricing

### Hugging Face Spaces

Official Hugging Face docs show:

- CPU Basic is free,
- Spaces can run Docker,
- free environments have 2 vCPU, 16 GB RAM and 50 GB non-persistent disk,
- free Spaces go to sleep when unused.

Sources:

- https://huggingface.co/pricing
- https://huggingface.co/docs/hub/en/spaces-overview

Reason kept only as fallback:

- it is no-card and can run Docker,
- but sleep behavior is worse than Workers for a Telegram webhook,
- it stays only as a fallback if Cloudflare deployment hits platform-specific blockers.

## Telegram webhook facts used in the architecture

Official Telegram docs state:

- bots with webhooks use `setWebhook`,
- webhook URL must be `https://`,
- you can pass `secret_token`,
- Telegram will send that token in the `X-Telegram-Bot-Api-Secret-Token` header.

Sources:

- https://core.telegram.org/bots/webhooks
- https://core.telegram.org/bots/api

## Final recommendation

### Technical implementation delivered

- Cloudflare Worker webhook implementation in TypeScript
- D1-backed SQL schema and seed data
- Telegram webhook endpoint with secret header validation
- `deploy-cloudflare.bat` for Windows deployment
- `scripts/set-cloudflare-webhook.mjs` to register webhook after deploy

### Current blocker

The code is ready for deployment, but actual publish still requires Cloudflare CLI authentication via `wrangler login` or an equivalent API token in the local environment.
