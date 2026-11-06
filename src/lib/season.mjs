// Plain JavaScript, like src/lib/council-term.mjs, so tests/season.test.mjs
// can import it without a build. src/layouts/Base.astro also inlines
// seasonOf's source into the page, and src/components/Header.astro inlines
// seasonOf and termLabel together, so both must stay self-contained: no
// imports, no references to anything outside their own bodies (termLabel may
// call seasonOf, which is inlined beside it).

/**
 * The season a date falls in, by McGill's terms: January–April is winter,
 * May–August summer, September–December fall. It picks the window scene and
 * the sticky and tape colours (decision 17).
 * @param {Date} date
 * @returns {'winter' | 'summer' | 'fall'}
 */
export function seasonOf(date) {
  return /** @type {const} */ (['winter', 'summer', 'fall'])[Math.floor(date.getMonth() / 4)];
}

/**
 * The window's term label: "Fall term · 2026–27", "Winter term · 2026–27" or
 * "Summer · 2027". Fall and winter belong to the school year that starts in
 * September.
 * @param {Date} date
 */
export function termLabel(date) {
  const year = date.getFullYear();
  const schoolYear = (/** @type {number} */ start) => `${start}–${String((start + 1) % 100).padStart(2, '0')}`;
  switch (seasonOf(date)) {
    case 'fall':
      return `Fall term · ${schoolYear(year)}`;
    case 'winter':
      return `Winter term · ${schoolYear(year - 1)}`;
    default:
      return `Summer · ${year}`;
  }
}
