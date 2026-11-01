import { readFileSync } from 'node:fs';
import { emailAddress, isWebLink } from './links';

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

// Every value here lands in the footer of every page, so one that's there but
// unusable falls back to its default too: a `javascript:` link typed into Site
// settings must never become a live script on the whole site.
interface Check {
  use: (value: string) => string | undefined;
  needs: string;
}
const WEB_LINK: Check = { use: (value) => (isWebLink(value) ? value : undefined), needs: 'a web link (https://…)' };
const CHECKS: Partial<Record<Defaulted, Check>> = {
  contactEmail: { use: emailAddress, needs: 'an email address' },
  instagramUrl: WEB_LINK,
  tiktokUrl: WEB_LINK,
  facebookUrl: WEB_LINK,
  linkedinUrl: WEB_LINK,
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
    const check = CHECKS[key];
    const usable = value && check ? check.use(value) : value;
    if (usable) settings[key] = usable;
    else if (value && check) warn(`${key} is "${value}" in Site settings, which isn't ${check.needs}, so the site uses "${DEFAULTS[key]}".`);
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
