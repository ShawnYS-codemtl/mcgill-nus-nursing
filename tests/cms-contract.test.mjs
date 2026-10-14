// Checks that the two halves of the content contract still agree:
//   .pages.yml             — the forms council editors fill in (Pages CMS)
//   src/content.config.ts  — what the build accepts
//
// Drift between them never fails a build on its own. It fails later, and
// silently: a field editors fill in that the site ignores, a field the site
// needs that editors can't see (and that Pages CMS strips from the file on the
// next save), or a schema stricter than the form, which makes an exec's save
// fail to build with no message they can see. See docs/content-schema.md.
//
// The build side is read from the JSON Schemas Astro generates into
// .astro/collections/ on every `astro sync`, so this needs no Astro internals.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { before, test } from 'node:test';
import { parse } from 'yaml';

/** CMS entries that are deliberately not content collections. */
const NOT_A_COLLECTION = ['settings'];

/** Fields the build adds itself, so editors never see them. */
const BUILD_DERIVED = { gallery: ['order'] };

/** The informational pages that must always exist (CLAUDE.md decision 12a). */
const FIXED_PAGES = ['about', 'fees', 'governance', 'ison', 'elections', 'contact'];

let cms;
let entries;
const schemas = {};

before(() => {
  const sync = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'sync'], { encoding: 'utf8' });
  assert.equal(sync.status, 0, `astro sync failed:\n${sync.stdout}\n${sync.stderr}`);

  for (const file of readdirSync('.astro/collections')) {
    const json = JSON.parse(readFileSync(path.join('.astro/collections', file), 'utf8'));
    // A file() collection's schema is "an array of these, or a map of these".
    const shape = json.anyOf ? json.anyOf[0].items : json;
    schemas[file.replace('.schema.json', '')] = {
      properties: Object.fromEntries(Object.entries(shape.properties).filter(([key]) => key !== '$schema')),
      required: shape.required ?? [],
    };
  }

  cms = parse(readFileSync('.pages.yml', 'utf8'));
  entries = cms.content;
});

/** CMS fields that map to data (the Markdown body is content, not a field). */
const dataFields = (entry) => entry.fields.filter((field) => field.name !== 'body');
const derived = (name) => BUILD_DERIVED[name] ?? [];

test('every CMS entry has a matching content collection, and every collection is editable', () => {
  const cmsNames = entries.map((entry) => entry.name);

  for (const name of cmsNames) {
    if (NOT_A_COLLECTION.includes(name)) continue;
    assert.ok(
      schemas[name],
      `.pages.yml has an entry "${name}" but src/content.config.ts has no collection by that name. ` +
        `Add the collection, or add "${name}" to NOT_A_COLLECTION in this test if that's deliberate.`
    );
  }
  for (const name of Object.keys(schemas)) {
    assert.ok(cmsNames.includes(name), `Collection "${name}" has no entry in .pages.yml, so editors can't reach it.`);
  }
});

test('field names match between .pages.yml and src/content.config.ts', () => {
  for (const entry of entries) {
    const schema = schemas[entry.name];
    if (!schema) continue;

    const cmsFields = dataFields(entry).map((field) => field.name);
    const schemaFields = Object.keys(schema.properties).filter((key) => !derived(entry.name).includes(key));

    for (const field of cmsFields) {
      assert.ok(
        schemaFields.includes(field),
        `${entry.name}.${field} is in .pages.yml but not in src/content.config.ts — editors would fill in a field the site ignores.`
      );
    }
    for (const field of schemaFields) {
      assert.ok(
        cmsFields.includes(field),
        `${entry.name}.${field} is in src/content.config.ts but not in .pages.yml — editors can't see it, ` +
          `and Pages CMS deletes fields it doesn't know about the next time the file is saved.`
      );
    }
  }
});

test('the build never requires a field the CMS form lets editors leave blank', () => {
  for (const entry of entries) {
    const schema = schemas[entry.name];
    if (!schema) continue;

    for (const field of schema.required.filter((key) => !derived(entry.name).includes(key))) {
      const cmsField = entry.fields.find((candidate) => candidate.name === field);
      assert.equal(
        cmsField?.required,
        true,
        `${entry.name}.${field} is required by src/content.config.ts but optional in .pages.yml. ` +
          `An editor can save without it and their change will silently fail to build. ` +
          `Mark it required: true in .pages.yml, or make it optional (or give it a default) in the schema.`
      );
    }
  }
});

test('select options in the CMS match the values the build accepts', () => {
  for (const entry of entries) {
    const schema = schemas[entry.name];
    if (!schema) continue;

    for (const [name, property] of Object.entries(schema.properties)) {
      const cmsField = entry.fields.find((field) => field.name === name);
      if (!property.enum && cmsField?.type !== 'select') continue;

      assert.equal(cmsField?.type, 'select', `${entry.name}.${name} has fixed values in the schema, so it should be a select in .pages.yml.`);
      assert.deepEqual(
        [...cmsField.options.values].sort(),
        [...(property.enum ?? [])].sort(),
        `${entry.name}.${name}: the CMS offers different choices from the ones the build accepts.`
      );
    }
  }
});

test('optional date fields start empty instead of filling in today', () => {
  // Pages CMS gives every date field today's date on a new entry unless the
  // field sets its own default. Found in the Pages CMS trial (2026-10-14): a
  // new post arrived "pinned until today" without anyone choosing that.
  for (const entry of entries) {
    for (const field of entry.fields.filter((candidate) => candidate.type === 'date' && !candidate.required)) {
      assert.equal(
        field.default,
        '',
        `${entry.name}.${field.name} is an optional date without default: "" — Pages CMS will fill it with today's date on every new entry.`
      );
    }
  }
});

test('uploaded image paths stay relative, and every file that can hold an image sits two folders below src/', () => {
  // MAINTENANCE.md Landmine 4. A "/" path, or a file at another depth, gives
  // broken images with no build error.
  assert.equal(cms.media.input, 'src/assets/uploads');
  assert.equal(cms.media.output, '../../assets/uploads', 'media.output must stay relative — see MAINTENANCE.md Landmine 4');

  for (const entry of entries) {
    const holdsImages = entry.fields.some((field) => field.type === 'image' || field.type === 'rich-text');
    if (!holdsImages) continue;

    const folder = entry.type === 'collection' ? entry.path : path.posix.dirname(entry.path);
    assert.match(
      folder,
      /^src\/content\/[^/]+$/,
      `"${entry.name}" stores files in ${folder}, but "../../assets/uploads" only resolves from src/content/<folder>/.`
    );
  }
});

test('the six informational pages can be edited but never added, renamed or deleted', () => {
  const pages = entries.find((entry) => entry.name === 'pages');
  assert.deepEqual(
    pages.operations,
    { create: false, rename: false, delete: false },
    'CLAUDE.md decision 12a: editors change what a page says, never which pages exist.'
  );
  for (const page of FIXED_PAGES) {
    assert.ok(existsSync(`src/content/pages/${page}.md`), `src/content/pages/${page}.md is missing — editors can't recreate it.`);
  }
});

test('entry filenames are permanent keys, so the CMS cannot rename them', () => {
  for (const entry of entries.filter((candidate) => candidate.type === 'collection')) {
    assert.equal(entry.operations?.rename, false, `"${entry.name}" must set operations.rename: false (CLAUDE.md decision 5a).`);
  }
});

test('site settings are valid, and every key in the file is editable', () => {
  const settingsEntry = entries.find((entry) => entry.name === 'settings');
  const settings = JSON.parse(readFileSync(settingsEntry.path, 'utf8'));
  const cmsKeys = settingsEntry.fields.map((field) => field.name);

  assert.match(settings.currentTerm, /^\d{4}-\d{4}$/, 'currentTerm must look like 2026-2027');
  for (const key of Object.keys(settings)) {
    assert.ok(
      cmsKeys.includes(key),
      `settings.json has "${key}" but .pages.yml doesn't — Pages CMS would delete it on the next save.`
    );
  }
});
