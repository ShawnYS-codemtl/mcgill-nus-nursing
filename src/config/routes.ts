/**
 * Every address the code links to, in one place. Link with these, never with
 * a typed-out "/about/…" string (docs/information-architecture.md → "Leave
 * room for locale prefixes"). If a French version ever arrives, adding /fr/
 * becomes a change to this file rather than a hunt through every component.
 *
 * A path here doesn't create a page: the route files in src/pages/ do, and
 * the file path is the address. Moving a page means changing both. The
 * informational pages are keyed by their content file (src/content/pages/
 * <key>.md), and tests/build.test.mjs checks that each builds at its address.
 *
 * Only pages that exist go here.
 */
export const ROUTES = {
  home: '/',
  /** The Land Acknowledgement's full text, at the end of the homepage. */
  landAcknowledgement: '/#land-acknowledgement',
  /** A post's own page. Only posts without an external link have one. */
  post: (slug: string) => `/news/${slug}/`,
  about: '/about/',
  council: '/about/council/',
  fees: '/about/fees/',
  governance: '/about/governance/',
  elections: '/about/elections/',
  involved: '/involved/',
  /** A committee's own page. Only committees without an external link have one. */
  committee: (slug: string) => `/involved/${slug}/`,
  resources: '/resources/',
  contact: '/contact/',
} as const;
