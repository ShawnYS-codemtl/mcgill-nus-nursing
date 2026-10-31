import { ROUTES } from './routes';

/**
 * The site's navigation: labels here, addresses in ./routes.ts. These are UI
 * strings, so they live in the repo and not in Pages CMS (CLAUDE.md decision
 * 6): an editor renaming a page's heading must never be able to break the nav.
 *
 * Rendered by src/components/Nav.astro in every page's header, and as the list
 * of suggestions on the "Page not found" page (src/pages/404.astro). Link only
 * to pages that exist.
 */

export interface NavItem {
  label: string;
  href: string;
  children?: readonly NavItem[];
}

/** The accessible name of the main nav, read out by screen readers. */
export const NAV_LABEL = 'Main';

export const NAV_ITEMS: readonly NavItem[] = [
  // The homepage is the news feed, so the News tab is the homepage.
  { label: 'News', href: ROUTES.home },
  {
    label: 'About',
    href: ROUTES.about,
    children: [
      { label: 'Council', href: ROUTES.council },
      { label: 'Fees', href: ROUTES.fees },
      { label: 'Governance', href: ROUTES.governance },
      { label: 'Elections', href: ROUTES.elections },
    ],
  },
  { label: 'Get involved', href: ROUTES.involved },
  { label: 'Resources', href: ROUTES.resources },
  { label: 'Contact', href: ROUTES.contact },
];
