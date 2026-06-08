# Glossary: Teach Session Publishing

Terms used across the `/teach` publishing design (see ADR 0002).

- **Session** — One teach-skill topic folder under `/c/teach/<session>/`
  (e.g. `astro`, `salsa`). The unit that gets opted in for publishing.

- **Landing page** — The public page at `/teach/<session>/`. Rendered through
  `Layout.astro` with full site chrome. Aggregates the session's mission,
  resources, and learning records, and links to each lesson.

- **Lesson** — A single standalone, self-styled, interactive HTML file from a
  session's `lessons/` or `explainers/` folder. Published **bare** (no site
  chrome) at `/teach/<session>/<lesson>`.

- **Bare** — Served as-is: the original HTML, its styling, and interactivity are
  published untouched, not wrapped in `Layout.astro`.

- **Chromed** — Rendered inside `Layout.astro` with the site Header/Footer/nav.
  Landing pages are chromed; lessons are not.

- **Opt-in** — A session is published only if its `MISSION.md` frontmatter has
  `public: true`. Default is private. Opt-in is the privacy boundary.

- **Vendoring** — Copying opted-in session files from `/c/teach` (source of
  truth) into the blog repo so committed files exist at CI build time.

- **`/publish-teach` skill** — The manual command that vendors opted-in sessions
  into the blog repo, updates the `/teach` index, and commits.

- **`/teach` section** — The separate part of the site holding session landings
  and lessons. Not cross-listed into `/posts`, RSS, or the search index.

- **Source of truth** — `/c/teach`. The blog's copy is a vendored snapshot;
  re-running `/publish-teach` refreshes it.
