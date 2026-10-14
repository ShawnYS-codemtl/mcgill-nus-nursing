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
  image: {
    // Editors upload photos straight off a phone, often 4000px wide. Every
    // image, covers and images inside a post alike, scales down to fit the
    // column it sits in and never stretches past its own size. Astro adds
    // the rule (max-width: 100%) in a low-priority CSS layer, so the real
    // design can still override it.
    layout: 'constrained',
    responsiveStyles: true,
    // The widths Astro generates for each image. The text column is 42rem
    // (about 672px, set in src/layouts/Base.astro), so 1344px covers it on a
    // high-density phone screen. Astro's default list runs to 6016px and
    // would encode a dozen sizes of every photo, slowing every build for
    // sizes nobody downloads. Revisit if the design adds a full-width image.
    //
    // One known limit: an image inside a post's text can't be told the
    // column width, so Astro also keeps one copy at the original size. Phones
    // still pick a 1344px-or-smaller copy; a large high-density desktop
    // screen may fetch the original. Covers don't have this problem: their
    // sizes are set in src/pages/news/[slug].astro.
    breakpoints: [640, 828, 1080, 1344],
  },
});
