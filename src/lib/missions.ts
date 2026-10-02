// Read synced teach missions from public/teach/<name>/ at build time.
import fs from 'node:fs';
import path from 'node:path';
import { publicEntries, entryPath } from './public-entries';

export interface Page { title: string; href: string }
export interface Mission {
  name: string;
  title: string;
  why: string;
  lessons: Page[];
  references: Page[];
}

const PUBLIC = path.resolve('public');

function pages(dir: string, href: string): Page[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(f => {
      const html = fs.readFileSync(path.join(dir, f), 'utf8');
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim() || f.replace(/\.html$/, '');
      return { title, href: href + f };
    });
}

export function getMissions(): Mission[] {
  return publicEntries
    .filter(e => e.typ === 'teach')
    .map(e => {
      const href = entryPath(e);
      const dir = path.join(PUBLIC, href);
      const missionFile = path.join(dir, 'MISSION.md');
      const md = fs.existsSync(missionFile) ? fs.readFileSync(missionFile, 'utf8') : '';
      const title = md.match(/^#\s+(.*)$/m)?.[1].replace(/^Mission:\s*/, '') ?? e.name;
      const why = md.match(/^## Why\n+([\s\S]*?)(?:\n\n|\n#|$)/m)?.[1].replace(/\s+/g, ' ').trim() ?? '';
      return {
        name: e.name,
        title,
        why,
        lessons: pages(path.join(dir, 'lessons'), `${href}lessons/`),
        references: pages(path.join(dir, 'reference'), `${href}reference/`),
      };
    });
}
