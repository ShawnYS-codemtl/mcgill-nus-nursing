// @ts-check
import { defineConfig } from 'astro/config';

// Phase 0 deliberately ships no integrations and no styling. It exists to
// validate one thing: that a council exec can publish from Pages CMS unaided.
// See CLAUDE.md §12. Content lives in src/content/ (schemas in
// src/content.config.ts); images go through Astro's built-in pipeline.
//
// `site` is the Cloudflare Pages preview subdomain. It becomes
// https://mcgillnus.ca at DNS cutover — see docs/migration-checklist.md.
export default defineConfig({
  site: 'https://mcgill-nus.pages.dev',
  output: 'static',
});
