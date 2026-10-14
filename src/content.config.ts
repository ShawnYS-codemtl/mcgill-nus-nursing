import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * The build-side half of the content contract. The editor-side half is
 * .pages.yml at the repo root, which defines the same fields as forms in
 * Pages CMS. Field names in the two files MUST match, and
 * tests/cms-contract.test.mjs fails CI if they drift.
 *
 * One rule governs every schema here: **never be stricter than the CMS form.**
 * A schema error fails the build. Cloudflare then keeps serving the previous
 * deploy, so the site stays up, but the exec's change silently never appears,
 * and they cannot see a build log. Anything the form lets an editor save must
 * build, and the contract test enforces it. Softer checks (a cover image with
 * no description, a link that isn't http) are handled in src/lib/content.ts by
 * dropping the one bad value and logging a warning, never by failing.
 */

/**
 * Where content lives. Always src/content for real builds; the tests point it
 * at tests/fixtures/content to build against known-awkward content without
 * touching the real thing. See tests/build.test.mjs.
 */
const CONTENT_DIR = process.env.CONTENT_DIR ?? 'src/content';

/** Same rule the CMS form enforces on "Web address". */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The CMS may save an optional field the editor never touched as "" or null.
 * Both mean "not set". Without this, an empty optional date or image would
 * fail to parse and take the build down over a field nobody filled in.
 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());

/**
 * The entry id is the filename, not the slug. The filename is set once, when
 * the entry is created, and the CMS cannot rename it, so it is the permanent
 * key that decision 5a asks for. The slug is just the editable URL.
 */
const filenameId = ({ entry }: { entry: string }) => entry.replace(/\.[^.]+$/, '');

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: `${CONTENT_DIR}/posts`, generateId: filenameId }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      published: z.boolean().default(false),
      date: z.coerce.date(),
      slug: z.string().regex(SLUG, 'Use lowercase letters, numbers and hyphens only'),
      summary: z.string(),
      category: optional(z.enum(['Announcement', 'Event', 'Opportunity', 'Governance', 'Newsletter'])),
      cover: optional(image()),
      coverAlt: optional(z.string()),
      featured: z.boolean().default(false),
      authorRole: optional(z.string()),
      externalLink: optional(z.string()),
      pinnedUntil: optional(z.coerce.date()),
    }),
});

/**
 * The six informational pages. The filename is the route join (about.md →
 * /about/). The CMS cannot create, rename or delete these files, so the set is
 * fixed in the repo — decision 12a.
 */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: `${CONTENT_DIR}/pages`, generateId: filenameId }),
  schema: z.object({
    title: z.string().min(1),
    metaDescription: z.string(),
    lastReviewed: optional(z.coerce.date()),
  }),
});

const council = defineCollection({
  loader: glob({ pattern: '*.yml', base: `${CONTENT_DIR}/council`, generateId: filenameId }),
  schema: ({ image }) =>
    z.object({
      role: z.string().min(1),
      term: z.string(),
      council: z.enum(['Executive', 'General']),
      vacant: z.boolean().default(false),
      name: optional(z.string()),
      program: optional(z.string()),
      email: optional(z.string()),
      photo: optional(image()),
      roleDescription: optional(z.string()),
      funFact: optional(z.string()),
      order: z.number(),
      published: z.boolean().default(true),
    }),
});

const resources = defineCollection({
  loader: glob({ pattern: '*.yml', base: `${CONTENT_DIR}/resources`, generateId: filenameId }),
  schema: z.object({
    title: z.string().min(1),
    category: z.enum([
      'Academic',
      'Financial',
      'Wellbeing & Safety',
      'Clinical & Professional',
      'Governance',
    ]),
    description: z.string(),
    link: z.string(),
    linkLabel: optional(z.string()),
    lastVerified: optional(z.coerce.date()),
    order: z.number(),
    published: z.boolean().default(true),
  }),
});

const committees = defineCollection({
  loader: glob({ pattern: '*.md', base: `${CONTENT_DIR}/committees`, generateId: filenameId }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      slug: z.string().regex(SLUG, 'Use lowercase letters, numbers and hyphens only'),
      shortDescription: z.string(),
      logo: optional(image()),
      logoAlt: optional(z.string()),
      externalLink: optional(z.string()),
      instagram: optional(z.string()),
      contactEmail: optional(z.string()),
      acceptingMembers: z.boolean().default(false),
      order: z.number(),
      published: z.boolean().default(true),
    }),
});

/**
 * One JSON file holding a list, so editors can drag photos into order. Astro's
 * file loader wants an id on every item and the CMS writes none, so the parser
 * numbers them — list position is the order.
 */
const gallery = defineCollection({
  loader: file(`${CONTENT_DIR}/gallery/gallery.json`, {
    parser: (text) =>
      (JSON.parse(text) as Record<string, unknown>[]).map((item, index) => ({
        ...item,
        id: String(index),
        order: index,
      })),
  }),
  schema: ({ image }) =>
    z.object({
      image: image(),
      alt: z.string().min(1),
      caption: optional(z.string()),
      term: optional(z.string()),
      order: z.number(),
    }),
});

export const collections = { posts, pages, council, resources, committees, gallery };
