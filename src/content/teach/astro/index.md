---
title: "Learning Astro's Islands Architecture"
date: "2026-06-21"
description: "A SvelteKit developer's self-directed session on Astro's islands model and hydration directives."
session: "astro"
tags:
  - "astro"
  - "code"
lessons:
  - title: "Astro Islands Architecture"
    href: "/teach/astro/01-islands-architecture.html"
---
## Mission

### Why
You're a SvelteKit developer who wants to deeply understand the islands architecture pattern — specifically how Astro implements it — and ship a working project using Svelte components as interactive islands inside otherwise-static Astro pages.

### Success looks like
- Understand why islands exist and how they differ from SvelteKit's full-hydration model
- Build an Astro project with at least one Svelte component island using `client:*` directives
- Choose the right hydration directive (`client:load`, `client:idle`, `client:visible`) for a given use case
- Understand how server islands (`server:defer`) differ from client islands

### Constraints
- You have SvelteKit/Svelte experience — lean into that prior knowledge, don't re-teach Svelte
- Focus on the islands model first; Astro's content collections and routing are secondary

### Out of scope
- React/Vue islands (Svelte is the target island framework)
- Astro content collections (can revisit later)
- Deployment / hosting

## Resources

### Knowledge

- [Islands Architecture — Astro Docs](https://docs.astro.build/en/concepts/islands/)
  Primary source on the islands model. Use for: understanding client vs server islands, hydration directives.

- [Front-end Frameworks (UI Components) — Astro Docs](https://docs.astro.build/en/guides/framework-components/)
  How to use framework components as islands — installation, client directives, props serialization limits.

- [@astrojs/svelte Integration — Astro Docs](https://docs.astro.build/en/guides/integrations-guide/svelte/)
  Official Svelte 5 integration for Astro. Use for: setup, `vitePreprocess`, config options.

- [Template Directives Reference — Astro Docs](https://docs.astro.build/en/reference/directives-reference/)
  Full reference for all `client:*` and `server:defer` directives with exact semantics.

- [Server Islands — Astro Docs](https://docs.astro.build/en/guides/server-islands/)
  How `server:defer` works for personalized server-rendered islands. Use for: dynamic content without blocking static HTML.

- [Share State Between Islands — Astro Docs](https://docs.astro.build/en/recipes/sharing-state-islands/)
  How to coordinate state across multiple independent islands. Use for: shopping carts, global UI state.

- [Why Astro? — Astro Docs](https://docs.astro.build/en/concepts/why-astro/)
  Motivations behind Astro's design. Use for: understanding the philosophy vs SvelteKit.

### Wisdom (Communities)

- [Astro Discord](https://astro.build/chat)
  Official community. High-signal, moderated, active maintainer presence. Best for: specific integration questions.

- [r/astrojs](https://reddit.com/r/astrojs)
  Community discussion. Use for: real-world project patterns, migration stories.

## Learning Records

### Prior knowledge: SvelteKit and Svelte

User has shipped with SvelteKit and is comfortable with Svelte component model, reactivity, and SSR. This means Svelte syntax, stores, and the hydration concept are already understood — no need to re-explain these. Teaching should frame Astro's model as a contrast to SvelteKit's full-hydration approach rather than introducing SSR from scratch.

**Implications**: Skip Svelte basics. Frame every Astro concept relative to the SvelteKit mental model. Jump straight to client directives and the architectural tradeoffs.

