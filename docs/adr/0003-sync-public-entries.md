# ADR 0003: Sync Public Entries Raw via public.json

## Status
Accepted — supersedes ADR 0002

## Context
ADR 0002 published teach missions by parsing `MISSION.md` frontmatter
(`public: true`), generating chromed landing pages in `src/content/teach/`, and
copying lessons with injected back-links. That was a lot of machinery for a
small benefit, and it only handled teach missions — not other static folders
(e.g. `evaademi`).

## Decision
- `public.json` at the repo root is the single opt-in list. Each entry has
  `name`, `source` (local path or `host:path`), `typ`, and optional `exclude`.
- `bun run sync-public` rsyncs each source **raw** (`--delete --delete-excluded`)
  into `public/teach/<name>/` (`teach`, `link`) or `public/<name>/` (`unlisted`).
  Dotfiles, `NOTES.md`, `learning-records` and `node_modules` are always excluded.
- No landing pages. `/teach` lists every `teach` mission with its lessons and
  references, read from the synced files at build time. `link` entries appear in
  the header's Links menu and point to `/teach/<name>/`.
- Synced files are committed, so CI builds without access to the sources.

## Consequences
- Lessons are served exactly as authored; no back-link injection.
- A `link` entry without an `index.html` 404s until its source gets one.
- `MISSION.md` and `RESOURCES.md` are publicly reachable as plain text.
