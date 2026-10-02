// Public entries: folders synced from outside the repo into public/ by
// `bun run sync-public`. See public.json and ADR 0003.
import entries from '../../public.json';

export type Typ = 'teach' | 'link' | 'unlisted';

export interface PublicEntry {
  name: string;
  source: string;
  typ: Typ;
  exclude?: string[];
}

export const publicEntries = entries as PublicEntry[];

// URL path (and path below public/) for an entry.
export function entryPath(e: PublicEntry): string {
  return e.typ === 'unlisted' ? `/${e.name}/` : `/teach/${e.name}/`;
}
