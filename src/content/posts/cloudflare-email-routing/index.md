---
title: "Routing all *@aufb.de emails to Gmail"
date: 2026-06-08
tags:
  - code
description: "Using Cloudflare Email Routing to forward any address at aufb.de to Gmail — no mail server needed."
draft: false
---

Cloudflare manages the DNS for `aufb.de`, which means I can use **Email Routing** to forward any address (like `hello@aufb.de` or `fb@aufb.de`) to my Gmail inbox — without running a mail server.

## Enable Email Routing

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com) and select the `aufb.de` zone.
2. Go to **Email → Email Routing**.
3. Click **Get started**. Cloudflare will ask to add the required DNS records — accept.

Cloudflare adds three MX records and an SPF `TXT` record automatically. If any conflicting records exist (old MX entries from a previous host), the wizard flags them and offers to replace them.

## Verify the destination address

Before any mail can be forwarded, Cloudflare needs to confirm you own the destination mailbox.

Go to **Destination addresses** and add `...@gmail.com`. Cloudflare sends a verification email; click the link inside it. The address shows as **Verified** once done.

## Add a catch-all rule

A catch-all matches every address that doesn't have a more specific rule.

1. In **Email Routing → Routing rules**, scroll to **Catch-all**.
2. Set the action to **Send to an email** and pick `...@gmail.com`.
3. Save.

That's it. Mail sent to `anything@aufb.de` now lands in Gmail.

## What Cloudflare adds to DNS

| Type | Name | Value |
|------|------|-------|
| MX | `aufb.de` | `route1.mx.cloudflare.net` (priority 82) |
| MX | `aufb.de` | `route2.mx.cloudflare.net` (priority 18) |
| MX | `aufb.de` | `route3.mx.cloudflare.net` (priority 64) |
| TXT | `aufb.de` | `v=spf1 include:_spf.mx.cloudflare.net ~all` |

The SPF record tells receiving servers that Cloudflare is authorized to send (forward) mail on behalf of `aufb.de`, which reduces the chance of forwarded mail landing in spam.

## Replying from a custom address

Cloudflare Email Routing is receive-only — it can't send outbound mail. To reply *from* `fb@aufb.de` inside Gmail:

1. In Gmail, go to **Settings → Accounts → Send mail as → Add another email address**.
2. Enter `fb@aufb.de` and use Gmail's SMTP (`smtp.gmail.com`, port 587) with your Google account credentials.
3. Verify ownership via the confirmation email Gmail sends to `fb@aufb.de` — which Cloudflare will forward back to your inbox.

After that, Gmail lets you pick `fb@aufb.de` as the From address when composing.
