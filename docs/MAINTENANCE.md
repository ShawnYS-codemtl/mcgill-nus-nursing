# MAINTENANCE

**Last reviewed:** 2026-10-19
**Maintained by:** _(role, not person — e.g. "Director of Logistics" or "NUS Webmaster")_

---

## Read this first

You've inherited the McGill NUS website. You probably didn't build it and the person who did has likely graduated. This file is written on that assumption.

**The mental model, in one paragraph.** All the site's content (posts, pages, council members, photos) lives **in this repo** as ordinary files under `src/content/`. Council members never touch those files directly. They edit them through **Pages CMS**, a free web editor at `app.pagescms.org` that shows them forms instead of files, and every time they press Save it commits the change to this repo. **Cloudflare Pages** notices the commit, runs **Astro** to turn the files into plain HTML, and puts the result on the internet at `mcgillnus.ca`. That's it. There is no database, no server, no API key and nothing running in the background.

**The most important consequence of that model:** the repo *is* the website. There is no other copy of the content anywhere. Pages CMS stores nothing but the list of who is allowed to edit. If Pages CMS vanished tomorrow, every word and photo would still be here, and you would just need a different editor (see [If Pages CMS goes away](#if-pages-cms-goes-away)).

**If you only read one more thing,** read [Landmines](#landmines). Those are the four ways this site actually dies.

---

## Access inventory

Fill this in and keep it accurate. Missing access is the most common reason a handover fails.

| Thing | Who owns it | Where the credentials live | What it's for |
|---|---|---|---|
| GitHub repo | `ShawnYS-codemtl` — **the developer's personal account; must move to an NUS-owned account or org before launch** | _TODO_ | The code **and all the content** |
| Pages CMS | Installed as a GitHub App by the account above (app id `866529`, also the ruleset's bypass entry) | Signs in with that GitHub account | The editor council members use |
| Pages CMS collaborators | _TODO — list the current editors here_ | Managed inside Pages CMS, **not** in the repo | Who can edit |
| Cloudflare account | _TODO_ | _TODO_ | Hosting, builds **and DNS** |
| GoDaddy (domain) | _TODO_ | _TODO_ | `mcgillnus.ca`, and **renewal matters, see Landmines** |
| Editor's guide | _TODO — Google Doc in the NUS Drive_ | — | How council members publish |
| Google Drive (linked PDFs) | _TODO_ | _TODO_ | Minutes, textbooks, financial aid docs |

**If you don't have access to something here:** ask the current NUS President and the Director of Logistics. If nobody knows, the account recovery email is most likely `nus.nursing@mail.mcgill.ca`. Try that before assuming anything is lost.

---

## Repo tour

Keep this current. A stale map is worse than none.

Directories marked *(planned)* do not exist yet. The site is at Phase 0, which built only the publish loop. Everything unmarked is real and on disk today.

```
CLAUDE.md                Project context — read before making structural changes
.pages.yml               Pages CMS config: the forms editors see. Must match
                         src/content.config.ts field for field.
docs/MAINTENANCE.md      This file
docs/                    Reference specs (see Documentation map, below)
src/
  content/               ALL SITE CONTENT. Written by editors via Pages CMS.
    posts/               One .md file per news post
    pages/               The six informational pages (fixed set, see 12a)
    council/             One .yml per council position per term
    resources/           One .yml per resource
    committees/          One .md per committee or club
    gallery/gallery.json Homepage photos, as one ordered list
    settings.json        Address, office hours, socials, current council term
  content.config.ts      Validates every content file at build time (Zod)
  assets/uploads/        Every image an editor has uploaded
  pages/                 Every URL on the site. File path = URL path.
    index.astro          Post list (becomes the real homepage later)
    news/[slug].astro    One page per published post
  layouts/
    Base.astro           Page shell
  lib/
    content.ts           Soft checks: drops one bad value with a warning
                         instead of failing the whole build
  components/            (planned) Reusable UI pieces
  config/                (planned) Nav, UI strings, and the two verbatim
                         Indigenous-relations texts — see "Things not to change"
  styles/                (planned) — Phase 0 is deliberately unstyled
tests/                   Run by `npm test` and by CI on every PR
  cms-contract.test.mjs  .pages.yml and src/content.config.ts still agree
  build.test.mjs         Builds against fixtures; checks drafts, links, images
  fixtures/              Deliberately awkward content for build.test.mjs
public/                  Files served as-is (favicon, robots.txt, _redirects)
.github/workflows/ci.yml CI: runs `npm run verify` on every PR and push to main
astro.config.mjs         Framework config
```

**Where things live, by question:**

| "Where do I change…" | Look in |
|---|---|
| A nav label or button text | `src/config/` |
| Actual page content, including About, Fees, Elections | **Pages CMS** (it edits `src/content/`) |
| Office hours, address, social links, current council term | **Pages CMS** → Site settings |
| Homepage event photos | **Pages CMS** → Homepage photos |
| What fields editors see, and their help text | `.pages.yml` **and** `src/content.config.ts` |
| The Land Acknowledgement or T&R statement | `src/config/`, **and read decision 13 first** |
| A URL / adding a page | `src/pages/` |
| Old-URL redirects | `public/_redirects` |
| Colours, fonts, spacing | `src/styles/` + `tailwind.config` |

---

## Local setup

```bash
git clone <repo-url>
cd <repo>
npm install
npm run dev              # http://localhost:4321
```

No `.env`, no tokens: the build needs no secrets. `npm run build` produces the real site in `dist/`. `npm run preview` serves that build locally.

**Pull before you work.** Editors commit to `main` from the CMS all the time. If you've been away for a week, your copy is out of date.

**`npm run verify` is the one to run before you push.** It typechecks, builds, checks `dist/` for image paths Astro didn't process, and runs the tests in `tests/`. CI runs exactly this command on every pull request, so if it's green on your machine it will be green there.

The tests check the things a build can't catch on its own:

- **`tests/cms-contract.test.mjs`** checks that `.pages.yml` and `src/content.config.ts` still agree: same fields, no field required by the build but optional in the form, same select options, image paths still relative (Landmine 4), the six pages still locked.
- **`tests/build.test.mjs`** builds the site against `tests/fixtures/content/`, a set of deliberately awkward posts (a draft, a duplicate web address, a `javascript:` link, a cover with no description). It then checks the HTML: drafts never appear, bad values are dropped, every image is processed.

When a test fails, its message says what to fix.

You need **Node 22** (`.nvmrc`). If `npm install` fails with cryptic errors, a mismatched Node version is the usual cause.

---

## Runbook: the things you'll actually do

### How code changes reach main

`main` is protected by a ruleset (**Settings → Rules → Rulesets → "Protect main"**). Every code change goes through a pull request, and the PR can only merge once the **`verify`** check (CI) is green:

1. `git switch -c my-change`, make the change, run `npm run verify` locally.
2. Push the branch and open a PR. CI runs automatically; once Cloudflare is connected, the PR also gets a preview URL.
3. Merge when `verify` is green. Nobody needs to approve it: the check is the gate, not a reviewer, because there's usually only one maintainer.

**Content doesn't go through this.** Pages CMS commits straight to `main` (it has no pull-request option), and it's on the ruleset's bypass list so publishing stays one step. That's safe because the CMS form, the contract test and Cloudflare's keep-the-last-good-deploy behaviour already contain bad content. See `CLAUDE.md` decision 16. CI still runs on those commits, so a bad one shows up as a red X on `main`.

### When CI fails

Open the failed run (the red X on the PR → **Details**) and read the first failing step:

- **`npm ci` fails:** `package-lock.json` is out of sync with `package.json`. Run `npm install` locally and commit the lock file.
- **`check` fails:** a TypeScript error. The log gives file and line.
- **`build` fails with "data does not match collection schema":** a content file doesn't fit the schema. The message names the file and field.
- **`verify:images` fails:** an image path reached the HTML unprocessed. See Landmine 4.
- **A test fails:** its message says what's wrong and what to change. If you changed a rule *on purpose*, update the test in the same PR, and say why in the PR description.

Don't "fix" a red check by deleting the test or loosening the ruleset. Each test exists because its failure would otherwise be silent.

### How publishing works

An editor opens a post in Pages CMS, switches on **Published**, and presses **Save**. That commits to `main`, Cloudflare starts a build, and the change is live in about two minutes. There is no second step and no "publish now" button.

If a council member says "I saved it and it's not showing up," check in this order:

1. Is **Published** switched on? (Posts start switched off.)
2. Has it been two minutes?
3. **Did the build fail?** Check the Cloudflare Pages deploy log. A failed build leaves the previous version of the site live, so nothing looks broken; the change just never appears. The log names the file and the field.

### Adding or removing an editor

Every spring, and whenever someone joins or leaves the council:

1. Sign in to Pages CMS with the **NUS-owned GitHub account**.
2. Open the repo's collaborators settings and invite the new editor's McGill email. They get an email invite and **don't need a GitHub account**. **Always invite editors this way, even ones who happen to have GitHub.** An email collaborator saves as the Pages CMS app, which the ruleset lets through; someone signed in with GitHub saves as themselves, and is blocked (see Landmine 3).
3. Remove anyone who has left the council.
4. Update the collaborator row in the [Access inventory](#access-inventory). Pages CMS keeps this list in its own database, not in the repo, so this file is the only place it's written down.

### The annual council rollover

The single most predictable task. Happens every spring after elections. It is a **Pages CMS** job, not a code job.

1. In **Council**, create one entry per position for the new term (e.g. `2026-2027`). Fill in name, program, photo, role description, fun fact and email. Pages CMS has **no duplicate button** (checked 2026-10-14), so open last year's entry in a second tab and copy the role description across where the role hasn't changed.
2. Switch on **Position is vacant** for any position not yet filled. It renders a "position open" card instead of a blank person.
3. **Do not delete last year's entries.** They become the Past Councils page.
4. In **Site settings**, change **Current council term** to the new term. This is what flips the site over. Until you do it, the old council keeps showing.
5. Wait two minutes and check `/about/council/`.

Keep the `{role}.nus@mail.mcgill.ca` email convention. Cohort reps use personal McGill addresses; SSMU roles use `@ssmu.ca`.

### Editing an informational page

**This is a Pages CMS job, not a code job. Tell the exec so and stop there.**

About, Fees, Governance, ISoN, Elections and Contact are the **Pages** list in Pages CMS. An exec edits the page and saves. Nothing in the repo needs a developer.

Editors can't add, delete or rename these pages, on purpose. See the next entry.

### Adding a new page

All in the repo:

1. Create the route file in `src/pages/`. The file path is the URL: `src/pages/about/fees.astro` serves `/about/fees/`. Copy the shape of `src/pages/news/[slug].astro`.
2. If execs should be able to edit it, add `src/content/pages/<name>.md` with placeholder text, and have the route read it with `getEntry('pages', '<name>')`. It appears in the CMS **Pages** list automatically.
3. Add its label to the nav config in `src/config/`.
4. Add a redirect to `public/_redirects` if it replaces an old Wix URL.

*(Step 3 describes `src/config/` and the nav, which don't exist yet.)*

**Why execs can't do this themselves:** page routes are a fixed set on purpose (`CLAUDE.md` decision 12a). If any editor could mint a URL, a slug typo would silently 404 their work, and new pages would appear in no nav and no sitemap.

### Adding a photo to the homepage gallery

A Pages CMS job. **Homepage photos** is one list; add a photo, give it a description, and drag it into position. List order is display order.

### Changing the office hours, address, or social links

**Site settings** in Pages CMS. Edit, save, done. These are facts about the club, not labels. If you're tempted to add a setting for button text or a nav label, it belongs in `src/config/` instead (decision 6).

### Adding a field editors can fill in

Order matters. Do it backwards and the build breaks for everyone:

1. Add the field to `src/content.config.ts` as **optional** first. Existing files don't have it, and a required field would fail on every one of them.
2. Add the same field, with the same `name`, to `.pages.yml`. Write a `description` an exec can understand.
3. Use it in the page or component.
4. Update `docs/content-schema.md`, and the editor's guide if execs need to know.

**Renaming a field means editing every existing file that uses it.** Content files keep the old name until someone changes them. Either rename across `src/content/` in the same commit, or don't rename.

**Never make `src/content.config.ts` stricter than `.pages.yml`.** If the form lets an editor save something the schema rejects, their save silently never goes live. Put soft checks in `src/lib/content.ts` instead (see `docs/content-schema.md`). `tests/cms-contract.test.mjs` fails CI if the two files disagree on names, required fields or select options.

### Turning on build-failure emails

Do this once, and again whenever the Cloudflare account changes hands. In Cloudflare: **Notifications → Add → Pages → Deployment failed**, sent to `nus.nursing@mail.mcgill.ca`. It's free. Without it, a failed build is invisible: the old site stays up and nobody knows why changes stopped appearing.

### Once a year: check the repo size

Uploaded photos are committed at full size; Astro shrinks them on the way out, not on the way in. Phone photos run 3–8 MB, so the repo grows by a few hundred MB a year. GitHub starts to complain at a few GB. If it's getting large, compress the originals in `src/assets/uploads/` (resizing to about 2400px wide loses nothing visible) and commit.

### If Pages CMS goes away

Pages CMS is a free, open-source (MIT) project with a small team. If `app.pagescms.org` shuts down or changes terms, **no content is lost**, because it's all in this repo. Your options, in order of effort:

1. **Self-host Pages CMS** from its open-source code (it needs a host and a small database).
2. **Switch to Sveltia CMS or Decap CMS.** Both edit the same Markdown/YAML/JSON files. You rewrite `.pages.yml` as their `config.yml`; the content doesn't change. They need a GitHub sign-in for editors, though, which usually means a small OAuth helper on Cloudflare Workers.

Either way, re-invite the editors afterwards (the collaborator list doesn't carry over).

### Updating dependencies

Do this at least once a year even if nothing is wrong. `npm outdated`, upgrade in small batches, `npm run verify`, check the site locally, then push. Astro's major versions do introduce breaking changes, so read the migration guide rather than upgrading blind.

### Editing this file

When you change the repo structure, add a runbook entry, or hit a problem that took you an hour to figure out, write it down here. You are the only person who will ever have that context.

---

## Landmines

Four things that will actually take the site down. Understand these before changing anything near them.

**1. The domain renewal.** `mcgillnus.ca` is registered with GoDaddy. If it lapses, the site vanishes and recovering the domain can be expensive or impossible. Make sure renewal is not tied to one student's credit card, and that the renewal notice goes to an address the council will still be reading in three years. This is the most likely way this project dies, and it has nothing to do with code.

**2. `src/content/` and `src/assets/uploads/` are the website.** They look like ordinary source folders, and the uploads folder in particular looks like something a tidy-minded developer might gitignore or "move to a CDN." Don't. Every post, page, council member and photo the council has ever written is in those two folders and nowhere else. A force-push, a careless `git reset`, or a "cleanup" PR is how this site loses years of content. History is your backup: if something disappears, `git log -- src/content/` finds it.

**3. Editor access lives outside the repo.** The Pages CMS GitHub App is installed by one GitHub account, and the collaborator list sits in Pages CMS's own database. If that GitHub account belongs to a student who graduates, nobody can add next year's editors, and the site freezes with the old council's content. **The installing account must be NUS-owned.** Keep the collaborator list written down in the Access inventory.

**And never remove Pages CMS from the bypass list of the "Protect main" ruleset.** The ruleset requires a pull request for every change to `main`, and Pages CMS can't make pull requests. Without the bypass, every editor's Save fails, and publishing stops for everyone. The same happens if the app is reinstalled: re-add it to the bypass list straight away.

**Only email collaborators get through, not people signed in with GitHub.** Pages CMS writes with the *app's* identity for collaborators invited by email, and with the *person's own* GitHub identity for anyone signed in with GitHub, including you and the NUS-owned account. The ruleset exempts only the app, so a GitHub sign-in is blocked from saving to `main` with *"This repository requires changes through a pull request"*. That's deliberate: GitHub users are maintainers, and their changes go through a PR. To edit content yourself, either use a collaborator login (invite your own McGill email and sign in with it in a private window), or choose *save to a different branch* in the CMS and open a PR. **Never have council editors sign in with GitHub**, or their saves fail the same way.

**4. Image paths must stay relative.** The CMS writes uploaded image paths as `../../assets/uploads/<file>`. That only works because every content file that can hold an image sits exactly two folders below `src/` (`src/content/<collection>/<file>`). Astro only optimises a Markdown-body image with a relative path. A path starting with `/` is treated as a file in `public/` and ships unprocessed, or as a broken image. Nothing in the build complains: the site looks fine and the images 404. So:

- Don't change `media.output` in `.pages.yml`.
- Don't nest a collection deeper, or move one, without changing that path too.
- Run `npm run verify` before you push. It fails if an unprocessed image path reaches `dist/`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Exec saved a post, site unchanged | **Published** is off, or under two minutes passed | Switch it on and save; wait two minutes |
| Saved changes stopped appearing, site still up | A build is failing; Cloudflare keeps the last good deploy live | Cloudflare deploy log names the file and field. Usually a hand-edited file or a schema made stricter than `.pages.yml` |
| Build fails: "data does not match collection schema" | A content file doesn't fit `src/content.config.ts` | Fix the file the error names, or relax the schema to match `.pages.yml` |
| A post vanished after someone edited it | Its web address now matches another post's | The build log warns `was left out: its web address … is already used by …`. Change one |
| A cover image or logo doesn't show | No description was given | Add one in the CMS; the build log says which |
| Images broken on the live site | An unprocessed image path reached the HTML | See Landmine 4. `npm run verify` names the page |
| Images show huge, wider than the page | The `image` block in `astro.config.mjs` (`layout: 'constrained'`, `responsiveStyles: true`) was removed or changed | Restore it. `tests/build.test.mjs` fails if any image isn't constrained |
| Nobody can add a new editor | The GitHub account that installed Pages CMS is gone | See Landmine 3 |
| Pages CMS says "This repository requires changes through a pull request" for one person | They're signed in to Pages CMS with GitHub, so they save as themselves, which the ruleset blocks. Email collaborators save as the app and aren't affected | Editors: invite them by email and have them sign in that way. Maintainers: use a collaborator login, or save to a branch and open a PR. See Landmine 3 |
| Editors' saves fail in Pages CMS, for everyone | Pages CMS is no longer on the ruleset's bypass list (or was reinstalled) | Settings → Rules → "Protect main" → Bypass list → add Pages CMS. See Landmine 3 |
| A PR can't be merged | The required `verify` check is failing or hasn't run | See [When CI fails](#when-ci-fails) |
| CI stopped being required | The job in `ci.yml` was renamed, so the ruleset waits on a check that never reports | Make the ruleset's required check match the job name |
| Site stopped updating, but is still online | Monthly build allowance used up (500 on the free plan; every Save is one) | It resets monthly. It would take a lot of saving; check for something stuck in a commit loop |
| A pinned post won't drop off the top | Pins are checked at build time | Any Save triggers a build; it drops off then |
| An old link from Instagram 404s | Missing redirect | Add it to `public/_redirects`; see `docs/information-architecture.md` |
| Site loads but is unstyled | Build partially failed or CSS path broke | Check the Cloudflare deploy log first, always |

**Always start with the Cloudflare Pages deploy log.** It answers most questions in under a minute, and the build prints a content summary each run: published and draft counts, plus anything it dropped and why.

---

## Documentation map

| File | Audience | Purpose |
|---|---|---|
| `CLAUDE.md` | Coding agents, developers | Project context, scope, decisions. Read before structural work. |
| `MAINTENANCE.md` | You | Onboarding + runbook |
| `docs/content-schema.md` | Developers | Every content field, and the rules the CMS and the build share |
| `docs/information-architecture.md` | Developers | Sitemap, routing, redirects |
| `docs/content-inventory.md` | Everyone | What came from the old Wix site and why |
| `docs/design-brief.md` | Designers | Visual constraints and goals |
| `docs/migration-checklist.md` | Whoever launches / re-launches | Cutover and handover steps |
| Editor's guide *(Google Doc in the NUS Drive)* | Council members | How to publish. Non-technical. |

---

## Things not to change without reading the reasoning

`CLAUDE.md` has a decisions log with a one-line rationale for each. Some choices look suboptimal in isolation and are load-bearing in context: content in the repo rather than a hosted CMS, the copy-paste newsletter export instead of a mailing list, the mistreatment form staying on McGill's servers, Cloudflare Pages over other hosts.

**Two that look inconsistent and aren't.** Nearly all site content is deliberately editable by execs (decision 12). Two things are deliberately kept *out* of the CMS: the set of pages, because letting editors mint URLs means slug typos silently 404 (12a), and the **Land Acknowledgement and Commitment to Truth & Reconciliation**, which are verbatim texts that must not be edited, paraphrased or "improved" (13). If you are tidying `src/config/` and wondering why those two blocks of prose are sitting in a config file rather than the CMS, that's why. Leave them.

If a decision genuinely no longer holds, change it and **update the log with the new reasoning**. The log is only useful if it stays true.

---

## When you're stuck

1. Cloudflare Pages deploy log
2. This file's troubleshooting table
3. `docs/` for the relevant spec
4. Astro and Pages CMS docs (`docs.astro.build`, `pagescms.org/docs`)
5. The NUS President or Director of Logistics for account access

If you're about to make a change you don't fully understand: the site is fully static and Cloudflare Pages keeps every deploy, so **you can roll back to any previous deploy in one click**, and git has every version of every content file. Nothing you do here is unrecoverable except losing the domain or rewriting git history.
