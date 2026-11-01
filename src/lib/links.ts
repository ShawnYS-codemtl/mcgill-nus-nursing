/**
 * What counts as a usable link or email address, for anything an editor types
 * into the CMS: content (./content.ts) and Site settings (./settings.ts).
 */

/** Only http(s). A `javascript:` link typed into the CMS would otherwise become a live script. */
export const isWebLink = (value: string | undefined): value is string =>
  !!value && /^https?:\/\//i.test(value);

/** The bare address, with any `mailto:` an editor pasted taken off, or undefined if it isn't one. */
export function emailAddress(value: string): string | undefined {
  const address = value.trim().replace(/^mailto:/i, '');
  return /^[^\s@:/]+@[^\s@:/]+\.[^\s@:/]+$/.test(address) ? address : undefined;
}
