# Security Policy

## Supported Versions

Security fixes are provided on a best-effort basis for the current Cloudflare-first code path.

| Version / branch | Supported |
| --- | --- |
| Current default branch | Yes |
| Latest deployed Cloudflare Worker flow | Yes |
| Legacy Python/Vercel path | Limited / best effort |

## Reporting A Vulnerability

Please do not open public GitHub issues for security reports.

Instead:

1. prepare a private report with the affected area, impact, reproduction steps, and any proof-of-concept details
2. contact the project maintainer through a private channel associated with the repository
3. wait for confirmation before publishing details

If GitHub Security Advisories are enabled for the repository, prefer that route.

## What To Report

Examples of in-scope security issues:

- webhook secret bypass
- Telegram Mini App auth validation bypass
- privilege escalation in admin flows
- secret leakage
- checkout or payment-flow abuse
- D1 data exposure
- injection vulnerabilities

Examples of out-of-scope issues for this demo project:

- catalog copy mistakes
- style or branding disagreements
- issues that only affect the intentionally limited public demo mode

## Disclosure Expectations

Because this is a portfolio/demo repository, response times are best-effort rather than SLA-backed. Please allow reasonable time for triage and remediation.
