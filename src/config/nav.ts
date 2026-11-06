import { ROUTES } from './routes';

/**
 * The site's navigation: labels here, addresses in ./routes.ts. These are UI
 * strings, so they live in the repo and not in Pages CMS (CLAUDE.md decision
 * 6): an editor renaming a page's heading must never be able to break the nav.
 *
 * Rendered as the tabs by src/components/Nav.astro on every page, and as the
 * list of suggestions on the "Page not found" page (src/pages/404.astro). About's
 * children are its sub-index (src/components/AboutIndex.astro), not tabs. Link
 * only to pages that exist.
 */

/**
 * Which tab and sheet a page sits on. It picks the colours (src/styles/global.css,
 * [data-section]), which never change with the season (CLAUDE.md decision 17).
 */
export type Section = 'news' | 'about' | 'involved' | 'resources' | 'contact';

export interface NavItem {
  label: string;
  href: string;
  section?: Section;
  children?: readonly NavItem[];
}

/** The accessible name of the main nav, read out by screen readers. */
export const NAV_LABEL = 'Main';

export const NAV_ITEMS: readonly NavItem[] = [
  // The homepage is the news feed, so the News tab is the homepage.
  { label: 'News', href: ROUTES.home, section: 'news' },
  {
    label: 'About',
    href: ROUTES.about,
    section: 'about',
    children: [
      { label: 'Council', href: ROUTES.council },
      { label: 'Fees', href: ROUTES.fees },
      { label: 'Governance', href: ROUTES.governance },
      { label: 'Elections', href: ROUTES.elections },
    ],
  },
  { label: 'Get involved', href: ROUTES.involved, section: 'involved' },
  { label: 'Resources', href: ROUTES.resources, section: 'resources' },
  // A tab on laptops only; on phones it's the button on the window (Header.astro).
  { label: 'Contact', href: ROUTES.contact, section: 'contact' },
];

/**
 * The top-level item a page belongs to: its own, or the one whose address its
 * path starts with. Posts (/news/…) belong to News, whose address is the
 * homepage. The "Page not found" page belongs to none.
 */
export function currentItem(path: string): NavItem | undefined {
  // A post's page is /news/<slug>/, so its slug is the path's second part.
  const isPost = path === ROUTES.post(path.split('/')[2] ?? '');
  return NAV_ITEMS.find(({ href }) => (href === ROUTES.home ? path === href || isPost : path.startsWith(href)));
}
