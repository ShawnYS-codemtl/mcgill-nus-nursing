import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * `.cache/notion/` is COMMITTED TO THE REPO. It looks like generated junk; it
 * is not. It is the last-known-good copy of all Notion content, and the build
 * falls back to it when the API is unreachable or the token has expired.
 *
 * Deleting it or adding it to .gitignore means an API hiccup years from now
 * takes the whole site down instead of serving slightly stale content.
 * See CLAUDE.md decision 4 and MAINTENANCE.md Landmine 3.
 */
const CACHE_DIR = path.join(process.cwd(), '.cache', 'notion');

const cacheFile = (name: string) => path.join(CACHE_DIR, `${name}.json`);

export async function writeCache(name: string, data: unknown): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile(name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function readCache<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(cacheFile(name), 'utf8')) as T;
  } catch {
    return null;
  }
}
