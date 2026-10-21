import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
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

export type Page = CollectionEntry<'pages'>;

/**
 * The six informational pages, by filename: src/content/pages/<name>.md. Each
 * has its own route file in src/pages/ and its address in src/config/routes.ts.
 * The set is fixed (CLAUDE.md decision 12a). Editors can't add or delete one,
 * so a missing file is a developer's mistake and fails the build.
 */
export const INFO_PAGES = ['about', 'fees', 'governance', 'ison', 'elections', 'contact'] as const;
export type InfoPageName = (typeof INFO_PAGES)[number];

const isInfoPage = (id: string): id is InfoPageName => (INFO_PAGES as readonly string[]).includes(id);

/** Same as in src/content.config.ts; tests/build.test.mjs points it at fixtures. */
const CONTENT_DIR = process.env.CONTENT_DIR ?? 'src/content';

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Build-log notes on the pages, none of which fail the build: a page nobody
 * has re-read in a year is still better shown than missing. "Last checked" is
 * compared with the build date, so a page turns stale at the first Save of
 * anything after its anniversary.
 */
async function checkPages(): Promise<void> {
  const today = new Date();
  const yearAgo = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate()));
  const neverChecked: string[] = [];

  for (const page of await getCollection('pages')) {
    const { title, lastReviewed } = page.data;

    // Only a developer can add a file here (the CMS can't), so this is
    // someone halfway through "Adding a new page" in MAINTENANCE.md.
    if (!isInfoPage(page.id)) {
      warn(`${CONTENT_DIR}/pages/${page.id}.md has no route, so it isn't on the site. See MAINTENANCE.md → "Adding a new page".`);
      continue;
    }

    if (!lastReviewed) {
      neverChecked.push(`"${title}"`);
    } else if (lastReviewed < yearAgo) {
      warn(
        `"${title}" was last checked on ${isoDate(lastReviewed)}, over a year ago. Someone should read it ` +
          `through, then set Last checked to today in Pages CMS.`
      );
    }

    // As for posts: src/lib/image-alt.mjs has already made the image
    // decorative. This makes the gap visible in the log.
    for (const alt of filenameAltImages(page.body ?? '')) {
      warn(
        `"${title}": an image in the page text has no description (only its filename, "${alt}"), ` +
          `so screen readers skip it. If it holds information, write that information in the text too.`
      );
    }
  }

  if (neverChecked.length) {
    warn(`Pages never checked: ${neverChecked.join(', ')}. Set Last checked in Pages CMS once someone has read a page through.`);
  }
}

/** Memoised like getPublishedPosts, so the notes are logged once per build. */
let pagesChecked: Promise<void> | undefined;

/** One informational page, for src/components/InfoPage.astro. */
export async function getInfoPage(name: InfoPageName): Promise<Page> {
  pagesChecked ??= checkPages();
  await pagesChecked;

  const page = await getEntry('pages', name);
  if (!page) {
    throw new Error(
      `${CONTENT_DIR}/pages/${name}.md is missing. Every informational page needs its file, and editors ` +
        `can't delete one, so it was removed in the repo. Restore it from git history ` +
        `(git log -- ${CONTENT_DIR}/pages/${name}.md finds the last version).`
    );
  }
  return page;
}
