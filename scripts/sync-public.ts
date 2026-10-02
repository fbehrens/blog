#!/usr/bin/env bun
/**
 * sync-public.ts — rsync every entry in public.json into public/.
 *
 * Usage: bun run sync-public
 */
import path from 'node:path';
import { publicEntries, entryPath } from '../src/lib/public-entries';

const PUBLIC = path.resolve(import.meta.dir, '../public');
const DEFAULT_EXCLUDE = ['.*', 'NOTES.md', 'learning-records', 'node_modules'];

let failed = 0;
for (const e of publicEntries) {
  const dest = path.join(PUBLIC, entryPath(e));
  const excludes = [...DEFAULT_EXCLUDE, ...(e.exclude ?? [])].flatMap(x => ['--exclude', x]);
  const src = e.source.replace(/\/?$/, '/');
  console.log(`\n→ ${e.name}: ${src} → ${path.relative(process.cwd(), dest)}/`);
  await Bun.$`mkdir -p ${dest}`;
  const { exitCode } = await Bun.$`rsync -av --delete --delete-excluded ${excludes} ${src} ${dest}/`.nothrow();
  if (exitCode !== 0) {
    console.warn(`⚠ ${e.name}: rsync failed (exit ${exitCode}), skipped`);
    failed++;
  }
}
if (failed) console.warn(`\n${failed} entr${failed === 1 ? 'y' : 'ies'} failed`);
