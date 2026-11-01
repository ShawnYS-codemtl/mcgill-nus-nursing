// Its own file because settings.ts needs these too, and content.ts imports
// settings.ts, so settings.ts can't import them from there.

/** Only http(s). A `javascript:` link typed into the CMS would otherwise become a live script. */
export const isWebLink = (value: string | undefined): value is string =>
  !!value && /^https?:\/\//i.test(value);

/** The bare address, with any `mailto:` an editor pasted taken off, or undefined if it isn't one. */
export function emailAddress(value: string): string | undefined {
  const address = value.trim().replace(/^mailto:/i, '');
  return /^[^\s@:/]+@[^\s@:/]+\.[^\s@:/]+$/.test(address) ? address : undefined;
}
