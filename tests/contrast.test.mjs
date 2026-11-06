// Checks the colour tokens in src/styles/global.css against WCAG 2.1 AA, so a
// colour change that makes text unreadable fails CI instead of failing
// students. The pairs are the ones the design uses, from the contrast table on
// Figma's 02 Foundations board (node 48:47).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

/** The custom properties set in one rule block, by its exact selector. */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `global.css has no "${selector}" block`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map(([, name, hex]) => [name, hex]));
}

const SEASONS = ['fall', 'winter', 'summer'];
const palette = block(':root');
const seasons = Object.fromEntries(SEASONS.map((s) => [s, block(`:root[data-season='${s}']`)]));

/** "ink" → --color-ink; "sticky@fall" → --season-sticky in the fall block. */
function colour(token) {
  const [name, season] = token.split('@');
  const hex = season ? seasons[season][`season-${name}`] : palette[`color-${name}`];
  assert.ok(hex, `global.css doesn't define ${token}`);
  return hex;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(colour(a)), luminance(colour(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [text, background, where]. All at 4.5:1, even the sticky's 28px aside,
// which as large text would need only 3.
const TEXT = [
  ['ink', 'card', 'body text and headings'],
  ['ink-muted', 'card', 'dates, author role, small print'],
  ['pen', 'card', 'links on cards'],
  ['card', 'oxblood', 'News tab label, text on the News sheet'],
  ['ink', 'mustard', 'About tab label, text on the About sheet'],
  ['card', 'forest', 'Get involved tab label'],
  ['card', 'slate', 'Resources tab label'],
  ['card', 'mat', 'footer text and links on the mat'],
  ...SEASONS.map((s) => ['pen', `sticky@${s}`, `the sticky's aside in ${s}`]),
];

// Never used, because they fail. Recorded here, not asserted:
//   card on mustard, 2.58: white text on the About tab. Mustard takes ink.
//   pen on mustard, about 4.3: links on the About sheet are ink, underlined.
//   oxblood 1.87, forest 2.03, slate 2.15 on mat: the tab shapes against the
//     mat, below 3:1 for non-text. The label carries the meaning, and the
//     current tab is taller, underlined and aria-current, not just coloured.

// Every surface a focused control can sit on.
const SURFACES = ['card', 'mat', 'oxblood', 'mustard', 'forest', 'slate', 'window', ...SEASONS.map((s) => `sticky@${s}`)];

for (const [fg, bg, where] of TEXT) {
  test(`${fg} on ${bg} is readable (${where})`, () => {
    const r = ratio(fg, bg);
    assert.ok(r >= 4.5, `${fg} on ${bg} is ${r.toFixed(2)}:1, below 4.5:1`);
  });
}

// The ring is ink inside white (global.css, :focus-visible). On any surface,
// one of the two must stand out from it at 3:1 (WCAG 1.4.11).
for (const bg of SURFACES) {
  test(`the focus ring shows on ${bg}`, () => {
    const r = Math.max(ratio('ink', bg), ratio('card', bg));
    assert.ok(r >= 3, `the focus ring on ${bg} is ${r.toFixed(2)}:1, below 3:1`);
  });
}

test('the focus ring’s two colours stand apart (WCAG technique C40 asks 9:1)', () => {
  assert.ok(ratio('ink', 'card') >= 9);
});
