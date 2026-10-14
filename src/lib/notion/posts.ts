import type { Client } from '@notionhq/client';
import { readCache, writeCache } from './cache';
import { getClient, notionRequest } from './client';
import { resolveDataSourceId } from './datasource';
import { renderBlocks, type RenderWarning } from './blocks';
import { readEnv } from './env';

const LABEL = 'Posts DB';
const CACHE_KEY = 'posts';

export type Post = {
  id: string;
  key: string;
  slug: string;
  title: string;
  publishedDate: string;
  bodyHtml: string;
};

export type PostsResult = {
  posts: Post[];
  fromCache: boolean;
};

/**
 * Thrown when the Notion schema no longer matches what the build expects —
 * almost always because somebody renamed a column. Deliberately fatal and
 * deliberately readable: a wrong site is worse than a failed build, and the
 * message has to mean something to whoever reads the deploy log.
 */
class SchemaError extends Error {}

type NotionPage = {
  id: string;
  properties: Record<string, { type: string; [key: string]: unknown }>;
};

const plainText = (rich: Array<{ plain_text?: string }> | undefined): string =>
  (rich ?? [])
    .map((item) => item.plain_text ?? '')
    .join('')
    .trim();

/** Every property the build reads, and the Notion type each one must be. */
const REQUIRED_PROPERTIES: ReadonlyArray<readonly [name: string, type: string]> = [
  ['Title', 'title'],
  ['Key', 'rich_text'],
  ['Slug', 'rich_text'],
  ['Status', 'select'],
  ['Published date', 'date'],
];

function validateSchema(page: NotionPage): void {
  for (const [name, expectedType] of REQUIRED_PROPERTIES) {
    const property = page.properties[name];

    if (!property) {
      throw new SchemaError(
        `${LABEL}: expected property "${name}", found none. Did someone rename it?`
      );
    }
    if (property.type !== expectedType) {
      throw new SchemaError(
        `${LABEL}: property "${name}" should be type "${expectedType}" but is "${property.type}". ` +
          'Change it back in Notion, or update src/lib/notion/posts.ts.'
      );
    }
  }
}

/**
 * Returns null for a row that is individually unusable — a blank slug, say.
 * One bad row is skipped with a warning; it does not take the site down.
 */
function normalisePost(page: NotionPage): { post: Omit<Post, 'bodyHtml'> | null; reason?: string } {
  const props = page.properties;

  const title = plainText(props.Title?.title as Array<{ plain_text?: string }>);
  const slug = plainText(props.Slug?.rich_text as Array<{ plain_text?: string }>);
  const key = plainText(props.Key?.rich_text as Array<{ plain_text?: string }>);
  const publishedDate = (props['Published date']?.date as { start?: string } | null)?.start ?? '';

  if (!title) return { post: null, reason: 'no title' };
  if (!slug) return { post: null, reason: `"${title}" has no Slug` };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      post: null,
      reason: `"${title}" has slug "${slug}" — use lowercase letters, numbers and hyphens only`,
    };
  }
  if (!publishedDate) return { post: null, reason: `"${title}" has no Published date` };

  return { post: { id: page.id, key, slug, title, publishedDate } };
}

async function queryPublished(client: Client, dataSourceId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const response = await notionRequest(() =>
      client.dataSources.query({
        data_source_id: dataSourceId,
        filter: { property: 'Status', select: { equals: 'Published' } },
        sorts: [{ property: 'Published date', direction: 'descending' }],
        start_cursor: cursor,
        page_size: 100,
      })
    );

    pages.push(...(response.results as unknown as NotionPage[]));
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return pages;
}

async function fetchFromNotion(client: Client, databaseId: string): Promise<Post[]> {
  const dataSourceId = await resolveDataSourceId(client, databaseId, LABEL);

  let pages: NotionPage[];
  try {
    pages = await queryPublished(client, dataSourceId);
  } catch (error) {
    // A renamed Status or Published date surfaces here as a validation error
    // from Notion. Translate it before it reaches the log as a stack trace.
    const message = error instanceof Error ? error.message : String(error);
    if (/property|sort|filter/i.test(message)) {
      throw new SchemaError(
        `${LABEL}: Notion rejected the query — "${message}". ` +
          'This usually means the "Status" or "Published date" property was renamed.'
      );
    }
    throw error;
  }

  if (pages.length === 0) {
    console.warn(
      `  ${LABEL}: no published posts returned. If you expected some, check that the ` +
        'integration is shared with the database — an unshared token returns an empty ' +
        'list rather than an error.'
    );
    return [];
  }

  validateSchema(pages[0]!);

  const posts: Post[] = [];
  const skipped: string[] = [];
  const renderWarnings: RenderWarning[] = [];

  for (const page of pages) {
    const { post, reason } = normalisePost(page);
    if (!post) {
      skipped.push(reason ?? 'unknown reason');
      continue;
    }
    const bodyHtml = await renderBlocks(client, page.id, post.title, renderWarnings);
    posts.push({ ...post, bodyHtml });
  }

  const duplicates = posts
    .map((p) => p.slug)
    .filter((slug, index, all) => all.indexOf(slug) !== index);
  if (duplicates.length) {
    throw new SchemaError(
      `${LABEL}: duplicate slug(s) ${[...new Set(duplicates)].join(', ')}. ` +
        'Two posts cannot share a URL — give each one a unique Slug in Notion.'
    );
  }

  logSummary(posts, skipped, renderWarnings);
  return posts;
}

function logSummary(posts: Post[], skipped: string[], warnings: RenderWarning[]): void {
  console.log(`  ${LABEL}: ${posts.length} published post(s)`);

  for (const reason of skipped) console.warn(`  [skipped] ${reason}`);

  const images = warnings.filter((w) => w.blockType === 'image');
  if (images.length) {
    console.warn(
      `  [skipped] ${images.length} image block(s) — Phase 0 has no image pipeline, so ` +
        'they are left out rather than emitting Notion URLs that expire in an hour.'
    );
  }
  for (const warning of warnings.filter((w) => w.blockType !== 'image')) {
    console.warn(`  [skipped] unsupported "${warning.blockType}" block in "${warning.postTitle}"`);
  }
}

async function loadPosts(): Promise<PostsResult> {
  const client = getClient();
  const databaseId = readEnv('NOTION_DB_POSTS');

  const fallback = async (why: string): Promise<PostsResult> => {
    const cached = await readCache<Post[]>(CACHE_KEY);
    if (cached) {
      console.warn(
        `\n  !! ${why}\n  !! Building from the committed cache in .cache/notion/. ` +
          `Content may be stale. ${cached.length} post(s) restored.\n`
      );
      return { posts: cached, fromCache: true };
    }
    throw new Error(
      `${why}\nNo cache in .cache/notion/ to fall back on either, so there is nothing to build. ` +
        'Set NOTION_TOKEN and NOTION_DB_POSTS (see .env.example), or restore the committed cache.'
    );
  };

  if (!client) return fallback('NOTION_TOKEN is not set.');
  if (!databaseId) return fallback('NOTION_DB_POSTS is not set.');

  try {
    const posts = await fetchFromNotion(client, databaseId);
    await writeCache(CACHE_KEY, posts);
    return { posts, fromCache: false };
  } catch (error) {
    // A schema break is the one thing worth failing the build for: it means the
    // content contract changed, and silently serving cached content would hide
    // that until someone noticed the site had quietly stopped updating.
    if (error instanceof SchemaError) throw error;

    const message = error instanceof Error ? error.message : String(error);
    return fallback(`Could not reach Notion: ${message}`);
  }
}

/** Memoised so a build fetches once, not once per page. */
let pending: Promise<PostsResult> | undefined;

export function getPosts(): Promise<PostsResult> {
  pending ??= loadPosts();
  return pending;
}
