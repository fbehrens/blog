---
title: "Setting up a staging environment"
date: 2026-06-08
tags:
  - code
description: "Adding a dev.aufb.de staging environment to a Cloudflare Worker blog using wrangler environments."
draft: false
---

## The setup

This blog runs as a **Cloudflare Worker with static assets** — not Cloudflare Pages. Custom domains (`aufb.de`, `www.aufb.de`) are wired up in `wrangler.toml` and visible in the Workers dashboard under Domains & Routes.

## What I tried first

Cloudflare Pages has branch preview URLs (`dev.<project>.pages.dev`) that auto-deploy on every push. That would have been free staging with zero config. But since this is a Worker, there's no branch concept — only preview deployments at `*-blog.fbehrens.workers.dev`, and you can't bind a custom domain to those.

## Wrangler environments

Workers support named environments in `wrangler.toml`. Adding an `[env.dev]` block creates a separate Worker (`blog-dev`) with its own routes:

```toml
[env.dev]
routes = [
  { pattern = "dev.aufb.de", custom_domain = true },
]

[env.dev.assets]
directory = "./dist"
```

Deploy it with:

```sh
wrangler deploy --env dev
```

On first deploy, Cloudflare creates the CNAME `dev.aufb.de → blog-dev.fbehrens.workers.dev` automatically (because `custom_domain = true`).

## The workflow

```
edit → build → wrangler deploy --env dev → check dev.aufb.de → wrangler deploy → live
```

Production and dev are independent Workers. Pushing to GitHub only redeploys production — the dev environment is a manual deploy.
