/**
 * The Land Acknowledgement and the Commitment to Truth & Reconciliation.
 *
 * VERBATIM TEXTS. Do not edit, paraphrase, reflow, re-punctuate or "improve"
 * them, and never expose them in .pages.yml or move them into src/content/.
 * That is CLAUDE.md decision 13 (and PRODUCT.md → Brand Commitments): every
 * other text on the site is editable by the council; these two are kept out of
 * the CMS precisely so that nobody gets an edit button on them.
 *
 * Copied character for character from the homepage of the old Wix site
 * (https://nusnursing.wixsite.com/website) on 2026-10-21. The only thing left
 * out is a non-breaking space after the Land Acknowledgement's final full stop,
 * which was page layout rather than text. The two apostrophes differ on
 * purpose, because they differ on the original: "Kanien’keha:ka" has a curly
 * one (U+2019) and "Joyce's" a straight one (U+0027).
 *
 * The headings were typed in capitals on Wix ("LAND ACKNOWLEDGEMENT",
 * "COMMITMENT TO TRUTH & RECONCILIATION"). They are in title case here so the
 * design can set them however it likes; the words are unchanged.
 *
 * Both appear in full at the end of the homepage (src/pages/index.astro), and
 * tests/build.test.mjs fails if either stops appearing there word for word.
 */

export const LAND_ACKNOWLEDGEMENT = {
  heading: 'Land Acknowledgement',
  text: "We respectfully acknowledge that McGill University resides on unceded Indigenous territory, a space historically serving as a meeting ground for many peoples, including the Haudenosaunee and Anishinaabeg, of which the Kanien’keha:ka Nation are recognized as the traditional custodians.",
} as const;

export const TRUTH_AND_RECONCILIATION = {
  heading: 'Commitment to Truth & Reconciliation',
  text: "Embracing the principles of truth and reconciliation, we strive to confront historical injustices. In alignment with Joyce's Principle, we recognize the urgent need to address systemic inequalities in healthcare and health outcomes for Indigenous peoples. As we gather on this land, we are committed to fostering understanding, acknowledging past wrongs, and actively working towards a more just and equitable future.",
} as const;
