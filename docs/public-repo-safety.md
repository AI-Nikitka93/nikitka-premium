# Public Repo Safety

This repository is public so people can inspect the implementation, not because the bot is intended to be freely reused.

## What Protects The Live Bot

- secrets are kept out of git and stored locally or in Cloudflare secrets
- Telegram webhook requests require `WEBHOOK_SECRET_TOKEN`
- admin actions are gated by the configured admin `chat_id`
- Telegram Mini App requests validate Telegram `initData`
- anonymous browser demo traffic is intentionally limited and does not get full privileged flows

## What A Public Repo Can Never Fully Prevent

If source code is public, someone can still read it and manually copy ideas or rewrite parts of it. Public code cannot be made impossible to copy technically.

What you can protect is:

- your tokens
- your running infrastructure
- your bot identity
- your branding and portfolio positioning
- your legal permission boundaries

## Recommended Operating Rules

- keep `BOT_TOKEN`, `OPENROUTER_API_KEY`, and `WEBHOOK_SECRET_TOKEN` out of git
- rotate secrets immediately if they ever leak
- use `.env.example` and `.dev.vars.example` only for placeholders
- keep the production bot token separate from any future test bot token
- do not expose paid or rate-limited AI endpoints to anonymous demo traffic
- review GitHub secret scanning alerts regularly

## Portfolio Positioning

The repository is intentionally public for:

- recruiter review
- client review
- technical demonstration

It is not published as a reusable open-source base. See [LICENSE](../LICENSE) and [NOTICE.md](../NOTICE.md).
