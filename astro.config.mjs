// @ts-check
import { defineConfig } from 'astro/config';

// Phase 0 deliberately ships no integrations, no styling and no image pipeline.
// It exists to validate one thing: that a council exec can publish from Notion
// unaided. See CLAUDE.md §12.
//
// `site` is the Cloudflare Pages preview subdomain. It becomes
// https://mcgillnus.ca at DNS cutover — see docs/migration-checklist.md.
export default defineConfig({
  site: 'https://mcgill-nus.pages.dev',
  output: 'static',
});
