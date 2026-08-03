# MAINTENANCE

**Last reviewed:** 2026-08-03
**Maintained by:** _(role, not person — e.g. "Director of Logistics" or "NUS Webmaster")_

---

## Read this first

You've inherited the McGill NUS website. You probably didn't build it and the person who did has likely graduated. This file is written on that assumption.

**The mental model, in one paragraph.** Council members write content in **Notion**. A program called **Astro** reads Notion, turns everything into plain HTML files, and **Netlify** puts those files on the internet at `mcgillnus.ca`. That's it. There is no database, no server, and nothing running in the background. The site is a folder of files that gets rebuilt from scratch every time content changes. This is deliberate — it means there is nothing to patch, nothing to pay for, and nothing that breaks while nobody is looking.

**The most important consequence of that model:** content changes are not live instantly. Notion is not the website; Notion is where the website's ingredients are kept. Someone has to rebuild the site for a change to appear. See [Publishing takes a rebuild](#publishing-takes-a-rebuild).

**If you only read one more thing,** read [Landmines](#landmines). Those are the four ways this site actually dies.

---

## Access inventory

Fill this in and keep it accurate. Missing access is the most common reason a handover fails.

| Thing | Who owns it | Where the credentials live | What it's for |
|---|---|---|---|
| GitHub repo | _TODO_ | _TODO_ | The code |
| Notion workspace | _TODO_ | _TODO_ | All site content |
| Notion integration token | _TODO_ | Netlify env vars (`NOTION_TOKEN`) | Lets the build read Notion |
| Netlify account | _TODO_ | _TODO_ | Hosting + builds |
| Netlify deploy hook URL | — | Saved in Notion as "Publish now" | Manual rebuild trigger |
| GoDaddy (domain) | _TODO_ | _TODO_ | `mcgillnus.ca` — **renewal matters, see Landmines** |
| Google Drive (linked PDFs) | _TODO_ | _TODO_ | Minutes, textbooks, financial aid docs |

**If you don't have access to something here:** ask the current NUS President and the Director of Logistics. If nobody knows, the account recovery email is most likely `nus.nursing@mail.mcgill.ca` — try that before assuming anything is lost.

---

## Repo tour

_TODO during the build: keep this current. A stale map is worse than none._

```
CLAUDE.md              Project context — read before making structural changes
MAINTENANCE.md         This file
docs/                  Reference specs (see Documentation map, below)
src/
  pages/               Every URL on the site. File path = URL path.
  layouts/             Page shells
  components/          Reusable UI pieces
  lib/notion/          Fetches and normalises Notion data — the fragile part
  config/              Nav, UI strings, the Pages route allowlist, Settings
                       defaults, and the two verbatim Indigenous-relations
                       texts — see "Things not to change", below
  assets/notion/       Images downloaded from Notion at build time (generated)
  styles/
.cache/notion/         Committed snapshot of Notion content — see Landmines
public/                Files served as-is (favicon, robots.txt, _redirects)
astro.config.mjs       Framework config
netlify.toml           Build settings and redirects
```

**Where things live, by question:**

| "Where do I change…" | Look in |
|---|---|
| A nav label or button text | `src/config/` |
| Actual page content — including About, Fees, Elections | **Notion, not the repo** |
| Office hours, address, social links | **Notion** (Settings DB) |
| Homepage event photos | **Notion** (Gallery DB) |
| The Land Acknowledgement or T&R statement | `src/config/` — **and read decision 13 first** |
| A URL / adding a page | `src/pages/` |
| Old-URL redirects | `netlify.toml` or `public/_redirects` |
| How Notion data is read | `src/lib/notion/` |
| Colours, fonts, spacing | `src/styles/` + `tailwind.config` |

---

## Local setup

```bash
git clone <repo-url>
cd <repo>
npm install
cp .env.example .env     # then fill in NOTION_TOKEN — ask for it, never commit it
npm run dev              # http://localhost:4321
```

`npm run build` produces the real site in `dist/`. `npm run preview` serves that build locally.

You need Node — check `.nvmrc` or `package.json` for the version. If `npm install` fails with cryptic errors, a mismatched Node version is the usual cause.

---

## Runbook — the things you'll actually do

### Publishing takes a rebuild

Content published in Notion appears on the site in one of two ways:

1. **Automatically**, on the scheduled rebuild (currently every 12 hours), or
2. **Immediately**, when someone clicks the **"Publish now"** link saved in Notion, which triggers a Netlify build. Takes 1–2 minutes.

If a council member says "I published it and it's not showing up," this is almost always the answer. Point them at the Publish now link.

### The annual council rollover

The single most predictable task. Happens every spring after elections. It is a **Notion** job, not a code job.

1. In the Council database, filter to the outgoing `Term`.
2. Duplicate those rows. Set the duplicates' `Term` to the new year (e.g. `2026-2027`).
3. Update names, programs, photos, role descriptions, fun facts, emails on the new rows.
4. Tick `Vacant` on any position not yet filled — it renders a "position open" card instead of a blank person.
5. Set the outgoing rows' `Status` to `Archived`. **Do not delete them** — they become the Past Councils page.
6. Confirm the new `Term` is set as current in the site config _(TODO: document exactly where)_.
7. Trigger a rebuild and check `/en/about/council/`.

Keep the `{role}.nus@mail.mcgill.ca` email convention. Cohort reps use personal McGill addresses; SSMU roles use `@ssmu.ca`.

### Editing an informational page

**This is a Notion job, not a code job — tell the exec so and stop there.**

About, Fees, Governance, ISoN, Elections, and Contact all live in the **Pages** database. An exec edits the page body in Notion and clicks Publish now. Nothing in the repo changes.

The one thing they must not touch is the `Key` property (`page-about`, `page-fees`, …). It is how the repo finds the right content for each URL. If someone changes or clears it, that page renders a "this page is being updated" notice — the build does not fail, but the page is empty until the key is restored.

Editors cannot create new pages, and that is deliberate. See the next entry.

### Adding a new page

_TODO during the build — confirm the exact file names once `src/pages/` exists._

Three steps, all in the repo:

1. Create the route file in `src/pages/`. If it should be exec-editable, add a row to the **Pages** DB with a new `page-*` `Key`, add that key to the allowlist in `src/config/`, and have the route fetch by it — copy an existing informational page.
2. Add its label to the nav config in `src/config/`.
3. Add a redirect if it replaces an old Wix URL.

Use the link helper rather than hardcoding paths in components.

**Why execs can't do this themselves:** page routes are a fixed allowlist on purpose (`CLAUDE.md` decision 12a). If any Notion row could mint a URL, a slug typo would silently 404 an exec's work and new pages would appear in no nav and no sitemap. Editors change what a page says; the repo owns where pages live.

### Adding a photo to the homepage gallery

Also a Notion job. Add a row to the **Gallery** database with the image, an `Alt` description, and an `Order` number. `Term` lets old photos age out by filter instead of being deleted.

**Alt text is required.** A gallery row without it is skipped with a warning in the build log rather than published without alt — so if a photo an exec added isn't showing up, that's the first thing to check.

### Changing the office hours, address, or social links

These come from the **Settings** database — a simple list of `Key` / `Value` pairs. Edit the value, publish, done.

Settings is the one database that never breaks the build. If a key is missing, renamed, or blank, the site falls back to a default baked into `src/config/` and logs a warning. That is why a wrong value here can persist quietly: **nothing goes red, it just shows the old default.** Check the deploy log's content summary if a change doesn't appear.

Settings holds facts about the club, not labels. If you're tempted to add a key for button text or a nav label, that belongs in `src/config/` instead — see decision 6.

### Adding a field to a Notion database

Order matters — do it backwards and the build breaks for everyone:

1. Add the property in Notion first.
2. Update the schema definition in `src/lib/notion/`.
3. Update `docs/notion-schema.md`.
4. Update the component that renders it.
5. Update the editor's guide in Notion if execs need to know about it.

**Renaming an existing property in Notion will break the build.** The fetch layer validates against expected names and fails deliberately with a readable message. That's working as intended — rename it back, or change the code too.

### Rotating the Notion token

If the token leaks or an integration is removed: create a new internal integration in Notion, **share it with every database individually** (a token that isn't shared returns empty results, not an error — this is a confusing failure), update `NOTION_TOKEN` in Netlify's environment variables, and trigger a build.

### Updating dependencies

Do this at least once a year even if nothing is wrong. `npm outdated`, upgrade in small batches, `npm run build`, check the site locally, then push. Astro's major versions do introduce breaking changes — read the migration guide rather than upgrading blind.

### Editing this file

When you change the repo structure, add a runbook entry, or hit a problem that took you an hour to figure out — write it down here. You are the only person who will ever have that context.

---

## Landmines

Four things that will actually take the site down. Understand these before changing anything near them.

**1. The domain renewal.** `mcgillnus.ca` is registered with GoDaddy. If it lapses, the site vanishes and recovering the domain can be expensive or impossible. Make sure renewal is not tied to one student's credit card, and that the renewal notice goes to an address the council will still be reading in three years. This is the most likely way this project dies, and it has nothing to do with code.

**2. Notion image URLs expire.** Notion serves uploaded images from signed URLs that stop working after about an hour. The build **downloads every image to local files** for exactly this reason. If you ever change the image handling and pass a Notion URL straight into the HTML, the site will look perfect on the day you deploy and every image will 403 about an hour later.

There is a test for this. After a production build:

```bash
grep -r "amazonaws.com\|notion-static\|prod-files-secure" dist/
```

It must return nothing. If it returns anything, the build is emitting expiring URLs. Fix it before deploying.

**3. `.cache/notion/` is committed on purpose.** It looks like generated junk that shouldn't be in git. It isn't. It's the last-known-good copy of all Notion content, and the build falls back to it when the Notion API is unreachable or the token has expired. Deleting it or gitignoring it means that one day, years from now, an API hiccup takes the whole site down instead of serving slightly stale content. **A stale site beats a broken one.**

**4. Build minutes.** Netlify's free tier allows 300 build minutes per month. The 12-hour scheduled rebuild plus normal development fits, but not with much room. If builds start failing near the end of the month, that's why. Options: lengthen the rebuild interval, or migrate to Cloudflare Pages (unmetered build minutes, also free — but it wants DNS moved to Cloudflare). See decision #3 in `CLAUDE.md`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Exec published in Notion, site unchanged | No rebuild has run | Click "Publish now" in Notion, wait 2 min |
| A whole database renders empty, no error | Integration not shared with that database | Share it in Notion → `···` → Connections |
| Build fails: "expected property X" | Someone renamed a Notion property | Rename it back, or update `src/lib/notion/` |
| Images broken ~1 hour after deploy | Notion URLs leaked into HTML | Run the `grep` test in Landmines |
| A page shows "this page is being updated" | Its Pages row is `Draft`, or its `Key` was changed | Set `Status: Published` and restore the `page-*` key |
| A page shows old content, no error | Notion was unreachable; served from committed cache | Check the deploy log — it names every page served from cache |
| Footer address / hours won't change | Settings key renamed or blank, so a repo default is showing | Check the key spelling against `docs/notion-schema.md` §8 |
| A gallery photo never appears | Missing `Alt` — the item was skipped | Add alt text in the Gallery row and rebuild |
| Builds failing late in the month | Build minutes exhausted | See Landmine 4 |
| An old link from Instagram 404s | Missing redirect | Add it to `netlify.toml`; see `docs/information-architecture.md` |
| Site loads but is unstyled | Build partially failed or CSS path broke | Check the Netlify deploy log first, always |

**Always start with the Netlify deploy log.** It answers most questions in under a minute, and the build prints a content summary each run: item counts per database and resources unverified for over a year.

---

## Documentation map

| File | Audience | Purpose |
|---|---|---|
| `CLAUDE.md` | Coding agents, developers | Project context, scope, decisions. Read before structural work. |
| `MAINTENANCE.md` | You | Onboarding + runbook |
| `docs/notion-schema.md` | Developers | Database schemas and the fetch contract |
| `docs/information-architecture.md` | Developers | Sitemap, routing, redirects |
| `docs/content-inventory.md` | Everyone | What came from the old Wix site and why |
| `docs/design-brief.md` | Designers | Visual constraints and goals |
| `docs/migration-checklist.md` | Whoever launches / re-launches | Cutover and handover steps |
| Editor's guide *(in Notion)* | Council members | How to publish. Non-technical. |

---

## Things not to change without reading the reasoning

`CLAUDE.md` has a decisions log with a one-line rationale for each. Some choices look suboptimal in isolation and are load-bearing in context — the committed cache, the copy-paste newsletter export instead of a mailing list, the mistreatment form staying on McGill's servers, Netlify over other hosts.

**Two that look inconsistent and aren't.** Nearly all site content was deliberately moved *into* Notion so execs can edit it without a developer (decision 12). Two things were deliberately kept *out*: page routes, because letting Notion mint URLs means slug typos silently 404 (12a), and the **Land Acknowledgement and Commitment to Truth & Reconciliation**, which are verbatim texts that must not be edited, paraphrased, or "improved" (13). If you are tidying `src/config/` and wondering why those two blocks of prose are sitting in a config file rather than the CMS — that's why. Leave them.

If a decision genuinely no longer holds, change it and **update the log with the new reasoning**. The log is only useful if it stays true.

---

## When you're stuck

1. Netlify deploy log
2. This file's troubleshooting table
3. `docs/` for the relevant spec
4. Astro and Notion API docs — both are good and current
5. The NUS President or Director of Logistics for account access

If you're about to make a change you don't fully understand: the site is fully static and every deploy is retained by Netlify, so **you can roll back to any previous deploy in one click**. Nothing you do here is unrecoverable except losing the domain or deleting Notion content.
