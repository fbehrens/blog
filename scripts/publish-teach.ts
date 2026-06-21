#!/usr/bin/env bun
/**
 * publish-teach.ts — vendor opted-in teach sessions into the blog repo.
 *
 * Source of truth: /c/teach/<session>/ (override with --teach-dir <path>).
 * A session is published only when its MISSION.md frontmatter has `public: true`
 * plus `title`, `date`, `tags`, `description`. See docs/adr/0002.
 *
 * For each public session this:
 *   - writes a chromed landing at src/content/teach/<session>/index.md
 *   - copies lessons (lessons/ + explainers/ + reference/ *.html) bare into
 *     public/teach/<session>/, injecting a back-link to the landing
 *   - copies assets/ into public/teach/<session>/assets/
 * Sessions no longer public are removed from both vendored locations.
 *
 * Usage: bun run scripts/publish-teach.ts [--teach-dir <path>] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';

const BLOG_ROOT = path.resolve(import.meta.dir, '..');
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const teachDirArg = argv[argv.indexOf('--teach-dir') + 1];
const TEACH_DIR = argv.includes('--teach-dir') && teachDirArg
  ? path.resolve(teachDirArg)
  : '/Users/fb/c/teach';

const CONTENT_TEACH = path.join(BLOG_ROOT, 'src/content/teach');
const PUBLIC_TEACH = path.join(BLOG_ROOT, 'public/teach');
const LESSON_DIRS = ['lessons', 'explainers', 'reference'];

type Front = Record<string, string | string[] | boolean>;

// --- minimal YAML frontmatter parser (strings, booleans, inline/block arrays) ---
function parseFrontmatter(raw: string): { front: Front; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { front: {}, body: raw };
  const body = raw.slice(m[0].length);
  const lines = m[1].split('\n');
  const front: Front = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let rest = kv[2].trim();
    if (rest === '') {
      // block list?
      const items: string[] = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        items.push(unquote(lines[++i].replace(/^\s*-\s+/, '').trim()));
      }
      front[key] = items;
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      front[key] = rest.slice(1, -1).split(',').map(s => unquote(s.trim())).filter(Boolean);
    } else if (rest === 'true' || rest === 'false') {
      front[key] = rest === 'true';
    } else {
      front[key] = unquote(rest);
    }
  }
  return { front, body };
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// --- markdown helpers ---
function stripFirstH1(md: string): string {
  return md.replace(/^\s*#\s+.*\n+/, '');
}
function shiftHeadings(md: string, by: number): string {
  return md.replace(/^(#{1,6})(\s)/gm, (_m, hashes, sp) =>
    '#'.repeat(Math.min(6, hashes.length + by)) + sp);
}

// --- html helpers ---
function lessonTitle(html: string, file: string): string {
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (t) return t[1].trim();
  return path.basename(file, '.html')
    .replace(/^\d+[-_]?/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
function injectBackLink(html: string, session: string, title: string): string {
  const bar = `<a href="/teach/${session}/" style="position:fixed;top:0;left:0;z-index:99999;`
    + `background:#111;color:#fff;font:14px/1.4 system-ui,-apple-system,sans-serif;`
    + `padding:8px 14px;border-bottom-right-radius:8px;text-decoration:none;opacity:.85">`
    + `← ${escapeHtml(title)}</a>`;
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, m => m + '\n' + bar);
  }
  return bar + '\n' + html;
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Lessons/reference HTML live in lessons/ (etc.) in the source and reference
// siblings via `../`. Publishing flattens them into public/teach/<slug>/, so
// those `../` paths must be rebased: assets/ stays a subdir, lesson & reference
// HTML land at the session root, and the mission becomes the chromed landing.
function rewriteLessonPaths(html: string, slug: string): string {
  return html
    .replace(/\.\.\/assets\//g, 'assets/')
    .replace(/\.\.\/(?:lessons|explainers|reference)\//g, '')
    .replace(/\.\.\/MISSION\.md/g, `/teach/${slug}/`);
}

// --- fs helpers ---
function rmrf(p: string) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function discoverSessions(): string[] {
  if (!fs.existsSync(TEACH_DIR)) {
    console.error(`✗ teach dir not found: ${TEACH_DIR}`);
    process.exit(1);
  }
  return fs.readdirSync(TEACH_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(TEACH_DIR, e.name, 'MISSION.md')))
    .map(e => e.name)
    .sort();
}

interface Lesson { title: string; href: string; srcFile: string; }

function buildLanding(slug: string, front: Front, lessons: Lesson[]): string {
  const sessionDir = path.join(TEACH_DIR, slug);
  const title = String(front.title);
  const date = String(front.date);
  const description = String(front.description);
  const tags = (Array.isArray(front.tags) ? front.tags : []).map(String);

  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${JSON.stringify(date)}`,
    `description: ${JSON.stringify(description)}`,
    `session: ${JSON.stringify(slug)}`,
    tags.length ? 'tags:\n' + tags.map(t => `  - ${JSON.stringify(t)}`).join('\n') : 'tags: []',
    lessons.length
      ? 'lessons:\n' + lessons.map(l => `  - title: ${JSON.stringify(l.title)}\n    href: ${JSON.stringify(l.href)}`).join('\n')
      : 'lessons: []',
    '---',
    '',
  ].join('\n');

  const sections: string[] = [];

  // Mission body (strip its own frontmatter via re-parse, drop its H1)
  const missionRaw = fs.readFileSync(path.join(sessionDir, 'MISSION.md'), 'utf8');
  const missionBody = parseFrontmatter(missionRaw).body;
  sections.push('## Mission\n\n' + shiftHeadings(stripFirstH1(missionBody), 1).trim());

  const resourcesPath = path.join(sessionDir, 'RESOURCES.md');
  if (fs.existsSync(resourcesPath)) {
    const r = fs.readFileSync(resourcesPath, 'utf8');
    sections.push('## Resources\n\n' + shiftHeadings(stripFirstH1(r), 1).trim());
  }

  const recordsDir = path.join(sessionDir, 'learning-records');
  if (fs.existsSync(recordsDir)) {
    const records = fs.readdirSync(recordsDir).filter(f => f.endsWith('.md')).sort();
    if (records.length) {
      const parts = ['## Learning Records', ''];
      for (const f of records) {
        const c = fs.readFileSync(path.join(recordsDir, f), 'utf8');
        const h1 = c.match(/^\s*#\s+(.*)$/m);
        const recTitle = h1 ? h1[1].trim() : f.replace(/\.md$/, '');
        parts.push(`### ${recTitle}\n\n` + shiftHeadings(stripFirstH1(c), 2).trim() + '\n');
      }
      sections.push(parts.join('\n'));
    }
  }

  return fm + sections.join('\n\n') + '\n';
}

function collectLessons(slug: string): Lesson[] {
  const sessionDir = path.join(TEACH_DIR, slug);
  const lessons: Lesson[] = [];
  for (const sub of LESSON_DIRS) {
    const dir = path.join(sessionDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.html')).sort()) {
      const srcFile = path.join(dir, f);
      const html = fs.readFileSync(srcFile, 'utf8');
      lessons.push({ title: lessonTitle(html, f), href: `/teach/${slug}/${f}`, srcFile });
    }
  }
  return lessons;
}

function publishSession(slug: string): { lessons: number } {
  const { front } = parseFrontmatter(fs.readFileSync(path.join(TEACH_DIR, slug, 'MISSION.md'), 'utf8'));
  const missing = ['title', 'date', 'description'].filter(k => !front[k])
    .concat(Array.isArray(front.tags) && front.tags.length ? [] : ['tags']);
  if (missing.length) {
    console.error(`✗ ${slug}: public but missing frontmatter: ${missing.join(', ')}`);
    process.exit(1);
  }

  const lessons = collectLessons(slug);
  const title = String(front.title);
  const landing = buildLanding(slug, front, lessons);

  if (dryRun) return { lessons: lessons.length };

  // clean previous output for this session
  rmrf(path.join(CONTENT_TEACH, slug));
  rmrf(path.join(PUBLIC_TEACH, slug));

  fs.mkdirSync(path.join(CONTENT_TEACH, slug), { recursive: true });
  fs.writeFileSync(path.join(CONTENT_TEACH, slug, 'index.md'), landing);

  fs.mkdirSync(path.join(PUBLIC_TEACH, slug), { recursive: true });
  for (const l of lessons) {
    const html = injectBackLink(rewriteLessonPaths(fs.readFileSync(l.srcFile, 'utf8'), slug), slug, title);
    fs.writeFileSync(path.join(PUBLIC_TEACH, slug, path.basename(l.srcFile)), html);
  }
  const assetsDir = path.join(TEACH_DIR, slug, 'assets');
  if (fs.existsSync(assetsDir)) copyDir(assetsDir, path.join(PUBLIC_TEACH, slug, 'assets'));

  return { lessons: lessons.length };
}

function reconcile(publicSlugs: Set<string>) {
  for (const base of [CONTENT_TEACH, PUBLIC_TEACH]) {
    if (!fs.existsSync(base)) continue;
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      if (e.isDirectory() && !publicSlugs.has(e.name)) {
        console.log(`  − removing unpublished: ${path.relative(BLOG_ROOT, path.join(base, e.name))}`);
        if (!dryRun) rmrf(path.join(base, e.name));
      }
    }
  }
}

// --- main ---
const sessions = discoverSessions();
const published: string[] = [];
const skipped: string[] = [];

for (const slug of sessions) {
  const { front } = parseFrontmatter(fs.readFileSync(path.join(TEACH_DIR, slug, 'MISSION.md'), 'utf8'));
  if (front.public === true) published.push(slug);
  else skipped.push(slug);
}

console.log(`teach dir: ${TEACH_DIR}${dryRun ? '  (dry run)' : ''}`);
reconcile(new Set(published));

for (const slug of published) {
  const { lessons } = publishSession(slug);
  console.log(`  ✓ ${slug} — ${lessons} lesson(s)`);
}
if (skipped.length) console.log(`  · private (no public:true): ${skipped.join(', ')}`);
console.log(`\n${published.length} session(s) ${dryRun ? 'would be ' : ''}published.`);
if (!dryRun && published.length) {
  console.log('Next: review, then commit (git add src/content/teach public/teach && git commit).');
}
