import { getCollection, type CollectionEntry } from 'astro:content';
import { filenameAltImages } from './image-alt.mjs';

/**
 * Checks that are too soft to fail a build over. src/content.config.ts must
 * never be stricter than the CMS form (see the note at the top of that file),
 * so anything an editor CAN save but shouldn't is handled here: the one bad
 * value is dropped, a warning names it in the build log, and everything else
 * still publishes.
 */

export type Post = CollectionEntry<'posts'>;

/** Only http(s). A `javascript:` link typed into the CMS would otherwise become a live script. */
export const isWebLink = (value: string | undefined): value is string =>
  !!value && /^https?:\/\//i.test(value);

function warn(message: string): void {
  console.warn(`  [content] ${message}`);
}

/** Pinned posts first, then newest first. */
function byPinThenDate(now: Date) {
  const pinned = (post: Post) => !!post.data.pinnedUntil && post.data.pinnedUntil >= now;
  return (a: Post, b: Post) =>
    Number(pinned(b)) - Number(pinned(a)) || b.data.date.getTime() - a.data.date.getTime();
}

async function loadPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  const now = new Date();
  const posts = all.filter((post) => post.data.published).sort(byPinThenDate(now));

  const seen = new Map<string, string>();
  const kept: Post[] = [];

  for (const post of posts) {
    // A copy, so dropping a bad value never touches Astro's own entry.
    const data = { ...post.data };

    // Two posts with the same web address can't both exist. The form can't
    // stop an editor creating this, so keep the newer one and say so, rather
    // than failing the build and freezing the whole site.
    const clash = seen.get(data.slug);
    if (clash) {
      warn(
        `"${data.title}" was left out: its web address "${data.slug}" is already used by ` +
          `"${clash}". Give one of them a different web address.`
      );
      continue;
    }
    seen.set(data.slug, data.title);

    if (data.cover && !data.coverAlt?.trim()) {
      warn(`"${data.title}": cover image left out because it has no description.`);
      data.cover = undefined;
    }

    if (data.externalLink && !isWebLink(data.externalLink)) {
      warn(`"${data.title}": "${data.externalLink}" ignored — links must start with https://`);
      data.externalLink = undefined;
    }

    // The image itself still shows; src/lib/image-alt.mjs has already made it
    // decorative. This just makes the gap visible to whoever reads the log.
    for (const alt of filenameAltImages(post.body ?? '')) {
      warn(
        `"${data.title}": an image in the post text has no description (only its filename, ` +
          `"${alt}"), so screen readers skip it. If it matters, make it the Cover image instead.`
      );
    }

    kept.push({ ...post, data });
  }

  console.log(`  [content] ${kept.length} published post(s), ${all.length - posts.length} draft(s)`);
  return kept;
}

/** Memoised so a build reads and logs once, not once per page. */
let pending: Promise<Post[]> | undefined;

export function getPublishedPosts(): Promise<Post[]> {
  pending ??= loadPublishedPosts();
  return pending;
}

/** Posts that get their own page. One with an external link points off-site instead. */
export async function getPostsWithPages(): Promise<Post[]> {
  return (await getPublishedPosts()).filter((post) => !post.data.externalLink);
}
