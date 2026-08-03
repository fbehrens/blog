---
name: publish-teach
description: Publish opted-in teach sessions to the blog (vendor into the blog repo, then commit).
disable-model-invocation: true
argument-hint: "[--dry-run]"
---

Publish teach-skill sessions to the blog at <https://www.aufb.de>. Design and
rationale: `/Users/fb/c/github/blog/docs/adr/0002-publish-teach-sessions.md`
(glossary alongside it).

## Model

- **Source of truth:** `/Users/fb/c/teach/<session>/`. Never edit the vendored copy.
- A session publishes only when its `MISSION.md` frontmatter has `public: true`
  plus `title`, `date`, `tags`, `description`. Default is private.
- `scripts/publish-teach.ts` (in the blog repo) does the vendoring; the blog's
  `/teach` routes + `teach` content collection render it. CI builds from the
  committed vendored files, so committing is what makes content go live.

## Steps

1. **Dry run first.** From `/Users/fb/c/github/blog`:
   ```
   bun run scripts/publish-teach.ts --dry-run
   ```
   Report which sessions would publish, which are private, and lesson counts.
   If a public session is missing required frontmatter the script fails loudly —
   surface that to the user; the fix is editing that session's `MISSION.md`.

2. **Publish for real:**
   ```
   bun run scripts/publish-teach.ts
   ```
   This writes `src/content/teach/<session>/index.md` (chromed landing) and
   `public/teach/<session>/` (bare lesson HTML + assets, back-link injected), and
   removes any vendored session that is no longer `public: true`.

3. **Verify the build** (optional but recommended):
   ```
   bun run build
   ```

4. **Commit** the vendored output (`src/content/teach`, `public/teach`, and any
   infra changes). Use the repo's VCS (jj/git, colocated). Only **push** when the
   user wants to deploy — `git push` to `main` triggers the GitHub Actions deploy.

## Opting a session in

To publish a session, its `MISSION.md` needs frontmatter, e.g.:

```yaml
---
public: true
title: "Astro Islands Architecture"
date: 2026-06-21
description: "Learning Astro's islands model as a SvelteKit developer."
tags: [astro, code]
---
```

Body and the rest of the session (RESOURCES, learning-records, lessons) follow as
usual. The `teach` skill should emit this frontmatter for sessions meant to be public.
