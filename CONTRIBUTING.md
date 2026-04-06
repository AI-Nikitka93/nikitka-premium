# Contributing

Thanks for helping improve `NIKITKA PREMIUM`.

This repository is a demo-heavy Telegram bot and Mini App project, so the most useful contributions are usually:

- bug fixes
- documentation improvements
- test additions
- Cloudflare runtime improvements
- Mini App UX fixes that preserve the current visual direction

## Before You Start

- Read [README.md](README.md) for the repository overview.
- Use [docs/getting-started.md](docs/getting-started.md) for setup.
- Check [docs/architecture.md](docs/architecture.md) before changing request flows or storage.

## Local Setup

```powershell
.\install.bat
```

Create or update:

- `.dev.vars` for the active Cloudflare flow
- `.env` only if you need the legacy Python path

## Recommended Checks

Run these before opening a pull request:

```powershell
npm run cf:build
.\.venv\Scripts\python.exe -m pytest
```

## Pull Request Expectations

- keep changes scoped and reviewable
- explain the user-facing impact
- mention any config or migration changes
- include screenshots for visible Mini App UI changes when practical
- call out anything you could not test

Use the pull request template in [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).

## Documentation Conventions

- keep the root [README.md](README.md) concise and GitHub-landing friendly
- move deep operational detail into `docs/`
- prefer relative links for repository files
- keep the canonical public README in English
- localized notes may exist separately, such as [docs/OBSIDIAN_BOT_NOTE.md](docs/OBSIDIAN_BOT_NOTE.md)

## Issues

Use the structured issue forms for:

- bugs
- feature ideas
- documentation problems

Do not report security issues in public issues. Follow [SECURITY.md](SECURITY.md) instead.
