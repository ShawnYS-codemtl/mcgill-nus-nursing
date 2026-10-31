import { readFileSync } from 'node:fs';

export interface Settings {
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

const DEFAULTS: Record<Defaulted, string> = {
  contactEmail: 'nus.nursing@mail.mcgill.ca',
  officeAddress: '680 Rue Sherbrooke Ouest, Suite 1923\nMontreal, QC H3A 0B8',
  officeHours: 'Office hours may vary.',
  instagramUrl: 'https://www.instagram.com/mcgillnus/',
  tiktokUrl: 'https://www.tiktok.com/@mcgillnus',
  facebookUrl: 'https://www.facebook.com/McGillNUS',
  linkedinUrl: 'https://www.linkedin.com/company/mcgillnus',
};

const CONTENT_DIR = process.env.CONTENT_DIR ?? 'src/content';
const FILE = `${CONTENT_DIR}/settings.json`;

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

  const settings: Settings = { ...DEFAULTS };
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

// shortcut: read once per process, and Astro doesn't watch this file, so
// `npm run dev` shows a settings.json edit only after a restart. Builds start
// fresh each time. Make Site settings a content collection if that bites.
let settings: Settings | undefined;

export function getSettings(): Settings {
  settings ??= loadSettings();
  return settings;
}
