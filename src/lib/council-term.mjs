// Plain JavaScript, like src/lib/image-alt.mjs, so tests/council-term.test.mjs
// can import it without a build.

/**
 * The term to show, given Site settings' current term and the terms that have
 * published council entries. `fallback` is true when that isn't the current
 * term. Undefined only when no term has entries at all.
 * @param {string | undefined} currentTerm
 * @param {Iterable<string>} termsWithEntries
 * @returns {{ term: string, fallback: boolean } | undefined}
 */
export function pickTerm(currentTerm, termsWithEntries) {
  const terms = [...new Set(termsWithEntries)];
  if (currentTerm && terms.includes(currentTerm)) return { term: currentTerm, fallback: false };
  const newest = terms.sort().at(-1);
  return newest ? { term: newest, fallback: true } : undefined;
}

/**
 * "2025-2026" → "2025–26", for headings. Anything else is returned as it is.
 * @param {string} term
 */
export function formatTerm(term) {
  const match = term.match(/^(\d{4})-\d{2}(\d{2})$/);
  return match ? `${match[1]}–${match[2]}` : term;
}
