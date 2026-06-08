---
title: "Building this blog with Claude"
date: 2026-06-08
tags:
  - code
description: "How this blog came to exist — a session with Claude Code where all decisions were made in a Q&A."
draft: false
---

## The initial prompt

> I want to setup a homepage either with GitHub or Cloudflare Pages connected to my domain which is aufb.de. Page should be served on <www.aufb.de>. It should be a simple blog where I can publish articles as markdown files, that can contain images and have one category tag. Each article has exactly one tag. The design of the homepage is minimalistic. On the home page all articles are shown with truncated text. There are links to filter articles by tag. When I click on an article it opens with the full body. On top there are links to my GitHub (fbehrens) and Instagram (@frnkbhrns). Repo should be created under $github/blog. It should use Google Analytics behind a cookie banner and an Impressum, required by German law.

Claude ran `/grill-with-docs` — a structured interview mode that works through every decision branch before writing a single line of code.

## Decisions made

| Topic | Decision |
|---|---|
| Hosting | Cloudflare Pages (aufd.de was already on Cloudflare) |
| SSG | Astro — markdown-native, zero JS by default, Cloudflare adapter |
| Styling | Tailwind + shadcn CSS variable color tokens, blue accent |
| Article fields | `title`, `date`, `tag`, `description`, optional `image`, `draft` |
| Tags | Free-form strings, filter pages generated dynamically |
| Homepage teaser | Explicit `description` field (not auto-truncated body) |
| Images | Co-located with post folder (`src/content/posts/slug/index.md`) |
| Cookie/GA | Custom lightweight banner, `localStorage`, GA loads on accept only |
| Impressum | Frank Behrens, Cologne, <fb@aufb.de> — static page at `/impressum` |
| Navigation | GitHub + Instagram icons in header; text links + Impressum in footer |
| Deploy | Push to `main` → live (draft posts hidden via `draft: true` frontmatter) |
| RSS | `/rss.xml` via `@astrojs/rss` |

## What Claude built

One session, no back-and-forth on code: content collection schema, all Astro pages (index, post detail, tag filter, impressum, RSS), a cookie banner with GDPR-compliant GA integration, Tailwind with shadcn-style CSS variables for the blue accent, and a GitHub repo push. The Cloudflare Pages connection was the only manual step.
