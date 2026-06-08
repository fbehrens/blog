# ADR 0002: Publish Teach Sessions to the Blog

## Status
Accepted

## Context
Teach-skill sessions live in `/Users/fb/c/teach/<session>/` (e.g. `astro`, `effect`,
`galaxys26ultra`, `salsa`). Each session folder contains:

- `MISSION.md` — the personal "why" driving the topic
- `RESOURCES.md` — curated external resources
- `learning-records/*.md` — insights/decisions captured while learning
- `lessons/*.html` **or** `explainers/*.html` — standalone, self-styled, interactive HTML lessons
- `reference/*.html`, `assets/*` — reference docs and reusable components

The goal is to publish selected sessions publicly on the blog
(<https://www.aufb.de>, Astro → Cloudflare Workers, deployed via GitHub Actions
on `git push`).

Two structural mismatches had to be resolved:

1. **Shape.** The blog's `posts` collection expects a single
   `src/content/posts/<slug>/index.md` per post. A session is a multi-file tree
   mixing markdown and standalone HTML.
2. **Location & CI.** `/c/teach` is outside the blog repo and is not version
   controlled. The deploy workflow does `actions/checkout` + `bun run build` on a
   clean runner, so `/c/teach` does not exist at build time. Reading it directly
   would build an empty/broken site in CI.

## Decision

Publish sessions as a **two-level `/teach` section**, vendored into the blog repo
by a dedicated skill.

1. **Granularity — landing + lessons.** Each session becomes a landing page at
   `/teach/<session>/` that aggregates the session (mission, resources, learning
   records) and links to each lesson at `/teach/<session>/<lesson>`.

2. **Source of truth & sync.** `/c/teach` remains the source of truth. A new
   **`/publish-teach` skill** copies opted-in sessions into the blog repo
   (vendoring), updates the `/teach` index, and commits. CI then builds normally
   from committed files — the existing GitHub Actions pipeline is untouched.

3. **Opt-in.** A session is published only when its `MISSION.md` frontmatter
   carries `public: true` (plus `title`, `date`, `tags`, `description`). Default
   is private.

4. **What's published.** Everything in an opted-in session — mission, resources,
   learning records, and lessons — is public. Opt-in is the privacy boundary; the
   session author is responsible for not flagging a session that contains private
   notes.

5. **Rendering & chrome.**
   - **Landing pages** are rendered through `Layout.astro` with full site chrome
     (Header/Footer/nav), built from the session's markdown.
   - **Lessons** are served **bare** — the standalone HTML is published untouched,
     keeping its own styling and interactivity. No site chrome is injected, to
     avoid CSS clashes with lesson styling.

6. **Folder tolerance.** The publisher accepts both `lessons/` and `explainers/`
   (and `reference/`). Existing sessions are **not** renamed.

7. **Site integration.** `/teach` is a **separate section**. Session landings do
   **not** appear in the `/posts` homepage list, RSS, or search index.

## Consequences

- A new `/publish-teach` skill must be built and maintained.
- Vendored session files are committed to the blog repo, so the repo grows with
  each published session and content can drift from `/c/teach` until re-synced
  (re-running the skill is the refresh mechanism).
- Lesson HTML and its `assets/` must be vendored together with relative links
  preserved, since lessons are served as-is outside `Layout.astro`.
- `/teach` content is invisible to RSS/search/homepage by design; discoverability
  of sessions relies on the `/teach` index page.
- The `teach` skill should start writing publishable `MISSION.md` frontmatter
  (`public`, `title`, `date`, `tags`, `description`) for sessions intended to go
  public.
- Bare lessons won't share the site's header/footer/nav — a back-link to the
  session landing should be added by the publisher or lesson template.
