import { readFileSync } from 'node:fs';

/**
 * Site settings: facts about the club that appear site-wide, edited in Pages
 * CMS → Site settings (src/content/settings.json). It isn't a content
 * collection, so nothing validates it at build time. This degrades instead
 * (CLAUDE.md §7): a missing or blank value logs a warning and falls back to
 * the repo default below, and a broken file never fails the build.
 */
export interface Settings {
  /** "2025-2026". No default: src/lib/council-term.mjs decides what to show without one. */
  currentTerm?: string;
  contactEmail: string;
  officeAddress: string;
  officeHours: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
}

type Defaulted = Exclude<keyof Settings, 'currentTerm'>;

/** The values as of 2026-10-30. Update them if the club's details change for good. */
const DEFAULTS: Record<Defaulted, string> = {
  contactEmail: 'nus.nursing@mail.mcgill.ca',
  officeAddress: '680 Rue Sherbrooke Ouest, Suite 1923\nMontreal, QC H3A 0B8',
  officeHours: 'Office hours may vary.',
  instagramUrl: 'https://www.instagram.com/mcgillnus/',
  tiktokUrl: 'https://www.tiktok.com/@mcgillnus',
  facebookUrl: 'https://www.facebook.com/McGillNUS',
  linkedinUrl: 'https://www.linkedin.com/company/mcgillnus',
};

/** Same as in src/content.config.ts; tests/build.test.mjs points it at fixtures. */
const CONTENT_DIR = process.env.CONTENT_DIR ?? 'src/content';
const FILE = `${CONTENT_DIR}/settings.json`;

/** The same rule the CMS form enforces on Current council term. */
const TERM = /^\d{4}-\d{4}$/;

function warn(message: string): void {
  console.warn(`  [settings] ${message}`);
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

function loadSettings(): Settings {
  let raw: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(FILE, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) raw = parsed as Record<string, unknown>;
    else warn(`${FILE} isn't a list of settings, so every setting uses its default.`);
  } catch (error) {
    warn(`${FILE} couldn't be read (${(error as Error).message}), so every setting uses its default.`);
  }

  const settings = { ...DEFAULTS } as Settings;
  for (const key of Object.keys(DEFAULTS) as Defaulted[]) {
    const value = text(raw[key]);
    if (value) settings[key] = value;
    else warn(`${key} is blank in Site settings, so the site uses "${DEFAULTS[key]}".`);
  }

  const term = text(raw.currentTerm);
  if (term && TERM.test(term)) settings.currentTerm = term;
  else warn(`Current council term is ${term ? `"${term}", not a term like 2026-2027` : 'blank'} in Site settings.`);

  return settings;
}

let settings: Settings | undefined;

/** Memoised, so a build reads the file and logs once. */
export function getSettings(): Settings {
  settings ??= loadSettings();
  return settings;
}
