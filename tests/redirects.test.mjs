// Checks public/_redirects: the 301s that send old Wix addresses to their
// place on this site (docs/information-architecture.md → Redirect map).
//
// Both ways a redirect breaks are silent. Cloudflare Pages skips a line it
// can't read without any error, and a redirect to a page that doesn't exist
// just lands the visitor on the 404 page. Either way the old link in an
// Instagram bio or a McGill page stops working, and nobody hears about it.
//
// The last four tests are the ones content can break. A committee's or a
// post's web address is editable in Pages CMS, so renaming one, hiding it, or
// giving it an external link quietly orphans the redirect that points at it.
// Hiding or deleting a resource does the same to its /resources/#anchor. And
// every heading on the six informational pages is editable, and a heading is
// what a "#anchor" redirect lands on. CI runs on every CMS commit, so the red X on
// main is the warning.
//
// Cloudflare's rules: https://developers.cloudflare.com/pages/configuration/redirects/

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { parse } from 'yaml';
import { headingIds } from './lib/headings.mjs';

const FILE = 'public/_redirects';

/** The six informational pages, by address (src/config/routes.ts → their content file). */
const INFO_PAGES = {
  '/about/': 'about',
  '/about/fees/': 'fees',
  '/about/governance/': 'governance',
  '/about/ison/': 'ison',
  '/about/elections/': 'elections',
  '/contact/': 'contact',
};

/** Every rule in the file, skipping blank lines and # comments. */
const rules = readFileSync(FILE, 'utf8')
  .split('\n')
  .map((text, index) => ({ text: text.trim(), line: index + 1 }))
  .filter(({ text }) => text && !text.startsWith('#'))
  .map(({ text, line }) => {
    const [source, destination, code, ...extra] = text.split(/\s+/);
    return { source, destination, code, extra, line, text, where: `${FILE} line ${line}` };
  });

/** Frontmatter of every entry in a content collection. */
function entries(collection) {
  const dir = path.join('src/content', collection);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ file, data: parse(readFileSync(path.join(dir, file), 'utf8').match(/^---\n([\s\S]*?)---/)[1]) }));
}

/** Does a rule's old address (which may end in a * wildcard) match this path? */
const matches = (source, pathname) =>
  source.endsWith('*') ? pathname.startsWith(source.slice(0, -1)) : source.replace(/\/$/, '') === pathname.replace(/\/$/, '');

test('every line is "old-address new-address 301"', () => {
  assert.ok(rules.length > 0, `${FILE} has no rules`);
  for (const rule of rules) {
    assert.ok(rule.destination && rule.extra.length === 0, `${rule.where} should be "old-address new-address 301": ${rule.text}`);
    assert.equal(
      rule.code,
      '301',
      `${rule.where} must end in 301. Without it Cloudflare sends a temporary 302, and search engines keep the old address: ${rule.text}`
    );
  }
});

test('every old address starts with / and is redirected only once', () => {
  const seen = new Map();
  for (const rule of rules) {
    assert.ok(rule.source.startsWith('/'), `${rule.where}: the old address must start with "/": ${rule.text}`);
    assert.ok(
      !seen.has(rule.source),
      `${rule.source} is redirected twice (lines ${seen.get(rule.source)} and ${rule.line}). Cloudflare only uses the first.`
    );
    seen.set(rule.source, rule.line);
  }
});

test('no redirect points back at itself or at another old address', () => {
  for (const rule of rules) {
    const target = rule.destination.split('#')[0];
    if (/^https?:\/\//.test(target)) continue;
    assert.ok(
      !matches(rule.source, target),
      `${rule.where} sends ${rule.source} to itself, which loops. Cloudflare adds a trailing slash on its own, so a rule like "/about /about/" isn't needed.`
    );
    const next = rules.find((other) => matches(other.source, target));
    assert.ok(
      !next,
      `${rule.where} sends visitors to ${target}, which line ${next?.line} redirects again. Point it at the final address.`
    );
  }
});

test('every /involved/<slug>/ target is a committee with its own page', () => {
  const committees = entries('committees');
  for (const rule of rules) {
    const slug = rule.destination.match(/^\/involved\/([^/#]+)/)?.[1];
    if (!slug) continue;
    const committee = committees.find(({ data }) => data.slug === slug);
    assert.ok(
      committee,
      `${rule.where} points at /involved/${slug}/, but no committee has the web address "${slug}". ` +
        `Change the redirect, or the committee's Web address in Pages CMS.`
    );
    assert.ok(
      !committee.data.externalLink,
      `${rule.where} points at /involved/${slug}/, but ${committee.file} links somewhere else instead, so it has no page.`
    );
    assert.notEqual(committee.data.published, false, `${rule.where} points at /involved/${slug}/, but ${committee.file} isn't shown on the site.`);
  }
});

test('every /news/<slug>/ target is a published post with its own page', () => {
  const posts = entries('posts');
  for (const rule of rules) {
    const slug = rule.destination.match(/^\/news\/([^/#]+)/)?.[1];
    if (!slug) continue;
    const post = posts.find(({ data }) => data.slug === slug);
    assert.ok(
      post,
      `${rule.where} points at /news/${slug}/, but no post has the web address "${slug}". ` +
        `Change the redirect, or the post's Web address in Pages CMS.`
    );
    assert.ok(!post.data.externalLink, `${rule.where} points at /news/${slug}/, but ${post.file} links somewhere else instead, so it has no page.`);
    assert.equal(post.data.published, true, `${rule.where} points at /news/${slug}/, but ${post.file} isn't published.`);
  }
});

test('every /resources/#anchor is a published resource', () => {
  // A resource's heading id is its filename, which the CMS can't rename, so
  // only hiding or deleting the resource breaks one of these.
  for (const rule of rules) {
    const [target, anchor] = rule.destination.split('#');
    if (target !== '/resources/' || !anchor) continue;

    const file = `src/content/resources/${anchor}.yml`;
    assert.ok(
      existsSync(file),
      `${rule.where} sends visitors to ${rule.destination}, but there is no ${file}. ` +
        `The anchor must be a resource's filename (without .yml).`
    );
    assert.notEqual(parse(readFileSync(file, 'utf8')).published, false, `${rule.where} points at ${file}, which isn't shown on the site.`);
  }
});

test('every #anchor on an informational page matches one of its headings', () => {
  // /nus-council-meetings lands on the "NUS Meeting Minutes" heading of the
  // Governance page. Renaming that heading in Pages CMS changes its anchor,
  // and visitors land at the top of the page instead, with no error anywhere.
  for (const rule of rules) {
    const [target, anchor] = rule.destination.split('#');
    const page = INFO_PAGES[target];
    if (!anchor || !page) continue;

    const file = `src/content/pages/${page}.md`;
    const ids = headingIds(readFileSync(file, 'utf8'));
    assert.ok(
      ids.includes(anchor),
      `${rule.where} sends visitors to ${rule.destination}, but no heading in ${file} makes the anchor "#${anchor}" ` +
        `(its headings make ${ids.map((id) => `#${id}`).join(', ') || 'none'}). A heading was probably renamed in ` +
        `Pages CMS. Point the redirect at the new anchor, or ask the editor to change the heading back.`
    );
  }
});
