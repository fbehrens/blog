---
title: "Setting up a staging environment"
date: 2026-06-08
tag: code
description: "How Cloudflare Pages preview deployments give you a free staging environment with zero extra config."
draft: false
---

## The problem

Before publishing a post I want to see it live — real fonts, real layout, real URLs — not just a local dev server. Drafts (`draft: true` in frontmatter) hide posts from production, but they also hide them from me.

## What Cloudflare Pages gives you for free

Every branch push gets its own preview URL:

```
https://<branch-name>.<project>.pages.dev
```

No extra config, no second project, no cost. The preview builds run the same pipeline as production.

## Setup

Create a `staging` branch and push it:

```sh
git checkout -b staging
git push -u origin staging
```

From now on the workflow is:

| Action | Where it appears |
|---|---|
| Push to `staging` | `staging.<project>.pages.dev` |
| Push to `main` | `www.aufb.de` (production) |

Draft posts are visible on the preview URL because the build runs identically — the `draft` filter only applies to what you choose to render, so if you want drafts visible on staging you can gate on `import.meta.env.CF_PAGES_BRANCH`.

## Custom domain for staging (optional)

If you want `staging.aufb.de` instead of the auto-generated URL, add a CNAME in Cloudflare DNS:

```
staging.aufb.de  CNAME  staging.<project>.pages.dev  (proxied)
```

Then add `staging.aufb.de` as a custom domain in Pages → your project → Custom domains.

## The workflow

```
edit post → commit → push to staging → check staging.aufb.de → push to main → live
```

One branch, no extra infrastructure.
