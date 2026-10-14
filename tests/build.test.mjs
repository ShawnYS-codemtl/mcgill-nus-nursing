// Builds the real site against tests/fixtures/content (content written to be
// awkward on purpose) and checks the HTML that comes out. This is the test that
// catches a change to src/lib/content.ts or a route that quietly lets a draft,
// a bad link or an unprocessed image through, none of which fail a build.
//
// Each fixture is one case; the file names in tests/fixtures/content/posts/
// say which. To cover a new rule, add a fixture and a test here.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

const outDir = mkdtempSync(path.join(tmpdir(), 'nus-fixture-build-'));
let log = '';

const read = (route) => readFileSync(path.join(outDir, route, 'index.html'), 'utf8');
const pageExists = (route) => existsSync(path.join(outDir, route, 'index.html'));

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

test('a pinned post is listed first, ahead of newer posts', () => {
  const links = [...read('').matchAll(/<li>\s*<a href="([^"]+)"/g)].map(([, href]) => href);
  assert.equal(links[0], '/news/pinned-bad-link/', `list order was: ${links.join(', ')}`);
});
