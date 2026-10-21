// The anchor (#id) Astro gives each heading in a Markdown file, worked out
// from the file itself, without a build. tests/redirects.test.mjs uses it to
// check that a redirect to "/about/governance/#nus-meeting-minutes" still
// lands on a heading after editors have been at the page in Pages CMS.
//
// Astro makes the id by running the heading's text through github-slugger,
// with one slugger per page, so a repeated heading gets "-1", "-2" (see
// @astrojs/markdown-satteri). tests/build.test.mjs checks this file agrees with
// what Astro actually builds, so if Astro ever changes how it makes ids, that
// test fails rather than this one quietly going wrong.

import GithubSlugger from 'github-slugger';

/** A heading's Markdown as plain text: no bold, code marks, escapes or link syntax. */
const plainText = (markdown) =>
  markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\(.)/g, '$1')
    .replace(/[*`]/g, '');

/**
 * The ids of every heading in a Markdown file (frontmatter allowed), in order.
 * @param {string} markdown
 * @returns {string[]}
 */
export function headingIds(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  const slugger = new GithubSlugger();
  // "## Heading" or "## Heading ##"; a closing run of # only counts after a space.
  return [...body.matchAll(/^#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/gm)].map(([, text]) => slugger.slug(plainText(text)));
}
