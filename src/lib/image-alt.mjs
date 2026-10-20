// Images pasted into a post's text through Pages CMS get their *filename* as
// alt text ("image.png", "IMG_5310.jpeg"), and the editor gives council
// members no way to change it. A screen reader would read "image dot png"
// aloud. Found 2026-10-20; the CMS sets `alt: file.name` in its rich-text
// editor.
//
// So an image whose description is only a filename is treated as decoration:
// its alt text is emptied, which tells screen readers to skip it. The build
// log names the post so someone can follow up. Photos that carry meaning
// belong in a post's Cover image, whose form requires a real description.
//
// Plain JavaScript (not TypeScript) because astro.config.mjs imports it too.

const IMAGE_FILENAME = /\.(png|jpe?g|gif|webp|avif|heic|heif|svg|bmp|tiff?)$/i;

/**
 * True when an image's alt text is really just a filename.
 * @param {string} alt
 */
export function isFilenameAlt(alt) {
  return IMAGE_FILENAME.test(alt.trim());
}

/**
 * The alt texts of images in raw Markdown that are only filenames, for the
 * build-log warning in src/lib/content.ts.
 * @param {string} markdown
 * @returns {string[]}
 */
export function filenameAltImages(markdown) {
  return [...markdown.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)]
    .map(([, alt]) => alt ?? '')
    .filter(isFilenameAlt);
}

/**
 * Markdown plugin for Astro's built-in processor (satteri). Astro runs it
 * before its own image handling, so the emptied alt is what gets rendered.
 */
const decorativeFilenameAlts = {
  name: 'decorative-filename-alts',
  element: {
    filter: ['img'],
    /**
     * @param {{ properties?: Record<string, unknown> }} node
     * @param {{ setProperty: (node: unknown, key: string, value: unknown) => void }} ctx
     */
    visit(node, ctx) {
      const alt = node.properties?.alt;
      if (typeof alt === 'string' && isFilenameAlt(alt)) ctx.setProperty(node, 'alt', '');
    },
  },
};

/**
 * Adds the plugin to Astro's own Markdown processor rather than replacing the
 * processor, so no extra package is needed and Astro upgrades carry it along.
 * Fails loudly if a future Astro changes processor, because the alternative is
 * the accessibility fix silently disappearing (tests/build.test.mjs would
 * catch that too).
 * @returns {import('astro').AstroIntegration}
 */
export function decorativeFilenameAltsIntegration() {
  return {
    name: 'nus:decorative-filename-alts',
    hooks: {
      'astro:config:setup'({ config }) {
        const processor = /** @type {{ name?: string, options?: { hastPlugins?: unknown[] } }} */ (
          config.markdown.processor
        );
        if (processor?.name !== 'satteri' || !Array.isArray(processor.options?.hastPlugins)) {
          throw new Error(
            'src/lib/image-alt.mjs expects Astro\'s "satteri" Markdown processor, but this Astro ' +
              `uses "${processor?.name}". Update decorativeFilenameAltsIntegration for the new processor, ` +
              'or images pasted into posts will be announced to screen readers by filename.'
          );
        }
        processor.options.hastPlugins.push(decorativeFilenameAlts);
      },
    },
  };
}
