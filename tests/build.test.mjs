// Builds the real site against tests/fixtures/content (content written to be
// awkward on purpose) and checks the HTML that comes out. This is the test that
// catches a change to src/lib/content.ts or a route that quietly lets a draft,
// a bad link or an unprocessed image through, none of which fail a build.
//
// Each fixture is one case; the file names in tests/fixtures/content/posts/
// say which, and each fixture page's text says what it covers. To cover a new
// rule, add a fixture and a test here.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { parse } from 'yaml';
import { headingIds } from './lib/headings.mjs';

const outDir = mkdtempSync(path.join(tmpdir(), 'nus-fixture-build-'));
let log = '';

const read = (route) => readFileSync(path.join(outDir, route, 'index.html'), 'utf8');
const pageExists = (route) => existsSync(path.join(outDir, route, 'index.html'));
const imageTags = (html) => [...html.matchAll(/<img[^>]*>/g)].map(([tag]) => tag);

/**
 * The six informational pages: content file → the folder its page builds to
 * (CLAUDE.md decision 12a; the addresses are in src/config/routes.ts).
 */
const INFO_PAGES = {
  about: 'about',
  fees: 'about/fees',
  governance: 'about/governance',
  ison: 'about/ison',
  elections: 'about/elections',
  contact: 'contact',
};

const fixturePageFile = (name) => `tests/fixtures/content/pages/${name}.md`;
const fixturePage = (name) => parse(readFileSync(fixturePageFile(name), 'utf8').match(/^---\n([\s\S]*?)---/)[1]);
/** Each fixture page's text holds one of these, so the test can tell where it ended up. */
const marker = (name) => `${name.toUpperCase()}-BODY-MARKER`;

/** Every .html file in the build, as [relative path, contents]. */
function allHtml(dir = outDir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return allHtml(full);
    return entry.name.endsWith('.html') ? [[path.relative(outDir, full), readFileSync(full, 'utf8')]] : [];
  });
}

before(() => {
  const result = spawnSync(
    process.execPath,
    ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir],
    { env: { ...process.env, CONTENT_DIR: 'tests/fixtures/content' }, encoding: 'utf8' }
  );
  log = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, `The fixture build failed. Its output:\n${log}`);
});

after(() => rmSync(outDir, { recursive: true, force: true }));

test('drafts never appear anywhere on the site', () => {
  assert.equal(pageExists('news/draft'), false, 'a draft post got its own page');
  for (const [file, html] of allHtml()) {
    assert.ok(!html.includes('Fixture: draft post'), `draft title found in ${file}`);
    assert.ok(!html.includes('DRAFT-BODY-MARKER'), `draft body found in ${file}`);
  }
});

test('a post with an external link gets no page and the list links straight out', () => {
  assert.equal(pageExists('news/external'), false);
  assert.match(read(''), /href="https:\/\/www\.instagram\.com\/mcgillnus\/"/);
});

test('javascript: links never reach the HTML', () => {
  for (const [file, html] of allHtml()) {
    assert.ok(!/javascript:/i.test(html), `"javascript:" found in ${file}`);
  }
  assert.ok(pageExists('news/pinned-bad-link'), 'the post itself should still publish');
});

test('two posts with the same web address: the newer one wins and the build says so', () => {
  assert.ok(read('news/published').includes('Fixture: published post'));
  for (const [file, html] of allHtml()) {
    assert.ok(!html.includes('DUPLICATE-BODY-MARKER'), `the dropped duplicate appears in ${file}`);
  }
  assert.match(log, /left out: its web address "published" is already used by/);
});

test('a cover image without a description is left out, and the post still publishes', () => {
  assert.doesNotMatch(read('news/cover-no-alt'), /<img/);
  assert.match(log, /cover image left out because it has no description/);
});

test('every image is processed by Astro (no raw upload paths reach the HTML)', () => {
  const published = read('news/published');
  assert.match(published, /<img[^>]+alt="A fixture cover image"/, 'cover missing');
  assert.match(published, /<img[^>]+alt="A fixture body image"/, 'body image missing');

  for (const [file, html] of allHtml()) {
    for (const [, src] of html.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)) {
      assert.ok(src.startsWith('/_astro/'), `unprocessed image "${src}" in ${file} — see MAINTENANCE.md Landmine 4`);
    }
  }
});

test('every image scales down to fit its column instead of showing at full size', () => {
  // Found in the Pages CMS trial: a 2556px cover rendered 2556px wide.
  // image.layout + responsiveStyles in astro.config.mjs fix it; this keeps it fixed.
  for (const [file, html] of allHtml()) {
    const images = [...html.matchAll(/<img[^>]*>/g)].map(([tag]) => tag);
    for (const tag of images) {
      assert.match(tag, /data-astro-image="constrained"/, `an image in ${file} isn't constrained: ${tag}`);
    }
    if (images.length) {
      assert.match(html, /\[data-astro-image=constrained\]\)\{max-width:100%\}/, `${file} is missing the rule that keeps images inside the column`);
    }
  }
});

test('an image whose description is only a filename is treated as decoration, and the build says so', () => {
  // Pages CMS gives images pasted into post text their filename as alt text and
  // offers no way to change it (found 2026-10-20). src/lib/image-alt.mjs empties
  // it so screen readers skip the image instead of reading "IMG_5310.jpeg".
  const published = read('news/published');
  const images = [...published.matchAll(/<img[^>]*>/g)].map(([tag]) => tag);

  assert.ok(!published.includes('IMG_5310.jpeg'), 'the filename reached the page as alt text');
  assert.ok(
    images.some((tag) => /\salt=""/.test(tag)),
    `expected one image with an empty alt, got:\n${images.join('\n')}`
  );
  assert.ok(
    images.some((tag) => tag.includes('alt="A fixture body image"')),
    'a real description must be left alone'
  );
  assert.match(log, /"Fixture: published post": an image in the post text has no description \(only its filename, "IMG_5310\.jpeg"\)/);
});

test('a pinned post is listed first, ahead of newer posts', () => {
  const main = read('').match(/<main[^>]*>([\s\S]*)<\/main>/)[1];
  const links = [...main.matchAll(/<li>\s*<a href="([^"]+)"/g)].map(([, href]) => href);
  assert.equal(links[0], '/news/pinned-bad-link/', `list order was: ${links.join(', ')}`);
});

test('each informational page builds at its address, with its heading as the only <h1> and its text below it', () => {
  for (const [name, route] of Object.entries(INFO_PAGES)) {
    assert.ok(pageExists(route), `/${route}/ wasn't built. Its route file in src/pages/ is missing or misnamed.`);
    const html = read(route);
    const { title, metaDescription } = fixturePage(name);

    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(([, text]) => text);
    assert.deepEqual(h1s, [title], `/${route}/ should have exactly one <h1>, the Page heading of ${name}.md`);
    assert.ok(html.includes(`<title>${title} — McGill NUS</title>`), `/${route}/ has the wrong <title>`);
    assert.ok(
      html.includes(`<meta name="description" content="${metaDescription}">`),
      `/${route}/ should use the Search engine description of ${name}.md as its meta description`
    );
    assert.ok(
      html.indexOf(marker(name)) > html.indexOf('<h1>'),
      `/${route}/ should show the text of ${name}.md below its heading`
    );
  }
});

test('no other page is built from the Pages collection', () => {
  // A seventh file in src/content/pages/ isn't a page until someone adds its
  // route (decision 12a), and each page's text appears only at its own address.
  for (const [file, html] of allHtml()) {
    assert.ok(!html.includes(marker('unrouted')), `a page file with no route was built into ${file}`);
    for (const [name, route] of Object.entries(INFO_PAGES)) {
      if (html.includes(marker(name))) {
        assert.equal(file, path.join(route, 'index.html'), `the text of ${name}.md appears in ${file}`);
      }
    }
  }
  assert.match(log, /pages\/unrouted\.md has no route, so it isn't on the site/);
});

test('an image in a page\'s text whose description is only a filename is treated as decoration, and the build says so', () => {
  const fees = read('about/fees');
  const images = imageTags(fees);
  assert.equal(images.length, 1, `expected the one pasted image on /about/fees/, got:\n${images.join('\n')}`);
  assert.match(images[0], /\salt=""/, `the filename reached the page as alt text: ${images[0]}`);
  assert.match(
    log,
    /"Fixture: Fees": an image in the page text has no description \(only its filename, "image\.png"\), so screen readers skip it/
  );
});

test('the build log flags pages last checked over a year ago, and lists the never-checked ones in one line', () => {
  assert.match(log, /"Fixture: ISoN" was last checked on 2024-09-01, over a year ago/);

  const lines = log.split('\n').filter((line) => line.includes('Pages never checked:'));
  assert.equal(lines.length, 1, `expected the never-checked summary exactly once, got:\n${lines.join('\n')}`);
  const listed = [...lines[0].matchAll(/"([^"]+)"/g)].map(([, title]) => title).sort();
  assert.deepEqual(
    listed,
    ['Fixture: About', 'Fixture: Contact', 'Fixture: Elections', 'Fixture: Fees', 'Fixture: Governance'],
    'blank, null and missing Last checked all count as never checked; a dated page and a page with no route do not'
  );
});

test('page headings become the anchors redirects point at, the way tests/redirects.test.mjs expects', () => {
  // public/_redirects sends /nus-council-meetings to /about/governance/#nus-meeting-minutes.
  const html = read('about/governance');
  assert.match(html, /<h2 id="nus-meeting-minutes">NUS Meeting Minutes<\/h2>/);

  const built = [...html.matchAll(/<h[2-6] id="([^"]*)"/g)].map(([, id]) => id);
  assert.deepEqual(
    built,
    headingIds(readFileSync(fixturePageFile('governance'), 'utf8')),
    'Astro now makes heading ids differently from tests/lib/headings.mjs, so the anchor check in ' +
      'tests/redirects.test.mjs can no longer be trusted. Update tests/lib/headings.mjs to match.'
  );
});

test('the nav and the "Page not found" page link only to pages that were built', () => {
  const built = (href) => pageExists(href.replace(/^\/|\/$/g, ''));
  const notFound = readFileSync(path.join(outDir, '404.html'), 'utf8');
  const nav = notFound.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav, 'every page should have the nav in its header');
  const suggestions = notFound.match(/<main[^>]*>([\s\S]*)<\/main>/)[1];

  for (const [where, html] of [['the nav', nav], ['the 404 page', suggestions]]) {
    const hrefs = [...html.matchAll(/<a href="([^"]+)"/g)].map(([, href]) => href);
    assert.ok(hrefs.length > 0, `${where} has no links`);
    for (const href of hrefs) assert.ok(built(href), `${where} links to ${href}, which wasn't built`);
  }
  assert.match(read('about/fees'), /<a href="\/about\/fees\/" aria-current="page">/, 'the nav should mark the current page');
});

const headings = (html, level) =>
  [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'g'))].map(([, text]) =>
    text
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .trim()
  );

const card = (html, level, heading) => {
  const match = html.match(new RegExp(`<li[^>]*>\\s*<h${level}[^>]*>(?:(?!</li>)[\\s\\S])*?${heading}[\\s\\S]*?</li>`));
  assert.ok(match, `no card headed "${heading}"`);
  return match[0];
};

test('the council page shows the current term only, Executive Council before General Council, each in order', () => {
  const html = read('about/council');
  assert.deepEqual(headings(html, 1), ['Council 2025–26'], 'the heading must name the term shown');
  assert.deepEqual(headings(html, 2), ['Executive Council', 'General Council']);
  assert.deepEqual(headings(html, 3), ['President', 'Director of Logistics', 'U3 BScN Representative', 'U0 BScN Representative']);

  for (const [file, page] of allHtml()) {
    assert.ok(!page.includes('OLD-TERM-MARKER'), `last year's council appears in ${file}`);
    assert.ok(!page.includes('UNPUBLISHED-COUNCIL-MARKER'), `a hidden council entry appears in ${file}`);
  }
  assert.doesNotMatch(log, /No council entries for/, 'the current term has entries, so there should be no fallback');
});

test('a vacant position says it is open and links to Elections', () => {
  const vacant = card(read('about/council'), 3, 'U0 BScN Representative');
  assert.match(vacant, /Position open/);
  assert.match(vacant, /Represents the U0 cohort\./, 'the role description should still show');
  assert.match(vacant, /<a href="\/about\/elections\/"[^>]*>/);
});

test('a council email that isn\'t an address is dropped and logged; a mailto: one is kept', () => {
  const html = read('about/council');
  assert.ok(!html.includes('example.com/mail'), 'the web link in an email field reached the page');
  assert.match(log, /U3 BScN Representative \(2025-2026\): "http:\/\/example\.com\/mail" ignored, because it isn't an email address/);
  assert.match(html, /<a href="mailto:logistics\.nus@mail\.mcgill\.ca"[^>]*>logistics\.nus@mail\.mcgill\.ca<\/a>/);
});

test('every council photo is held to the same 4:5 shape, with an empty alt because the name is beside it', () => {
  const html = read('about/council');
  const photos = imageTags(html);
  assert.equal(photos.length, 3, `expected three photos, got:\n${photos.join('\n')}`);
  for (const tag of photos) {
    assert.match(tag, /\salt(="")?[\s>]/, `a council photo has alt text: ${tag}`);
    assert.match(tag, /width="400" height="500"/, `a council photo isn't 4:5: ${tag}`);
    assert.match(tag, /data-astro-image-fit="cover"/, `a council photo isn't cropped to fill: ${tag}`);
  }
  assert.match(html, /aspect-ratio:4\/5/, 'the rule that holds small photos to 4:5 is missing');
});

test('resource categories come in a fixed order, and each resource heading\'s id is its filename', () => {
  const html = read('resources');
  assert.deepEqual(headings(html, 2), ['Academic', 'Financial', 'Wellbeing & Safety', 'Governance'], 'an empty category should be left out');
  const ids = [...html.matchAll(/<h3 id="([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(ids, ['fixture-handbook', 'fixture-textbooks', 'fixture-protocol-relative', 'fixture-tab-link', 'the-well-office', 'fixture-site-page']);
  for (const [file, page] of allHtml()) assert.ok(!page.includes('HIDDEN-RESOURCE-MARKER'), `a hidden resource appears in ${file}`);
});

test('a blank line in a resource description starts a new paragraph', () => {
  assert.match(read('resources'), /<p>FIRST-PARAGRAPH-MARKER<\/p>\s*<p>SECOND-PARAGRAPH-MARKER<\/p>/);
});

test('a resource link that is neither https:// nor a page on this site is dropped, and the resource still shows', () => {
  const html = read('resources');
  assert.ok(!html.includes('evil.example'), 'a link to another site reached the page');
  assert.match(log, /"Fixture: protocol-relative": link "\/\/evil\.example\/" ignored/);
  assert.match(log, /"Fixture: tab in link": link "\/\t\/evil\.example\/" ignored/);
  assert.match(log, /"Fixture: handbook": link "javascript:alert\(1\)" ignored/);
  assert.doesNotMatch(card(html, 3, 'Fixture: handbook'), /<a /);
  assert.match(html, /<a href="\/about\/governance\/"/, 'a page on this site is a valid link');
});

test('resource links each have an accessible name that starts with the words on screen and names the resource', () => {
  const links = [...read('resources').matchAll(/<a href="[^"]*" aria-label="([^"]*)">\s*([^<]*?)\s*<\/a>/g)].map(([, name, text]) => ({ name, text }));
  assert.deepEqual(
    links.map(({ text }) => text),
    ['Browse the folder', 'Learn more', 'Learn more'],
    'a blank Link text should read "Learn more"'
  );
  const names = links.map(({ name }) => name);
  assert.equal(new Set(names).size, names.length, `two links share an accessible name: ${names.join(' | ')}`);
  for (const { name, text } of links) assert.ok(name.startsWith(text), `"${name}" doesn't start with the visible "${text}"`);
});

test('the build log flags resource links last checked over a year ago, and lists the never-checked ones in one line', () => {
  assert.match(log, /"Fixture: handbook": link last checked on 2024-01-01, over a year ago/);
  const lines = log.split('\n').filter((line) => line.includes('Resources whose link was never checked:'));
  assert.equal(lines.length, 1, `expected the never-checked summary exactly once, got:\n${lines.join('\n')}`);
  const listed = [...lines[0].matchAll(/"([^"]+)"/g)].map(([, title]) => title).sort();
  assert.deepEqual(listed, ['Fixture: protocol-relative', 'Fixture: site page', 'Fixture: tab in link', 'Fixture: textbooks']);
});

test('only committees without an external link get a page, and an external card links straight out', () => {
  const built = readdirSync(path.join(outDir, 'involved'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(built, ['equity-committee', 'logo-no-alt'], 'external and hidden committees get no page');

  const index = read('involved');
  assert.match(card(index, 2, 'Fixture: external club'), /<a href="https:\/\/example\.com\/club"[^>]*>/);
  assert.match(card(index, 2, 'NUS Equity Committee'), /<a href="\/involved\/equity-committee\/"[^>]*>/);
  for (const [file, page] of allHtml()) {
    assert.ok(!page.includes('EXTERNAL-BODY-MARKER'), `an external committee's text appears in ${file}`);
    assert.ok(!page.includes('HIDDEN-COMMITTEE-MARKER'), `a hidden committee appears in ${file}`);
  }
});

test('two committees with the same web address: the lower Order wins and the build says so', () => {
  assert.ok(read('involved/equity-committee').includes('EQUITY-BODY-MARKER'));
  for (const [file, page] of allHtml()) {
    assert.ok(!page.includes('DUPLICATE-COMMITTEE-MARKER'), `the dropped duplicate appears in ${file}`);
    assert.ok(!page.includes('Fixture: duplicate equity'), `the dropped duplicate appears in ${file}`);
  }
  assert.match(log, /"Fixture: duplicate equity" was left out: its web address "equity-committee" is already used by "NUS Equity Committee"/);
});

test('a recruiting committee says so in words, on its card and its page', () => {
  assert.match(card(read('involved'), 2, 'NUS Equity Committee'), /Recruiting now/);
  assert.match(read('involved/equity-committee'), /Recruiting now/);
  assert.doesNotMatch(card(read('involved'), 2, 'Fixture: external club'), /Recruiting now/);
});

test('a committee logo without a description is left out, and the build says so', () => {
  const equity = card(read('involved'), 2, 'NUS Equity Committee');
  assert.match(equity, /<img[^>]+alt="NUS Equity Committee logo"[^>]+data-astro-image-fit="contain"/, 'a logo with a description should show, whole');
  for (const route of ['involved', 'involved/equity-committee']) {
    assert.match(read(route), /aspect-ratio:1[;}]/, `/${route}/ is missing the rule that keeps every logo square`);
  }
  assert.doesNotMatch(card(read('involved'), 2, 'Fixture: logo without a description'), /<img/);
  const images = imageTags(read('involved/logo-no-alt'));
  assert.equal(images.length, 1, `expected only the pasted picture, got:\n${images.join('\n')}`);
  assert.match(images[0], /\salt=""/);
  assert.match(log, /"Fixture: logo without a description": logo left out because it has no description/);
  assert.match(log, /"Fixture: logo without a description": an image in the committee page has no description \(only its filename, "image\.png"\)/);
});

test('a committee page shows its Instagram and email, and drops an email that isn\'t an address', () => {
  const equity = read('involved/equity-committee');
  assert.match(equity, /<a href="https:\/\/www\.instagram\.com\/equitynus\/"[^>]*>NUS Equity Committee on Instagram<\/a>/);
  assert.match(equity, /<a href="mailto:equity\.nus@mail\.mcgill\.ca"[^>]*>/);
  assert.ok(!read('involved/logo-no-alt').includes('not-an-email'));
  assert.match(log, /contact email "not-an-email" ignored, because it isn't an email address/);
  assert.match(log, /Committees with no short description, so their card shows only a name: "Fixture: logo without a description"\./);
});

test('the council, resources and Get Involved pages each have one <h1>, and no heading skips a level', () => {
  for (const route of ['about/council', 'resources', 'involved', 'involved/equity-committee', 'involved/logo-no-alt']) {
    const main = read(route).match(/<main[^>]*>([\s\S]*)<\/main>/)[1];
    const levels = [...main.matchAll(/<h([1-6])[\s>]/g)].map(([, level]) => Number(level));
    assert.equal(levels.filter((level) => level === 1).length, 1, `/${route}/ should have exactly one <h1>`);
    levels.reduce((previous, level) => {
      assert.ok(level <= previous + 1, `/${route}/ jumps from <h${previous}> to <h${level}>`);
      return level;
    });
  }
});
