import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seasonOf, termLabel } from '../src/lib/season.mjs';

// Local time, as a visitor's browser reads it. Months are 0-based.
const day = (year, month, date) => new Date(year, month - 1, date);

test('the season turns over at the start of May, September and January', () => {
  assert.equal(seasonOf(day(2027, 4, 30)), 'winter');
  assert.equal(seasonOf(day(2027, 5, 1)), 'summer');
  assert.equal(seasonOf(day(2027, 8, 31)), 'summer');
  assert.equal(seasonOf(day(2027, 9, 1)), 'fall');
  assert.equal(seasonOf(day(2026, 12, 31)), 'fall');
  assert.equal(seasonOf(day(2027, 1, 1)), 'winter');
});

test('fall and winter name the school year; summer names the calendar year', () => {
  assert.equal(termLabel(day(2026, 9, 1)), 'Fall term · 2026–27');
  assert.equal(termLabel(day(2026, 12, 31)), 'Fall term · 2026–27');
  assert.equal(termLabel(day(2027, 1, 1)), 'Winter term · 2026–27');
  assert.equal(termLabel(day(2027, 4, 30)), 'Winter term · 2026–27');
  assert.equal(termLabel(day(2027, 5, 1)), 'Summer · 2027');
  assert.equal(termLabel(day(2027, 8, 31)), 'Summer · 2027');
});

test('the school year wraps at the century', () => {
  assert.equal(termLabel(day(2099, 9, 1)), 'Fall term · 2099–00');
  assert.equal(termLabel(day(2100, 1, 1)), 'Winter term · 2099–00');
  assert.equal(termLabel(day(2109, 10, 1)), 'Fall term · 2109–10');
});

test('seasonOf has no outside references, so its source can be inlined in the page', () => {
  const inlined = new Function(`return ${seasonOf.toString()}`)();
  assert.equal(inlined(day(2027, 2, 1)), 'winter');
});

test('termLabel needs nothing but seasonOf, so the header can inline the two together', () => {
  // As src/components/Header.astro pastes them into the page.
  const inlined = new Function(`${seasonOf}${termLabel}return termLabel;`)();
  assert.equal(inlined(day(2027, 1, 15)), 'Winter term · 2026–27');
});
