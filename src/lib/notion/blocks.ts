import type { Client } from '@notionhq/client';
import { notionRequest } from './client';

/**
 * Minimal structural types. The SDK's own block union is enormous and changes
 * between versions; matching on `type` and reading defensively survives that
 * better than importing a type that may not exist next year.
 */
type RichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};

type Block = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

/** Blocks Phase 0 renders. Anything else is reported, never silently dropped. */
const SUPPORTED = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
  'divider',
  'code',
]);

/** How deeply nested lists are followed, as a loop guard. */
const MAX_DEPTH = 4;

export type RenderWarning = { postTitle: string; blockType: string; reason: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes first, then wraps in annotation tags. Notion content is written by
 * execs and pasted from elsewhere; it reaches the page as text, never as markup.
 */
function renderRichText(items: RichText[] | undefined): string {
  if (!items?.length) return '';

  return items
    .map((item) => {
      let html = escapeHtml(item.plain_text ?? '');
      if (!html) return '';

      const a = item.annotations ?? {};
      if (a.code) html = `<code>${html}</code>`;
      if (a.bold) html = `<strong>${html}</strong>`;
      if (a.italic) html = `<em>${html}</em>`;
      if (a.strikethrough) html = `<s>${html}</s>`;
      if (a.underline) html = `<u>${html}</u>`;

      // Only http(s) links. A `javascript:` href pasted into Notion would
      // otherwise become a live script on the page.
      if (item.href && /^https?:\/\//i.test(item.href)) {
        html = `<a href="${escapeHtml(item.href)}" rel="noopener">${html}</a>`;
      }
      return html;
    })
    .join('');
}

const richTextOf = (block: Block): RichText[] | undefined =>
  (block[block.type] as { rich_text?: RichText[] } | undefined)?.rich_text;

async function fetchChildren(client: Client, blockId: string): Promise<Block[]> {
  const blocks: Block[] = [];
  let cursor: string | undefined;

  do {
    const response = await notionRequest(() =>
      client.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 })
    );
    blocks.push(...(response.results as unknown as Block[]));
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}

/**
 * Renders a Notion page body to HTML.
 *
 * Image blocks are deliberately SKIPPED with a warning. Notion serves uploaded
 * files from signed S3 URLs that stop working after about an hour, so emitting
 * one produces a page that looks perfect on deploy day and is broken by lunch.
 * Phase 0 has no image pipeline yet, and skipping is the only option here that
 * cannot fail silently. See CLAUDE.md §4 and MAINTENANCE.md Landmine 2.
 */
export async function renderBlocks(
  client: Client,
  pageId: string,
  postTitle: string,
  warnings: RenderWarning[],
  depth = 0
): Promise<string> {
  if (depth > MAX_DEPTH) return '';

  const blocks = await fetchChildren(client, pageId);
  const html: string[] = [];
  let openList: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (openList) {
      html.push(`</${openList}>`);
      openList = null;
    }
  };

  for (const block of blocks) {
    const { type } = block;

    if (type === 'image') {
      closeList();
      warnings.push({
        postTitle,
        blockType: 'image',
        reason: 'images are not supported until the image pipeline exists (Phase 0)',
      });
      continue;
    }

    if (!SUPPORTED.has(type)) {
      closeList();
      warnings.push({ postTitle, blockType: type, reason: 'block type not yet supported' });
      continue;
    }

    const listTag = type === 'bulleted_list_item' ? 'ul' : type === 'numbered_list_item' ? 'ol' : null;
    if (listTag) {
      if (openList !== listTag) {
        closeList();
        html.push(`<${listTag}>`);
        openList = listTag;
      }
      const nested = block.has_children
        ? await renderBlocks(client, block.id, postTitle, warnings, depth + 1)
        : '';
      html.push(`<li>${renderRichText(richTextOf(block))}${nested}</li>`);
      continue;
    }

    closeList();

    switch (type) {
      case 'divider':
        html.push('<hr />');
        break;
      case 'heading_1':
        html.push(`<h2>${renderRichText(richTextOf(block))}</h2>`);
        break;
      case 'heading_2':
        html.push(`<h3>${renderRichText(richTextOf(block))}</h3>`);
        break;
      case 'heading_3':
        html.push(`<h4>${renderRichText(richTextOf(block))}</h4>`);
        break;
      case 'quote':
        html.push(`<blockquote>${renderRichText(richTextOf(block))}</blockquote>`);
        break;
      case 'code': {
        const text = (richTextOf(block) ?? []).map((t) => t.plain_text ?? '').join('');
        html.push(`<pre><code>${escapeHtml(text)}</code></pre>`);
        break;
      }
      default: {
        const body = renderRichText(richTextOf(block));
        // An empty paragraph is how execs add spacing in Notion; don't emit <p></p>.
        if (body) html.push(`<p>${body}</p>`);
      }
    }
  }

  closeList();
  return html.join('\n');
}
