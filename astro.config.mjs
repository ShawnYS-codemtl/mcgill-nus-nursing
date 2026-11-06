// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { decorativeFilenameAltsIntegration } from './src/lib/image-alt.mjs';

// Content lives in src/content/ (schemas in src/content.config.ts); images go
// through Astro's built-in pipeline. The only integration is a small
// accessibility fix (src/lib/image-alt.mjs). Styling is plain CSS:
// src/styles/global.css, plus scoped <style> blocks in components.
//
// `site` is the Cloudflare Pages preview subdomain. It becomes
// https://mcgillnus.ca at DNS cutover — see docs/migration-checklist.md.
export default defineConfig({
  site: 'https://mcgill-nus.pages.dev',
  output: 'static',
  // Images pasted into a post's text arrive with their filename as alt text;
  // this treats them as decoration instead. See src/lib/image-alt.mjs.
  integrations: [decorativeFilenameAltsIntegration()],
  // Both fonts are committed woff2 files (src/assets/fonts/, with their OFL
  // licences), so the build fetches nothing (CLAUDE.md §4). Each is Google
  // Fonts' latin subset. Bricolage keeps its weight and optical-size axes:
  // titles use the display cut, and font-optical-sizing: auto picks it by
  // size, which is how the Figma screens break their lines. Astro writes the
  // @font-face rules and size-matched fallbacks; <Font> in Base.astro.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-body',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/BricolageGrotesque-latin.woff2'], weight: '200 800', style: 'normal' }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Gochi Hand',
      cssVariable: '--font-hand',
      fallbacks: ['cursive'],
      options: {
        variants: [{ src: ['./src/assets/fonts/GochiHand-latin.woff2'], weight: 400, style: 'normal' }],
      },
    },
  ],
  image: {
    // Editors upload photos straight off a phone, often 4000px wide. Every
    // image, covers and images inside a post alike, scales down to fit the
    // column it sits in and never stretches past its own size. Astro adds
    // the rule (max-width: 100%) in a low-priority CSS layer, so the real
    // design can still override it.
    layout: 'constrained',
    responsiveStyles: true,
    // The widths Astro generates for each image. The text column is 42rem
    // (about 672px, set in src/styles/global.css), so 1344px covers it on a
    // high-density phone screen. Astro's default list runs to 6016px and
    // would encode a dozen sizes of every photo, slowing every build for
    // sizes nobody downloads. Revisit if the design adds a full-width image.
    //
    // One known limit: an image inside a post's text can't be told the
    // column width, so Astro also keeps one copy at the original size. Phones
    // still pick a 1344px-or-smaller copy; a large high-density desktop
    // screen may fetch the original. Covers and homepage photos don't have
    // this problem: their sizes are set in src/pages/news/[slug].astro and
    // src/pages/index.astro.
    breakpoints: [640, 828, 1080, 1344],
  },
});
