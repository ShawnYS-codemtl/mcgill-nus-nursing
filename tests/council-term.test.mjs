import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatTerm, pickTerm } from '../src/lib/council-term.mjs';

test('the current term is shown when it has entries', () => {
  assert.deepEqual(pickTerm('2025-2026', ['2024-2025', '2025-2026', '2025-2026']), { term: '2025-2026', fallback: false });
});

test('a current term with no entries falls back to the newest term that has some', () => {
  assert.deepEqual(pickTerm('2026-2027', ['2025-2026', '2023-2024', '2024-2025']), { term: '2025-2026', fallback: true });
});

test('a blank current term falls back to the newest term too', () => {
  assert.deepEqual(pickTerm(undefined, ['2024-2025', '2025-2026']), { term: '2025-2026', fallback: true });
});

test('no entries at all means nothing to show', () => {
  assert.equal(pickTerm('2025-2026', []), undefined);
});

test('a term is written the short way in headings, and anything unexpected is left alone', () => {
  assert.equal(formatTerm('2025-2026'), '2025–26');
  assert.equal(formatTerm('Fall 2025'), 'Fall 2025');
});
