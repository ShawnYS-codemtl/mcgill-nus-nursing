import { Client } from '@notionhq/client';
import { readEnv } from './env';

/**
 * Pinned on purpose — do not remove the pin.
 *
 * Notion changed its data model in version 2025-09-03: a database became a
 * container for one or more *data sources*, and `/v1/databases/:id/query` was
 * replaced by `/v1/data_sources/:id/query`. Leaving the version unpinned means
 * a server-side bump can silently reshape responses under a site that nobody is
 * watching, which is the exact failure this project is built to avoid.
 *
 * See docs/notion-schema.md.
 */
export const NOTION_API_VERSION = '2025-09-03';

/** Notion allows roughly 3 requests/second. Stay comfortably under it. */
const MIN_REQUEST_INTERVAL_MS = 350;
const MAX_RETRIES = 4;

let client: Client | null | undefined;
let lastRequestAt = 0;

/**
 * Returns null when no token is configured, rather than throwing. Callers fall
 * back to the committed cache — a stale site beats a broken one.
 */
export function getClient(): Client | null {
  if (client !== undefined) return client;

  const auth = readEnv('NOTION_TOKEN');
  client = auth ? new Client({ auth, notionVersion: NOTION_API_VERSION }) : null;
  return client;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimited(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error && (error as { code?: string }).code === 'rate_limited')
  );
}

/**
 * Serialises and throttles every Notion call, retrying rate limits with
 * backoff. Fetching block children for many pages will hit the limit otherwise
 * — and it does so only once there is enough content to matter, i.e. long after
 * anyone is still testing.
 */
export async function notionRequest<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    try {
      return await fn();
    } catch (error) {
      if (!isRateLimited(error) || attempt >= MAX_RETRIES) throw error;
      const backoff = MIN_REQUEST_INTERVAL_MS * 2 ** (attempt + 1);
      console.warn(`  Notion rate limit hit; retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
}
