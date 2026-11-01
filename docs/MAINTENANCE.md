# MAINTENANCE

**Last reviewed:** 2026-11-01
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
| Cloudflare account | `nus.nursing@mail.mcgill.ca` (NUS-owned) | _TODO — who holds the password_ | Hosting and builds (Pages project `mcgill-nus`, live at https://mcgill-nus.pages.dev). **DNS too, from launch** |
| GoDaddy (domain) | _TODO_ | _TODO_ | `mcgillnus.ca`, and **renewal matters, see Landmines** |
| Editor's guide | _TODO — Google Doc in the NUS Drive_ | — | How council members publish |
| Google Drive (linked PDFs) | _TODO_ | _TODO_ | Minutes, textbooks, financial aid docs |

**If you don't have access to something here:** ask the current NUS President and the Director of Logistics. If nobody knows, the account recovery email is most likely `nus.nursing@mail.mcgill.ca`. Try that before assuming anything is lost.

---

## Repo tour

Keep this current. A stale map is worse than none.

Directories marked *(planned)* do not exist yet. Phase 0 built the publish loop (posts); the informational pages and a plain nav followed, then the council roster, the resources directory and Get Involved. Everything unmarked is real and on disk today.

```
CLAUDE.md                Project context — read before making structural changes
.pages.yml               Pages CMS config: the forms editors see. Must match
                         src/content.config.ts field for field.
docs/MAINTENANCE.md      This file
docs/                    Reference specs (see Documentation map, below)
src/
  content/               ALL SITE CONTENT. Written by editors via Pages CMS.
    posts/               One .md file per news post
    pages/               The five informational pages (fixed set, see 12a)
    council/             One .yml per council position per term
    resources/           One .yml per resource
    committees/          One .md per committee or club
    gallery/gallery.json Homepage photos, as one ordered list
    settings.json        Address, office hours, socials, current council term
  content.config.ts      Validates every content file at build time (Zod)
  assets/uploads/        Every image an editor has uploaded
  pages/                 Every URL on the site. File path = URL path.
    index.astro          The homepage: the lead post, Featured, More news,
                         the event photos, then the Land Acknowledgement
                         and the Commitment to Truth & Reconciliation
    news/[slug].astro    One page per published post
    about/index.astro    /about/. Beside it, fees, governance and
                         elections .astro serve /about/fees/ and so on: the
                         informational pages. Each names its file in
                         src/content/pages/ and does nothing else
    about/council.astro  /about/council/: the council for the term in Site
                         settings (or the newest term with entries)
    contact.astro        /contact/, the fifth informational page
    resources/index.astro  /resources/, by category. Each heading's #anchor
                         is the resource's filename
    involved/index.astro /involved/: a card per committee or club
    involved/[slug].astro  /involved/<slug>/, only for committees without an
                         external link
    404.astro            "Page not found". Don't delete it: without it Cloudflare
                         answers every unknown address with the homepage
  layouts/
    Base.astro           Page shell: the header with the nav, the page, then
                         the footer. Also loads the rule that keeps images
                         in the column
  components/
    InfoPage.astro       Renders one informational page: heading, then text
    Nav.astro            The main nav, from src/config/nav.ts
    Footer.astro         Every page's footer: email, address, office hours and
                         social links from Site settings, and a link to the
                         Land Acknowledgement on the homepage
    CouncilMember.astro  One council position, or an open seat. Holds every
                         photo to the same 4:5 shape
    CommitteeCard.astro  One committee's card on /involved/
    CommitteeLogo.astro  A committee's logo, whole, in a square (card and page)
    PostDate.astro       A post's date in words, on the homepage and the
                         post's page
  lib/
    content.ts           Soft checks: drops one bad value with a warning
                         instead of failing the whole build. Loads posts, the
                         five pages, the council, resources, committees and
                         homepage photos, sorts posts for the homepage,
                         and logs what's overdue a check
    settings.ts          Reads Site settings (settings.json); a blank value,
                         or an email that isn't an address, falls back to a
                         repo default. A social link left blank or not
                         https:// is left out. Never fails the build
    links.ts             What counts as a safe link or a real email address,
                         for content and Site settings alike
    council-term.mjs     Which council term to show when Site settings names
                         one with no entries yet
    image-alt.mjs        Images pasted into post or page text get their
                         filename as alt text from the CMS; this makes them
                         decorative
  config/                Developer-owned text, never exposed in the CMS
    routes.ts            Every address the code links to, in one place
    nav.ts               Nav labels (UI strings, decision 6)
    indigenous-relations.ts  The Land Acknowledgement and Commitment to Truth &
                         Reconciliation, verbatim — see "Things not to change"
  styles/                (planned) — Phase 0 is deliberately unstyled
tests/                   Run by `npm test` and by CI on every PR
  cms-contract.test.mjs  .pages.yml and src/content.config.ts still agree
  build.test.mjs         Builds against fixtures; checks drafts, links, images,
                         the homepage, the five pages, the nav, the footer,
                         the council, resources and committees
  council-term.test.mjs  The council term fallback
  redirects.test.mjs     Every redirect is a valid 301 to a page (and heading)
                         that exists
  lib/headings.mjs       Works out a heading's #anchor the way Astro does
  fixtures/              Deliberately awkward content for build.test.mjs
public/                  Files served as-is (favicon, robots.txt)
  _redirects             Old Wix addresses → new ones. Read by Cloudflare,
                         never served as a page
.github/workflows/ci.yml CI: runs `npm run verify` on every PR and push to main
astro.config.mjs         Framework config
```

**Where things live, by question:**

| "Where do I change…" | Look in |
|---|---|
| A nav label or button text | `src/config/` (the nav is `src/config/nav.ts`) |
| Actual page content, including About, Fees, Elections | **Pages CMS** (it edits `src/content/`) |
| Office hours, address, social links, current council term | **Pages CMS** → Site settings |
| Homepage event photos | **Pages CMS** → Homepage photos |
| What fields editors see, and their help text | `.pages.yml` **and** `src/content.config.ts` |
| The Land Acknowledgement or T&R statement | `src/config/indigenous-relations.ts`, **and read decision 13 first** |
| A URL / adding a page | `src/pages/` and `src/config/routes.ts` (see [Adding a new page](#adding-a-new-page)) |
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

- **`tests/cms-contract.test.mjs`** checks that `.pages.yml` and `src/content.config.ts` still agree: same fields, no field required by the build but optional in the form, same select options, image paths still relative (Landmine 4), the informational pages still locked.
- **`tests/build.test.mjs`** builds the site against `tests/fixtures/content/`, a set of deliberately awkward content:
  - posts: a draft, a duplicate web address, a `javascript:` link, a cover with no description;
  - pages: one never checked, one last checked in 2024, one with a pasted picture, and a seventh file with no route.

  It then checks the HTML: drafts never appear, bad values are dropped, every image is processed, each informational page builds at its own address, and the nav links only to pages that exist.
- **`tests/redirects.test.mjs`** checks `public/_redirects`: every line is a 301 Cloudflare can read, no old address appears twice, and nothing loops. It also checks that every redirect to a committee or post lands on one that has a page, and that every `#anchor` on an informational page still matches a heading. Those last checks read the real content, so an editor renaming a committee's web address, or the Governance page's *NUS Meeting Minutes* heading, turns `main` red. That's the point: the old link would otherwise break silently.

When a test fails, its message says what to fix.

You need **Node 22** (`.nvmrc`). If `npm install` fails with cryptic errors, a mismatched Node version is the usual cause.

---

## Runbook: the things you'll actually do

### How code changes reach main

`main` is protected by a ruleset (**Settings → Rules → Rulesets → "Protect main"**). Every code change goes through a pull request, and the PR can only merge once the **`verify`** check (CI) is green:

1. `git switch -c my-change`, make the change, run `npm run verify` locally.
2. Push the branch and open a PR. CI runs automatically, and Cloudflare builds a preview: the **Cloudflare Pages** check on the PR links to it, and it also lives at `https://<branch-name>.mcgill-nus.pages.dev`, with any `/` in the branch name turned into `-` (`feature/info-pages` → `feature-info-pages.mcgill-nus.pages.dev`). Cloudflare cuts that name to its first 28 characters, so a longer branch's preview is elsewhere than you'd guess (`feature/roster-resources-involved` → `feature-roster-resources-inv.mcgill-nus.pages.dev`); the guessed address just shows "Page not found" everywhere. When in doubt, follow the check's link. Redirects work there too, so check old addresses on the preview before merging.
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
4. In **Site settings**, change **Current council term** to the new term. This is what flips the site over. Until you do it, the old council keeps showing. Doing it too early is safe: if the new term has no entries yet, the page keeps showing the newest term that has some, its heading names that term ("Council 2025–26"), and the build log says why (`src/lib/council-term.mjs`). It never shows an empty council.
5. Wait two minutes and check `/about/council/`.

Keep the `{role}.nus@mail.mcgill.ca` email convention. Cohort reps use personal McGill addresses; SSMU roles use `@ssmu.ca`.

### Editing an informational page

**This is a Pages CMS job, not a code job. Tell the exec so and stop there.**

About, Fees, Governance, Elections and Contact are the **Pages** list in Pages CMS. An exec edits the page and saves. Nothing in the repo needs a developer.

Editors can't add, delete or rename these pages, on purpose. See the next entry.

Two things worth a line in the editor's guide:

- **Last checked.** Each page has a *Last checked* date. Setting it to today after reading the page through tells the build the page isn't stale. A page not checked for a year gets a warning in the build log, and pages never checked are listed there in one line. Neither ever stops a page publishing.
- **Some headings are link targets.** The old Wix address `/nus-council-meetings` lands on the *NUS Meeting Minutes* heading of Governance (the `#nus-meeting-minutes` anchor). Renaming that heading moves the anchor, and visitors land at the top of the page instead. `tests/redirects.test.mjs` turns `main` red when that happens, and the error lists the page's anchors so you can update `public/_redirects` to match. Every other heading can be renamed freely.

### Adding a new page

All in the repo. For a page execs can edit, like the informational pages:

1. Add `src/content/pages/<name>.md` with a `title`, a `metaDescription` and some placeholder text. It appears in the CMS **Pages** list automatically; `.pages.yml` needs no change.
2. Add `'<name>'` to `INFO_PAGES` in `src/lib/content.ts`, and its address to `src/config/routes.ts` under the same key.
3. Create the route file. The file path is the URL: `src/pages/about/<name>.astro` serves `/about/<name>/`. Copy an existing one, such as `src/pages/about/fees.astro`; the whole page is `<InfoPage name="<name>" />`.
4. Add it to `NAV_ITEMS` in `src/config/nav.ts`, with its label and `ROUTES.<name>` as the link.
5. Update the tests:
   - add `'<name>'` to `FIXED_PAGES` in `tests/cms-contract.test.mjs`;
   - add the page to `INFO_PAGES` in both `tests/build.test.mjs` and `tests/redirects.test.mjs`;
   - add a fixture page to `tests/fixtures/content/pages/`, with `<NAME>-BODY-MARKER` in its text.
6. Add a redirect to `public/_redirects` if it replaces an old Wix URL.

If step 2 or 3 is missed, the build log says `src/content/pages/<name>.md has no route, so it isn't on the site`. There is deliberately no catch-all route that would publish the file anyway.

A page execs **don't** write, such as a list built from a collection like the council roster, skips steps 1 and 2. Write its route file directly, wrapped in `src/layouts/Base.astro`; copy the shape of `src/pages/news/[slug].astro`. Then add its address to `src/config/routes.ts` and do steps 4 and 6.

**Why execs can't do this themselves:** page routes are a fixed set on purpose (`CLAUDE.md` decision 12a). If any editor could mint a URL, a slug typo would silently 404 their work, and new pages would appear in no nav and no sitemap.

### Adding a redirect

When an old address turns up that lands on "Page not found" (a Wix link in an old email, an Instagram bio), or when a page moves:

1. Add one line to `public/_redirects`: `/old-address /new-address/ 301`. Fixed addresses go above the wildcard (`*`) lines at the bottom.
2. Add the same row to the redirect map in `docs/information-architecture.md`.
3. Run `npm test`. `tests/redirects.test.mjs` says what's wrong if the line won't work.
4. Open a PR. Once it's merged and deployed, check the old address in a browser.

Things that trip people up:

- **Always write `301`.** Without a code, Cloudflare sends a temporary 302 and search engines keep the old address.
- **Don't add a rule that only adds a slash** (`/about /about/`). Cloudflare does that by itself once the page exists, and the rule can loop.
- **Point at the final address,** never at another old address in the file.
- **An old address only matches exactly as written.** Checked on a preview deploy (2026-10-21): `/nus-council/` and `/NUS-Council` don't match a rule for `/nus-council`, and get "Page not found". Wix never used trailing slashes or capitals, so each Wix address is listed once, as Wix wrote it. Query strings are carried through to the new address.
- A rule that points at a committee or post (`/involved/…/`, `/news/…/`) depends on that entry's web address. If an editor changes it, the test fails and the redirect needs updating to match.

The limit is 2,000 fixed and 100 wildcard rules; the file is nowhere near either.

### Adding a photo to the homepage gallery

A Pages CMS job. **Homepage photos** is one list; add a photo, give it a description, and drag it into position. List order is display order.

**Term** decides how long a photo shows. The homepage shows the photos whose Term is the current council term (Site settings), plus every photo with no Term. So once this year's photos are in, last year's stop showing without anyone deleting them. Until the first photo of a new term is added, the homepage keeps showing the newest term that has photos, so the section doesn't empty at the council rollover. A photo with no Term shows until someone removes it from the list, which is how to retire any photo. The 11 photos imported from Wix have no Term.

### Changing the office hours, address, or social links

**Site settings** in Pages CMS. Edit, save, done: they show in the footer of every page. To take a social network off the site, empty its link; there is no default to bring it back. These are facts about the club, not labels. If you're tempted to add a setting for button text or a nav label, it belongs in `src/config/` instead (decision 6).

### Adding a field editors can fill in

Order matters. Do it backwards and the build breaks for everyone:

1. Add the field to `src/content.config.ts` as **optional** first. Existing files don't have it, and a required field would fail on every one of them.
2. Add the same field, with the same `name`, to `.pages.yml`. Write a `description` an exec can understand.
3. Use it in the page or component.
4. Update `docs/content-schema.md`, and the editor's guide if execs need to know.

**Renaming a field means editing every existing file that uses it.** Content files keep the old name until someone changes them. Either rename across `src/content/` in the same commit, or don't rename.

**Never make `src/content.config.ts` stricter than `.pages.yml`.** If the form lets an editor save something the schema rejects, their save silently never goes live. Put soft checks in `src/lib/content.ts` instead (see `docs/content-schema.md`). `tests/cms-contract.test.mjs` fails CI if the two files disagree on names, required fields or select options.

### Turning on build-failure emails

Set up 2026-10-20; redo it whenever the Cloudflare account changes hands. Without it, a failed build is invisible: the old site stays up and nobody knows why changes stopped appearing.

Cloudflare renamed "Notifications" to **Alerts** in 2026. The direct link `https://dash.cloudflare.com/?to=/:account/notifications` survives menu changes. Then:

1. **Create an Alert** → the Pages alert **Project updates** → **Select**.
2. Project `mcgill-nus`, event **Deployment failed** only. "Started" and "success" would email on every save.
3. Deliver to `nus.nursing@mail.mcgill.ca`.

It's free.

### If the Cloudflare project ever has to be recreated

If the project is deleted, the account is lost, or the site moves to a new NUS account, these are the settings. Nothing else is stored in Cloudflare: no environment variables, no secrets.

1. **Workers & Pages → Create application → the Pages tab.** Not the Workers tab. Cloudflare's create screen opens on Workers, which also offers "Import a repository", and a project made there is a Worker at a `.workers.dev` address. It won't appear in the Pages alert list, and it fails every build without extra config. This happened once (2026-10-19).
2. **Import an existing Git repository**, then connect GitHub with access to **this repository only**.
3. Use these settings:

   | Setting | Value |
   |---|---|
   | Project name | `mcgill-nus` (the address becomes `mcgill-nus.pages.dev`) |
   | Production branch | `main` |
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | blank |
   | Environment variables | none (the Node version comes from `.nvmrc`) |

4. If the address comes out different, update `site` in `astro.config.mjs` to match, through a PR.
5. Redo the build-failure alert (above). Once the domain has moved, re-add `mcgillnus.ca` as a custom domain.

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
| Build log: "an image in the post text has no description (only its filename …)", or the same for "page text" | An editor pasted a picture into a post's or page's text; Pages CMS can't describe those, so it's shown but skipped by screen readers | Nothing is broken. If the picture matters, ask the editor to write what it shows in the text, or, in a post, to make it the Cover image (which takes a description) |
| Build log: "… was last checked on …, over a year ago" | Nobody has set that page's **Last checked** date in Pages CMS for a year. The page still publishes | Ask a council member to read the page through in Pages CMS, fix anything out of date, and set Last checked to today |
| Build log: "Pages never checked: …" | Those pages have no Last checked date. All of them arrived from Wix without one (2026-10-21), so expect this line until the council has read them | Same as above. Nothing is broken; the line is there so the gap stays visible |
| Build log: "src/content/pages/… has no route, so it isn't on the site" | A page file was added in the repo without finishing [Adding a new page](#adding-a-new-page) | Finish steps 2–5, or delete the file |
| Build fails: "src/content/pages/… is missing" | One of the page files was deleted or renamed in the repo. The CMS can't do either, so it was a commit | `git log -- <file>` finds the commit that removed it; `git checkout <that commit>~1 -- <file>` brings it back |
| A cover image or logo doesn't show | No description was given | Add one in the CMS; the build log says which |
| The council page shows last year's council | Site settings → **Current council term** names a term with no council entries (or none switched on to **Show on the site**), so the page falls back to the newest term that has some. The build log says "No council entries for …, so the roster shows …" | Enter the new council (see [The annual council rollover](#the-annual-council-rollover)), or set Current council term back. If the log shows nothing, the term is still the old one: change it |
| You edited `src/content/settings.json` and `npm run dev` still shows the old value (the council term, say) | The dev server reads Site settings once, when it starts, and doesn't watch that file. Council entries and other content do update live. The live site isn't affected: every build reads the file fresh | Stop `npm run dev` and start it again |
| A social link is missing from the footer | Its link in Site settings is empty (that's how the council takes a network off the site, so the build log says nothing), or it doesn't start `https://`, and the log says `… isn't a web link (https://…), so the footer leaves it out` | Put the full address back in Pages CMS → Site settings |
| Build log: "contactEmail is … which isn't an email address" | Site settings' Contact email holds something else, often a web link. The footer shows the default address instead | Correct it in Pages CMS → Site settings |
| Build log: "… ignored, because it isn't an email address" | A council email or committee contact email holds something else, often a web link. The address is left off the page | Correct the email in Pages CMS |
| Build log: "Resources whose link was never checked: …" or "… link last checked on …, over a year ago" | No one has set **Link last checked** on those resources. All fifteen arrived from Wix without it (2026-10-21) | Click each link; if it works, set Link last checked to today in Pages CMS. If it's dead, fix or hide the resource |
| Build log: "Committees with no short description …" | Those committees' cards show only a name. NPMP and VASC had none on Wix | Ask the council for a sentence each, and add it in Pages CMS |
| Images broken on the live site | An unprocessed image path reached the HTML | See Landmine 4. `npm run verify` names the page |
| Images show huge, wider than the page | The `image` block in `astro.config.mjs` (`layout: 'constrained'`, `responsiveStyles: true`) was removed or changed, or the `import 'astro:assets'` line in `src/layouts/Base.astro` was. Astro only adds its image stylesheet to pages that import `astro:assets`, so without that line a picture in a page's text shows at full size | Restore it. `tests/build.test.mjs` fails if any image isn't constrained |
| Nobody can add a new editor | The GitHub account that installed Pages CMS is gone | See Landmine 3 |
| Pages CMS says "This repository requires changes through a pull request" for one person | They're signed in to Pages CMS with GitHub, so they save as themselves, which the ruleset blocks. Email collaborators save as the app and aren't affected | Editors: invite them by email and have them sign in that way. Maintainers: use a collaborator login, or save to a branch and open a PR. See Landmine 3 |
| Editors' saves fail in Pages CMS, for everyone | Pages CMS is no longer on the ruleset's bypass list (or was reinstalled) | Settings → Rules → "Protect main" → Bypass list → add Pages CMS. See Landmine 3 |
| A PR can't be merged | The required `verify` check is failing or hasn't run | See [When CI fails](#when-ci-fails) |
| CI stopped being required | The job in `ci.yml` was renamed, so the ruleset waits on a check that never reports | Make the ruleset's required check match the job name |
| A "Workers Builds" check fails on every commit | A Cloudflare **Worker** is connected to the repo, usually one created by mistake on the Workers tab | Delete that Worker in Cloudflare (its address ends in `.workers.dev`); keep the `.pages.dev` project. See "If the Cloudflare project ever has to be recreated" |
| Site stopped updating, but is still online | Monthly build allowance used up (500 on the free plan; every Save is one) | It resets monthly. It would take a lot of saving; check for something stuck in a commit loop |
| A pinned post won't drop off the top | Pins are checked at build time | Any Save triggers a build; it drops off then |
| A post marked Featured shows under More news instead | More than four posts are marked Featured. The four that come first on the homepage keep the spot (the lead counts as one); the build log names the rest | Switch Featured off on a post that no longer needs it |
| A photo disappeared from the homepage | Either its description is only spaces (the build log names it by its position in the list), or its Term isn't the current council term while at least one photo has the current term. Photos with no Term always show | Write a description, or change or clear its Term, in **Homepage photos**. See [Adding a photo to the homepage gallery](#adding-a-photo-to-the-homepage-gallery) |
| The build log warns `The collection "gallery" does not exist or is empty. Please check your content config file for errors.` | **Homepage photos** is empty. That's Astro's own wording; nothing is wrong with the config, and the homepage simply has no photo section | Nothing to fix. It goes away once a photo is added |
| An old link from Instagram 404s | Missing redirect | See [Adding a redirect](#adding-a-redirect) |
| CI fails in `redirects.test.mjs` after an editor's save | A redirect points at a committee or post whose web address changed, or that was hidden or unpublished. Or it points at a `#anchor` on an informational page whose heading was renamed | Update the line in `public/_redirects` (and the redirect map) to the new address, or to one of the anchors the error lists, through a PR |
| A mistyped address shows the homepage instead of "Page not found" | `src/pages/404.astro` is gone, so the build has no `404.html` and Cloudflare treats the site as a single-page app | Restore `src/pages/404.astro` |
| Site loads but is unstyled | Build partially failed or CSS path broke | Check the Cloudflare deploy log first, always |

**Always start with the Cloudflare Pages deploy log.** It answers most questions in under a minute, and the build prints a content summary each run: published and draft counts, anything it dropped and why, and which pages are overdue a read-through.

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
