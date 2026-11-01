import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { pickTerm } from './council-term.mjs';
import { filenameAltImages } from './image-alt.mjs';
import { emailAddress, isWebLink } from './links';
import { getSettings } from './settings';

/**
 * Checks that are too soft to fail a build over. src/content.config.ts must
 * never be stricter than the CMS form (see the note at the top of that file),
 * so anything an editor CAN save but shouldn't is handled here: the one bad
 * value is dropped, a warning names it in the build log, and everything else
 * still publishes.
 */

export type Post = CollectionEntry<'posts'>;

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

/** The CMS help text promises "Up to four posts can be featured at once". */
const FEATURED_LIMIT = 4;

export interface HomepagePosts {
  /** The first post: pinned, or else the newest. Undefined when nothing is published. */
  lead?: Post;
  featured: Post[];
  more: Post[];
}

/**
 * Every published post exactly once: the lead, then up to four featured
 * posts (the lead counts toward the four), then the rest under More news.
 */
export async function getHomepagePosts(): Promise<HomepagePosts> {
  const posts = await getPublishedPosts();
  const flagged = posts.filter((post) => post.data.featured);
  const featured = new Set(flagged.slice(0, FEATURED_LIMIT));

  for (const post of flagged.slice(FEATURED_LIMIT)) {
    warn(
      `"${post.data.title}" is marked Featured, but only ${FEATURED_LIMIT} posts can be featured at once, so it ` +
        `shows under More news instead. Switch Featured off on one that no longer needs it.`
    );
  }

  const [lead, ...rest] = posts;
  return {
    lead,
    featured: rest.filter((post) => featured.has(post)),
    more: rest.filter((post) => !featured.has(post)),
  };
}

export type GalleryPhoto = CollectionEntry<'gallery'>;

/**
 * The homepage photos: those from Site settings' current term, plus any with
 * no term, in list order. If no photo has the current term yet, the newest
 * term that has photos stands in, so the section doesn't empty at the
 * council rollover (same rule as the council, src/lib/council-term.mjs).
 */
export async function getGallery(): Promise<GalleryPhoto[]> {
  const photos = (await getCollection('gallery')).sort((a, b) => a.data.order - b.data.order);
  const { currentTerm } = getSettings();
  const picked = pickTerm(currentTerm, photos.flatMap((photo) => photo.data.term ?? []));

  if (picked?.fallback) {
    warn(
      `No homepage photos are from ${currentTerm ?? 'the current term'}, so the homepage shows ${picked.term}'s. ` +
        `Add this year's photos with that Term, or change Current council term in Site settings.`
    );
  }

  const inTerm = photos.filter((photo) => !photo.data.term || photo.data.term === picked?.term);

  // The form requires a description, but a few spaces get past it, and a
  // screen reader would skip the photo. Left out, as a cover would be.
  const shown = inTerm.filter((photo) => {
    if (photo.data.alt.trim()) return true;
    warn(`Homepage photo ${photo.data.order + 1} (in list order) was left out because its description is blank.`);
    return false;
  });

  console.log(`  [content] ${shown.length} homepage photo(s), ${photos.length - inTerm.length} from other terms hidden`);
  return shown;
}

export type Page = CollectionEntry<'pages'>;

/**
 * The informational pages, by filename: src/content/pages/<name>.md. Each
 * has its own route file in src/pages/ and its address in src/config/routes.ts.
 * The set is fixed (CLAUDE.md decision 12a). Editors can't add or delete one,
 * so a missing file is a developer's mistake and fails the build.
 */
export const INFO_PAGES = ['about', 'fees', 'governance', 'elections', 'contact'] as const;
export type InfoPageName = (typeof INFO_PAGES)[number];

const isInfoPage = (id: string): id is InfoPageName => (INFO_PAGES as readonly string[]).includes(id);

/** Same as in src/content.config.ts; tests/build.test.mjs points it at fixtures. */
const CONTENT_DIR = process.env.CONTENT_DIR ?? 'src/content';

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * "Last checked" dates are compared with the build date, so a page or
 * resource turns stale at the first Save of anything after its anniversary.
 */
function aYearAgo(): Date {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate()));
}

/**
 * Build-log notes on the pages, none of which fail the build: a page nobody
 * has re-read in a year is still better shown than missing.
 */
async function checkPages(): Promise<void> {
  const yearAgo = aYearAgo();
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

export type CouncilMember = CollectionEntry<'council'>;

export interface Council {
  /** The term shown, e.g. "2025-2026". Not always Site settings' current term: see src/lib/council-term.mjs. */
  term: string;
  executive: CouncilMember[];
  general: CouncilMember[];
}

async function loadCouncil(): Promise<Council | undefined> {
  const published = (await getCollection('council')).filter((entry) => entry.data.published);
  const { currentTerm } = getSettings();
  const picked = pickTerm(currentTerm, published.map((entry) => entry.data.term));

  if (!picked) {
    warn(`No council entries are shown on the site, so the council page says the council hasn't been posted yet.`);
    return undefined;
  }
  if (picked.fallback) {
    warn(
      currentTerm
        ? `No council entries for ${currentTerm}, so the roster shows ${picked.term}. Add the new council, ` +
            `or change Current council term in Site settings.`
        : `Site settings has no current council term, so the roster shows ${picked.term}, the newest term with entries.`
    );
  }

  const members = published
    .filter((entry) => entry.data.term === picked.term)
    .sort((a, b) => a.data.order - b.data.order || a.data.role.localeCompare(b.data.role))
    .map((entry) => {
      const data = { ...entry.data };

      if (!data.vacant && !data.name?.trim()) {
        warn(`${data.role} (${data.term}) has no name, so only the role shows. Add the name, or switch on Position is vacant.`);
      }

      if (data.email) {
        const address = emailAddress(data.email);
        if (!address) warn(`${data.role} (${data.term}): "${data.email}" ignored, because it isn't an email address.`);
        data.email = address;
      }

      return { ...entry, data };
    });

  return {
    term: picked.term,
    executive: members.filter((member) => member.data.council === 'Executive'),
    general: members.filter((member) => member.data.council === 'General'),
  };
}

let councilPending: Promise<Council | undefined> | undefined;

/** The council to show at /about/council/. Undefined when no term has any entries. */
export function getCouncil(): Promise<Council | undefined> {
  councilPending ??= loadCouncil();
  return councilPending;
}

type ResourceEntry = CollectionEntry<'resources'>;
type ResourceCategory = ResourceEntry['data']['category'];

/** A published resource. Its link is undefined when the one saved in the CMS isn't safe to show. */
export type Resource = Omit<ResourceEntry, 'data'> & { data: Omit<ResourceEntry['data'], 'link'> & { link?: string } };

export interface ResourceGroup {
  category: ResourceCategory;
  resources: Resource[];
}

const CATEGORY_ORDER: Record<ResourceCategory, number> = {
  Academic: 1,
  Financial: 2,
  'Wellbeing & Safety': 3,
  'Clinical & Professional': 4,
  Governance: 5,
};

/**
 * http(s), or a page on this site. "//elsewhere.example" (and "/\elsewhere",
 * which browsers read the same way) is another site, though the CMS form's
 * "starts with /" rule lets it through. Browsers drop tabs and line breaks
 * from a link before reading it, so "/<tab>/elsewhere" is another site too.
 */
const isResourceLink = (value: string) => {
  const link = value.replace(/[\t\n\r]/g, '');
  return isWebLink(link) || /^\/(?![/\\])/.test(link);
};

async function loadResources(): Promise<ResourceGroup[]> {
  const yearAgo = aYearAgo();
  const neverChecked: string[] = [];

  const resources = (await getCollection('resources'))
    .filter((resource) => resource.data.published)
    .map((resource) => {
      const data: Resource['data'] = { ...resource.data };

      if (!isResourceLink(resource.data.link)) {
        warn(`"${data.title}": link "${data.link}" ignored — links must start with https://, or / for a page on this site`);
        data.link = undefined;
      }

      if (!data.lastVerified) {
        neverChecked.push(`"${data.title}"`);
      } else if (data.lastVerified < yearAgo) {
        warn(
          `"${data.title}": link last checked on ${isoDate(data.lastVerified)}, over a year ago. Someone should ` +
            `click it, then set Link last checked to today in Pages CMS.`
        );
      }

      return { ...resource, data };
    })
    .sort(
      (a, b) =>
        CATEGORY_ORDER[a.data.category] - CATEGORY_ORDER[b.data.category] ||
        a.data.order - b.data.order ||
        a.data.title.localeCompare(b.data.title)
    );

  if (neverChecked.length) {
    warn(`Resources whose link was never checked: ${neverChecked.join(', ')}. Set Link last checked in Pages CMS once someone has clicked it.`);
  }

  return [...Map.groupBy(resources, (resource) => resource.data.category)].map(([category, resources]) => ({ category, resources }));
}

let resourcesPending: Promise<ResourceGroup[]> | undefined;

/** Published resources for /resources/, by category in a fixed order. Empty categories are left out. */
export function getResources(): Promise<ResourceGroup[]> {
  resourcesPending ??= loadResources();
  return resourcesPending;
}

export type Committee = CollectionEntry<'committees'>;

async function loadCommittees(): Promise<Committee[]> {
  const published = (await getCollection('committees'))
    .filter((committee) => committee.data.published)
    .sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));

  const seen = new Map<string, string>();
  const noDescription: string[] = [];
  const kept: Committee[] = [];

  for (const committee of published) {
    const data = { ...committee.data };

    const clash = seen.get(data.slug);
    if (clash) {
      warn(
        `"${data.name}" was left out: its web address "${data.slug}" is already used by "${clash}". ` +
          `Give one of them a different web address.`
      );
      continue;
    }
    seen.set(data.slug, data.name);

    if (data.logo && !data.logoAlt?.trim()) {
      warn(`"${data.name}": logo left out because it has no description.`);
      data.logo = undefined;
    }

    for (const field of ['externalLink', 'instagram'] as const) {
      const link = data[field];
      if (link && !isWebLink(link)) {
        warn(`"${data.name}": "${link}" ignored — links must start with https://`);
        data[field] = undefined;
      }
    }

    if (data.contactEmail) {
      const address = emailAddress(data.contactEmail);
      if (!address) warn(`"${data.name}": contact email "${data.contactEmail}" ignored, because it isn't an email address.`);
      data.contactEmail = address;
    }

    if (!data.shortDescription.trim()) noDescription.push(`"${data.name}"`);

    if (!data.externalLink) {
      for (const alt of filenameAltImages(committee.body ?? '')) {
        warn(
          `"${data.name}": an image in the committee page has no description (only its filename, "${alt}"), ` +
            `so screen readers skip it. If it holds information, write that information in the text too.`
        );
      }
    }

    kept.push({ ...committee, data });
  }

  if (noDescription.length) {
    warn(`Committees with no short description, so their card shows only a name: ${noDescription.join(', ')}.`);
  }

  return kept;
}

let committeesPending: Promise<Committee[]> | undefined;

/** Published committees and clubs for /involved/, in order. */
export function getCommittees(): Promise<Committee[]> {
  committeesPending ??= loadCommittees();
  return committeesPending;
}

/** Committees that get their own page. One with an external link points off-site instead. */
export async function getCommitteesWithPages(): Promise<Committee[]> {
  return (await getCommittees()).filter((committee) => !committee.data.externalLink);
}
