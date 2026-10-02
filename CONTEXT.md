# Blog

Personal blog at aufb.de. Besides posts it publishes static folders synced from outside the repo.

## Language

### Publishing

**Public entry**:
One item in `public.json`, naming a source folder whose contents are published as a static folder on the site.
_Avoid_: session, publication

**Source**:
The folder (local or on another host) that is the source of truth for a public entry; the blog's copy is a snapshot.

**Sync**:
Copying every public entry's source into the repo so the files exist at build time.
_Avoid_: vendoring, publish

**Typ**:
Says where a public entry is linked from: `teach` (the /teach page), `link` (the Links menu), or `unlisted` (nowhere, reachable by URL only).

### Teach

**Mission**:
A topic folder created with the /teach skill, holding a MISSION.md, lessons and references.
_Avoid_: session

**Lesson**:
A standalone, self-styled HTML file in a mission's `lessons/` folder.

**Reference**:
A standalone HTML file in a mission's `reference/` folder, used to look things up rather than to work through.
