# ADR 0001: Split Email Providers — Cloudflare for Confirmation, Resend for Newsletter

## Status
Accepted

## Context
The newsletter feature requires two kinds of email:
1. Confirmation Email (transactional, one-to-one, triggered by user action)
2. Newsletter (bulk send to all Subscribers, triggered by new post deploy)

Cloudflare Email Service was the preferred provider since the site already runs on Cloudflare. However, Cloudflare Email Service's Terms of Service explicitly restrict it to transactional email only — bulk/marketing sends are prohibited.

## Decision
Use **Cloudflare Email Service** for Confirmation Emails and **Resend** for Newsletter sends.

## Consequences
- Two providers to configure (two secrets: Cloudflare binding + `RESEND_API_KEY`)
- Confirmation Email requires `aufb.de` to be onboarded via `wrangler email sending enable aufb.de`
- Resend requires domain verification for `aufb.de` in their dashboard
- Both send from `newsletter@aufb.de`
