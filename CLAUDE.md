# McGill NUS Website — Project Context

> Read this file first, every session. For deeper detail, load the file named in each section.
> Related docs: `MAINTENANCE.md`, `docs/content-inventory.md`, `docs/information-architecture.md`, `docs/content-schema.md`, `docs/design-brief.md`, `docs/migration-checklist.md`

---

## 1. What we're building

A public website for the **McGill Nursing Undergraduate Society (NUS)**, the student-run representative body for undergraduates at McGill's Ingram School of Nursing (ISoN). It replaces an aging Wix site at `nusnursing.wixsite.com/website` (live on the club's domain, `mcgillnus.ca`).

The current site fails in three specific ways, and every design decision below traces back to one of them:

1. **It goes stale.** Sponsors content is two years old and signed by a coordinator who has left. The calendar says "2024-2025." The Note-Taking Club hosts notes from 2018. Nobody updates it because updating it is a chore.
2. **There's no reason to return.** It's a static brochure. The homepage has an empty "Events & Announcements" module and an ad-hoc "LINKS" block that is, in effect, a hand-maintained newsletter — the club is already trying to do the thing this rebuild should make easy.
3. **It's not a useful resource.** The single most-wanted piece of information — which electives to take — is a PDF behind a Google Drive link.

**The core bet:** if a non-technical nursing exec can publish an update in under five minutes, from a plain web form, with nothing to install and no technical account to manage, the site stays alive after the person who built it graduates. Everything else is secondary to that.

**Audience:** McGill undergraduate nursing students (BScN and BNI, on-campus and online, U0–U3). Secondary: prospective students, ISoN faculty, sponsors.

---

## 2. Hard constraints

- **Zero budget.** Free tiers only, and only free tiers that don't quietly expire or require a card on file.
- **Annual turnover.** The entire council changes every year. Nothing may depend on a specific person's account, knowledge, or goodwill.
- **Solo developer, October deadline.** Scope aggressively. The Wix site stays live during the build, so there is no pressure to ship half a site — but there is pressure to ship a complete small one.
- **Non-technical editors.** Editors will never see a terminal, a git commit, or a markdown file.

---

## 3. Explicitly out of scope (do not build)

- ❌ **A French version of the site.** Removed from scope. Do not add locale prefixes, a language switcher, `hreflang` tags, or an i18n integration. If French returns later it will be a deliberate decision, not something that accretes.
- ❌ **User accounts / login on the public site.** Resources stay public; publishing is controlled by who is invited as an editor in Pages CMS, not by site auth. This keeps the build fully static.
- ❌ **Comments, forums, ratings, or any user-generated content.** Deferred past MVP by explicit decision — it carries a moderation burden the council cannot sustain.
- ❌ **Self-hosted email sending / subscriber list management.** See §6. The club already has a McGill listserv; building a parallel list invites CASL compliance problems.
- ❌ **A database, backend server, or serverless functions.** The output is static files. If a feature seems to need a server, escalate rather than adding one.
- ❌ **Re-implementing Google Drive.** Minutes, textbook PDFs, and financial-aid documents stay as Drive links. Do not build a file manager.
- ❌ **The mistreatment reporting form.** Stays on McGill's Microsoft Forms. Sensitive reports must not route through student-run infrastructure. Link out only.
- ❌ **E-commerce, ticketing, merch checkout.** Link to whatever external tool the council is already using.
- ❌ **A CMS admin UI of our own.** Pages CMS *is* the admin UI. Do not build a dashboard.

---

## 4. Architecture

```
Pages CMS  (app.pagescms.org, free)    ← execs write here, via forms
  │  email-invited collaborators; no GitHub account needed
  │  every Save = one commit to main
  ▼
GitHub repo (NUS-owned)  ← this repo; THE CONTENT LIVES HERE
  ├── src/content/posts/        (news / newsletter)
  ├── src/content/council/      (roster, filtered by term)
  ├── src/content/resources/    (student services directory)
  ├── src/content/committees/   (get-involved cards + detail)
  ├── src/content/pages/        (the five informational pages, fixed set)
  ├── src/content/gallery/      (homepage event photos)
  ├── src/content/settings.json (address, office hours, socials, current term)
  └── src/assets/uploads/       (every uploaded image)
          │
          │  push to main
          ▼
  Cloudflare Pages (static host)  ← free tier
    - Astro builds the site: validates content (src/content.config.ts),
      optimises images (astro:assets), renders all routes
    - builds on every push; nothing else triggers a build
          │
          ▼
  mcgillnus.ca (GoDaddy registrar, Cloudflare DNS)
```

### Key flows

**Publishing.** An exec opens Pages CMS, edits a post, switches on **Published**, and presses **Save**. That is a commit; the commit is a build; the site updates in ~1–2 min. There is no other publishing path, no second step, and no "publish now" button.

**Build-time resilience.** The build has no external dependencies at all: no API, no token, no network fetch. Content is files in the repo, so there is nothing for the build to fail to reach. The remaining failure is bad content, and two rules contain it. First, `src/content.config.ts` is **never stricter than the CMS form**, so anything an editor can save will build. Second, softer problems (a missing image description, a bad link, a duplicate URL) drop the one bad value with a warning in `src/lib/content.ts` rather than failing. If a build does fail, Cloudflare keeps the previous deploy live: the site goes stale, never down.

**Images.** Uploaded straight into `src/assets/uploads/` and optimised by `astro:assets` at build time. The CMS writes them as **relative** paths (`../../assets/uploads/…`), which only works because every image-bearing content file sits exactly two folders below `src/`. A `/`-prefixed path in a Markdown body ships unprocessed and broken, without any build error. `npm run verify` catches it. See `MAINTENANCE.md` Landmine 4.

**English only.** The site ships in English. French is not in scope (see §3). Every entry's **filename** is its permanent key (decision 5a), so adding French later is a content and routing job, not a migration.

---

## 5. Tech stack

### MVP dependencies

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** | Content-first, ships zero JS by default, islands available for the one interactive feature (electives table). Also has first-class i18n routing if French is ever added. |
| Content source | **Markdown / YAML / JSON in the repo**, edited through **Pages CMS** | Reverses the original Notion choice — see decision 1. Content lives in the NUS-owned repo; the editor is a free, MIT-licensed hosted form UI that commits on Save. Editors are invited by email and need no GitHub account. If Pages CMS disappears, the content does not: swap in another git-based CMS (Sveltia, Decap) by rewriting one config file. |
| Markdown → HTML | Astro's built-in Markdown pipeline | Nothing to own. Content is written by invited council members, not the public; links in structured fields are still checked to be `http(s)` in `src/lib/content.ts`. |
| Styling | **Tailwind CSS** | Design direction comes from the `impeccable` plugin — see `docs/design-brief.md`. Do not invent a visual language here. **Direction chosen 2026-10-30: "Desk by the Window", darker palette — see decision 17.** Design work happens in Figma ([McGill NUS — Website](https://www.figma.com/design/tsObtYnYk1w6sk9HAH1bsJ)), a workbench in a personal account; decision 17, and later `DESIGN.md`, are the record. **Not yet installed** — Phase 0 is deliberately unstyled. |
| Host | **Cloudflare Pages** free tier | 500 builds/month, unlimited bandwidth, and exceeding the build cap stops builds without taking the site down. See decision 3 — this reverses an earlier choice of Netlify. |
| Forms | External embeds / links | Microsoft Forms and Google Forms already in use. Cloudflare Pages has no forms product, so if an embed looks bad the fallback is a third-party form, not a host feature. |
| Package manager | npm | No reason to add a tool a successor won't recognise. |

### Deferred to later phases

- Email service provider (MailerLite or Buttondown) — only if §6 fast-follow is greenlit
- Search (Pagefind — trivially added to Astro, but not MVP)
- Analytics (Plausible free tier is not free; Cloudflare Web Analytics is)

### Standing note on versions

Verify every package against current docs at setup time; do not trust versions recalled from memory.

**As of the Pages CMS switch (2026-10-13):** Node 22, Astro 7.3.5 (content layer: `glob`/`file` loaders from `astro/loaders`, Zod from `astro/zod`). No CMS package is installed — Pages CMS is a hosted app that reads `.pages.yml`. `@notionhq/client` was removed.

---

## 6. The newsletter decision (read before building this)

The requirement was "one post publishes to the web and generates the email." Splitting that in two:

**MVP — web + a copy-pasteable email version.** A published post renders at `/news/[slug]` and also at `/news/[slug]/email`, which outputs email-safe inlined HTML the exec copies into the existing McGill listserv (`nus.nursing@mail.mcgill.ca`). Distribution stays on infrastructure McGill already runs.

**Why not a real ESP for MVP.** Running an independent mailing list means collecting consent, honouring unsubscribes, and keeping records — CASL obligations that fall on a rotating student council. The McGill listserv already reaches the entire student body, which is the actual audience. Building subscriber management would add the most compliance risk of anything in this project for the least marginal reach.

**Fast-follow, if the club wants it:** MailerLite free tier (1,000 subscribers), triggered by a build step. Revisit only after the site is live and the council has asked for it.

---

## 7. Features by phase

### MVP — must ship by October

- `[MVP]` **Homepage as newsletter:** latest post in full or as a lead card, recent posts below, featured links block, land acknowledgement.
- `[MVP]` News/post system, editable in the CMS: the homepage is the index (no separate `/news/` list until posts outgrow it), detail pages, dates, author (role, not person), optional cover image.
- `[MVP]` **Council roster**, editable in the CMS, filtered to the current term. Executive and General Council sections, photo/name/program/role/fun fact/email per member. Handles a VACANT row gracefully.
- `[MVP]` **Resources directory**, editable in the CMS — the 15 existing entries, grouped by category, each with title, description, outbound link.
- `[MVP]` Get Involved: committee/club cards, editable in the CMS, with detail pages for the ones that have real content.
- `[MVP]` **Informational pages, editable in the CMS:** About, Fees, Governance (Constitution & By-Laws), Elections, Contact. Content lives in `src/content/pages/`; the CMS can edit the five but cannot add, rename or delete one. Execs edit what a page says, never where it lives. See decision 12.
- `[MVP]` **Homepage photo gallery**, editable in the CMS, so the event photo library doesn't freeze at launch.
- `[MVP]` **Site settings, editable in the CMS:** office hours, address, contact email, social links. Degrades to repo defaults, never fails a build.
- `[MVP]` Contact page: office info, address, email, link to council roster, contact form.
- `[MVP]` 301 redirects from all old Wix URLs (see `docs/information-architecture.md`).
- `[MVP]` Accessibility baseline: semantic HTML, WCAG AA contrast, keyboard nav, alt text required in the CMS form for covers and logos, and images without it dropped at build. Pictures pasted into body text can't be described in the CMS, so they're marked decorative (`alt=""`, `src/lib/image-alt.mjs`).
- `[MVP]` **Editor's guide**, in plain language, for the incoming exec — a Google Doc in the NUS-owned Drive by default.

### Fast-follow — after launch, before end of term

- `[Fast-follow]` **Electives explorer:** filterable/searchable table from an electives collection (likely Pages CMS's spreadsheet-style `datagrid`). Highest-value feature for students; deferred only because the source data needs cleanup first.
- `[Fast-follow]` Email export view (`/news/[slug]/email`).
- `[Fast-follow]` Past councils (same council collection, filtered by a different term — nearly free once the roster exists).
- `[Fast-follow]` Meeting minutes index (links to Drive folders by term).
- `[Fast-follow]` Events / calendar — **only if** a council member commits in writing to maintaining it. The current one died in 2024.
- `[Fast-follow]` Site search via Pagefind.

### Later

- `[Later]` ESP integration with a real subscriber list.
- `[Later]` Instagram feed. The existing embed is fragile and Meta's free options are unreliable; the CMS-managed homepage gallery may serve better.
- `[Later]` Any user-generated content: elective reviews, Q&A, comments. Requires a moderation plan first.
- `[Later]` **French translation of the site.** Out of scope now, but the likeliest thing to come back given the Quebec context and the club's own EN-FR dictionary project. Stable filenames as keys and Astro's i18n routing keep the door open; adding it later is a content and routing job, not a rebuild.
- `[Later]` Note-Taking Club archive. Content is from 2018–19; confirm it's worth migrating at all.

---

## 8. Key decisions log

| # | Decision | Rationale |
|---|---|---|
| 1 | ~~Notion as CMS, not a git-based CMS~~ → **Content in the repo, edited through Pages CMS.** Reversed 2026-10-11 | **The original rationale rested on two things that turned out not to hold.** "Notion is a tool they already use" was never verified, and nothing in the content inventory shows the club using it: they run on Google Drive, MS Forms and Instagram. And "a git-based CMS requires a GitHub account per exec" is no longer true: Pages CMS invites editors **by email, with no GitHub account**. Meanwhile Notion was the costliest part of the plan. **Four of the five Landmines** in `MAINTENANCE.md` (expiring S3 image URLs, the committed cache, the public deploy hook, the cron GitHub silently disables) existed only because content lived outside the repo. Most of the remaining work was Notion plumbing. Publishing took two steps by design ("I published it and it's not showing up" was troubleshooting row 1). The free plan caps a workspace at 1,000 blocks once a second member joins. The API had already reshaped once (decision 14). Switching cost almost nothing because no Notion workspace had been created yet. **Cost accepted:** Pages CMS is a small single-maintainer project, and its collaborator list lives in its own database. Both are bounded. The content is plain files in the repo, so losing the editor means rewriting one config file for Sveltia/Decap, not migrating content; and the collaborator list is copied into `MAINTENANCE.md`. |
| 2 | Astro, static output, no server | Free hosting, no runtime to maintain, nothing to patch. A static site left alone for two years still works. |
| 3 | ~~Netlify over Cloudflare Pages~~ → **Cloudflare Pages.** Reversed 2026-09-29 | **The original rationale was factually wrong.** It claimed apex support "via an A record with GoDaddy DNS unchanged," but `mcgillnus.ca` does not use GoDaddy DNS — its nameservers are Wix's (`ns4/ns5.wixdns.net`), and GoDaddy is only the registrar. Today's DNS therefore dies with the Wix subscription, so **a nameserver move is unavoidable on any host** and Netlify's supposed decisive advantage never existed. Two further findings settled it: Netlify's free tier is now credit-based (300 credits/mo, 15 per production deploy ≈ 20 deploys, shared with bandwidth) and **pauses the site when credits run out** — disqualifying for a project whose whole premise is surviving neglect. Cloudflare Pages gives 500 builds/mo and unlimited bandwidth, and exceeding the cap stops *builds*, leaving the site up. It also puts DNS and hosting in one NUS-owned account. **Cost accepted:** nameservers move to Cloudflare, and the live `MX` record (`mail.mcgillnus.ca`) must be recreated or club email breaks. |
| 4 | ~~Committed Notion cache, build never hard-fails~~ → **Retired 2026-10-11** with decision 1 | The cache guarded against an unreachable API. With content in the repo there is no API to be unreachable. What survives is the principle: **the site goes stale, never down.** It is now carried by Cloudflare keeping the last good deploy when a build fails, by schemas that are never stricter than the CMS form, and by soft checks that drop one bad value instead of failing. See §4. |
| 5 | English only; no French for MVP | Removed from scope by the client. Cuts roughly a third of the build and all translation-commissioning work before an October deadline. |
| 5a | A stable key per entry, kept anyway → **now the filename** (updated 2026-10-11) | Without stable identifiers, adding French later means reissuing them across every collection and every URL. In Notion that needed a `Key` column on every database. In files, **the filename is the key**: set once from the title, slug or term+role when the entry is created, and locked by `operations: rename: false` in `.pages.yml`. Editors no longer type a key they could get wrong. A French entry would be `fr/<same filename>`. |
| 6 | UI strings in repo config, not the CMS | Nav labels and button text belong to the developer, and execs shouldn't be able to break navigation. **Facts about the club** — address, office hours, social handles, the current council term — are not UI strings and live in Site settings (`src/content/settings.json`, decision 12). The test: if changing it changes what a control *says*, it's a UI string; if it changes what the club *is*, it's content. |
| 7 | Newsletter email = copy-paste export, not an ESP | Avoids CASL obligations on a rotating student council; McGill's listserv already reaches the full audience. |
| 8 | Mistreatment form stays on Microsoft Forms | Sensitive disclosures must not pass through student-run infrastructure. |
| 9 | Council term as a field, not a new collection per year | Makes "Past Councils" free and makes the annual rollover a filter change instead of a migration. |
| 10 | Everything (repo, the Pages CMS install, Cloudflare, the domain) must end up NUS-owned | Personal accounts are the single most common way a club site dies. See `docs/migration-checklist.md`. |
| 11 | Sponsors, Note-Taking Club, and Calendar all archived — not migrated, not rewritten | Confirmed 2026-08-03. Each was stale in a way no rewrite fixes: Sponsors is bound to a departed coordinator and 2024 events, NTC is seven years old, the Calendar has no owner. Cutting all three removes the site's three worst staleness liabilities before launch rather than after. |
| 12 | Informational pages, the homepage gallery, and site settings are all editable in the CMS — not developer-only | Decided 2026-08-03. **Reverses the earlier "static informational pages" wording in §7.** Leaving About, Fees, Governance, ISoN, Elections, and Contact in the repo would mean the pages that change most predictably — Elections annually, Fees by referendum, ISoN whenever McGill's page moves — need a developer nobody is guaranteed to have. That is failure mode #1 from §1, rebuilt on purpose. The infrastructure cost is near zero: three more entries in `.pages.yml` and `src/content.config.ts`. **Updated 2026-10-31:** ISoN is no longer one of these pages. It was links to McGill's own site, the student handbook (already a resource), the grad students' association, and contacts for roles the council no longer has, so it became two Resources entries. Five pages remain. |
| 12a | Page routes are a fixed set in the repo; execs cannot create pages | Keeps decision 6's boundary intact. Now enforced by configuration, not code: the **Pages** collection in `.pages.yml` has `create`, `rename` and `delete` switched off. Editors change what a page *says*; they cannot change a URL, orphan a page outside the nav, or 404 their own work with a slug typo. File path still equals URL, so the `MAINTENANCE.md` repo tour stays true. Adding a seventh page is a small code change, deliberately. |
| 13 | The Land Acknowledgement and Truth & Reconciliation statement stay in `src/config/`, never exposed in the CMS | Both are verbatim texts that must not be edited, paraphrased, or "improved." Everything else on this list was made editable; these two are excluded for exactly that reason. Exposing them in `.pages.yml` would give every future exec an edit button on text that must not change. |
| 14 | ~~Notion API pinned to `2025-09-03`; the build resolves data sources itself~~ → **Retired 2026-10-11** with decision 1 | There is no Notion API in the build any more. Kept in the log because the data-source change it records (Notion reshaping its API under a pinned client) was one of the reasons for leaving. |
| 15 | ~~"Publish now" is a page with a button (`/publish`)~~ → **Retired 2026-10-11** with decision 1 | Every Save in Pages CMS is a commit, and every commit is a build, so there is nothing to press. The public deploy hook, the `/publish` page and the 6-hourly GitHub Actions rebuild (plus its keepalive hack) are all gone. So is the risk this decision accepted: a public URL anyone could use to burn the build allowance. |
| 16 | CI gates code; content bypasses it by design | Decided 2026-10-13. `.github/workflows/ci.yml` runs `npm run verify` (typecheck, build, image check, `tests/`) on every PR and every push to `main`. The "Protect main" ruleset requires a PR and a green `verify` for every change, with **Pages CMS on the bypass list**, because the CMS commits straight to `main` and has no pull-request mode. Gating content too would mean either a merge step for editors (two-step publishing again) or no CMS. Content is made safe a different way: the CMS form validates on save; `tests/cms-contract.test.mjs` guarantees the form is never looser than the build schema; soft problems drop one value rather than failing; a failed build leaves the last good deploy live. Any rule change to the ruleset must keep the bypass, or publishing stops (`MAINTENANCE.md` Landmine 3). **The bypass covers only the app's own identity** (found 2026-10-19). Pages CMS uses it for email-invited collaborators, but anyone signed in to the CMS with GitHub writes as themselves and is blocked like any direct push. That is the intended split: editors are email collaborators; maintainers change things through PRs. |
| 17 | **Visual direction: "Desk by the Window", in the darker palette.** Chosen 2026-10-30; replaces "The Desk" (accepted 2026-08-03, details since lost) | Chosen by the club after four rounds of side-by-side mobile homepages in Figma. Rejected along the way: a campus newspaper, a ward whiteboard and a registrar's ledger (August); Class Chat, Help-Desk Signs and Mixtape J-Card (October). **What it is:** the two directions the club liked, combined. From **The Desk**: index-card tab dividers are the navigation, posts sit on ruled index cards, the latest post gets one sticky note, washi tape holds photos, a lanyard badge is the site header, and handwriting appears only as margin asides. From **Mont Royal Poster**: a window across the top of the homepage looks onto a flat-ink Mont Royal scene that changes with the term (fall, winter, summer), driven by `currentTerm` in Site settings. **Palette** (asked for "slightly more professional"): navy cutting mat `#1C2638`; white index cards with ink `#1A1F2B` and pen `#1F3A6B`; fixed tab colours News `#8C2F39` (oxblood), About `#C99A2E` (mustard), Get involved `#2F5D50` (forest), Resources `#3D5A80` (slate). The sticky note and tape take muted seasonal colours. **Type:** Bricolage Grotesque for everything read, Gochi Hand only for asides. **Rules that come with it:** the tabs never change colour with the term; nothing that has to be read is tilted; one sticky note per screen; no "today" or "new" labels, because the site only rebuilds when someone saves, so they would go stale in a quiet month (use real dates; "latest" is always true); the changing scene never stands in for fresh posts. **Cost accepted:** the window spends the top quarter of the first screen before any news, so it stays a header and never grows into a hero; three window scenes have to be drawn well; and the darker palette leans toward the "polished" result the design brief calls a failure, so the handwriting, tape and sticky note must survive any later trimming. **Why it is written down here:** the August direction was lost because it lived only in a chat session, and the Figma file is in a personal account (decision 10). Until `DESIGN.md` is generated from the built site, this row is the record. |

---

## 9. Open questions — do not invent answers

- 🔴 **URGENT — the domain expires `2026-11-01`.** Found 2026-09-29 via `whois`, about five weeks out and effectively on top of the October deadline. This is Landmine 1 in `MAINTENANCE.md` — "the single most likely way this site disappears" — and it is live right now, not hypothetical. Confirm: who holds the GoDaddy login, is auto-renew on, and is renewal tied to a student's card? Nothing else in this project matters if the domain lapses.
- 🔴 **UNCONFIRMED — the domain no longer shows the club's site.** Found 2026-10-20, re-checked 2026-10-21. `mcgillnus.ca` and `www.mcgillnus.ca` both return Wix's "ConnectYourDomain Error" page (HTTP 404). DNS still points at Wix (nameservers `ns4/ns5.wixdns.net`; `www` is a CNAME to `cdn3.wixdns.net`), so the domain seems to have been disconnected from the site, most likely because the Wix premium plan lapsed. The registration itself still runs to `2026-11-01`, and the `MX` record still resolves. The old site is reachable only at `https://nusnursing.wixsite.com/website/<old-path>`, and may disappear entirely, so its text was imported on 2026-10-21 (council, resources, committees, the six pages, two posts, the verbatim texts). **Still to confirm with the council:** whether the plan lapsed, and whether email at `mcgillnus.ca` still works.
- **Gaps found in the Wix import (2026-10-21).** Not invented, so each is either blank or a placeholder until the council supplies it:
  - NPMP and VASC have no description on Wix (their cards show a name only), so their card text is empty.
  - Neither the 21st Century Fund page nor the EN-FR dictionary link shows a date; both posts carry 2026-10-21 as a placeholder.
  - The NUS Athletic Committee has one line and a link to a 2024 Instagram post, nothing more.
  - Seven PDFs (the Constitution, four sets of by-laws, the SSMU-NUS memorandum and the by-laws linked from Elections) and the Council Structure diagram are on Wix's servers only. The Governance page lists the documents by name, without links, until they are on the NUS Drive.
    - **Found 2026-10-30:** the club's public Drive (folder `Documents + logos`) now has `[UPDATED] 2026-2027 NUS Constitution.pdf` and `[UPDATED]2026-2027 Financial By-laws.pdf`, plus `NUS Council Structure.png`. Governance can link these. Not done yet; it's a content edit in the CMS once the council confirms they're final.
  - No field holds the homepage mission paragraph or the Executive/General Council intro sentences. The Past Councils rosters (2017–18 to 2024–25) weren't imported. All of these die with Wix.
- **To confirm before any DNS change:** `mcgillnus.ca` has a live `MX` record (`mail.mcgillnus.ca` → `69.195.124.181`). Who actually uses it? It must be recreated in Cloudflare or club email breaks at cutover. DNS today is hosted by **Wix**, not GoDaddy — see decision 3.

- ~~**To decide:** Which content gets cut.~~ **Resolved 2026-08-03:** Sponsors, Note-Taking Club, and Calendar are all archived. See §8 decision 11.
- ~~**To confirm:** Access to the original logo files and a photo asset folder.~~ **Resolved 2026-08-03:** both confirmed in hand — vector logo originals and the event photo library. Design may commit to real imagery.
- **To decide:** Whether the NUS has, or will create, an organisation-owned GitHub account. It now matters more than before: it owns the repo, which holds all the content, **and** it installs Pages CMS, which controls who can edit (`MAINTENANCE.md` Landmine 3). Build proceeds on personal accounts; transfer is a launch blocker, not a nice-to-have.
- ~~**To verify: the Pages CMS spike.**~~ **Passed 2026-10-14** on the `pages-cms` branch (PR #1).
  - **Confirmed:**
    - the app installs and reads `.pages.yml` from a branch;
    - a post saves with its cover as `../../assets/uploads/…` and builds;
    - the six pages can't be created or deleted;
    - an email-only collaborator (no GitHub account) can sign in and edit;
    - CI passed on every CMS commit.
  - **Found and fixed:** date fields auto-filled today's date (now `default: ""`, enforced by the contract test); a large cover rendered at full width (now `image.layout: 'constrained'`, enforced by the build test).
  - **Found, worked around:** no duplicate action, so the council rollover is entered by hand (runbook updated).
  - **Images inside post text (2026-10-20):** the CMS uploads a pasted image to `src/assets/uploads/` and writes a correct relative path, and it builds. But it sets the alt text to the **filename** (`image.png`) with no way for editors to change it. Fixed by treating such images as decorative (`src/lib/image-alt.mjs`, enforced by the build test), and steering meaningful photos to Cover image through the field help text.
  - **Watch for in step 5:** the trial post was first saved as a draft and didn't appear. Whether the **Published** toggle is easy to miss is exactly the hesitation step 5 exists to catch.
  - The `notion-phase0` branch stays as a record of the alternative; it is no longer the fallback plan.
- **To confirm after PR #1 merges:** one save in Pages CMS on `main` lands as a commit while the "Protect main" ruleset is active (turned on 2026-10-14, with Pages CMS, GitHub App id `866529`, on the bypass list). It is the one path the trial couldn't test from a branch.
- **To decide:** Whether an exec will commit *in writing* to maintaining an events calendar. Decision 11 archives the dead 2024–25 page; it does not authorise a replacement. Still governed by §7 — if nobody owns it, don't build it.
- **To confirm:** That the council is content shipping English-only, given the Quebec context and that some BNI content and the club's own dictionary project are francophone-facing. Not a blocker — just make sure it's a decision they've made rather than one they inherit.
- **To confirm:** That the club can use the McGill listserv for newsletter distribution as described in §6.
- **To confirm:** Source and shape of the electives data before building the explorer.

---

## 11. Documentation upkeep — standing rules

Two audiences, two documents, and they must not be merged:

- **Editors** (council members, non-technical, rotate annually) → the **editor's guide**, a Google Doc in the NUS-owned Drive. Never mentions git, the terminal, or a file path.
- **Maintainers** (whoever inherits the repo — likely a student, not a professional developer, possibly with no way to contact the original author) → **`MAINTENANCE.md`** at the repo root.

`MAINTENANCE.md` is the handover artifact. It is the difference between a successor who ships a fix in an afternoon and one who gives up and puts the site back on Wix. Treat it as a deliverable with the same weight as the code.

**Standing instructions — apply these without being asked:**

- When you **change the repo structure** (add, move, or rename a directory in `src/`), update the repo tour in `MAINTENANCE.md` in the same change.
- When you **add a recurring task** a maintainer will need to perform, add a runbook entry.
- When you **discover a non-obvious failure mode**, add it to the troubleshooting table or Landmines — whichever fits.
- When you **resolve a `_TODO_`** in `MAINTENANCE.md`, fill it in rather than leaving it for later. Those placeholders exist because the structure didn't exist yet at planning time; each one is a gap a future maintainer will fall into.
- When you **change or reverse a decision** in §8, update the log entry with the new reasoning. A decisions log that has quietly stopped being true is worse than no log at all.
- Bump **Last reviewed** at the top of `MAINTENANCE.md` on any edit.

Write `MAINTENANCE.md` for someone competent but unfamiliar, working alone, possibly at 11pm before a deadline. Explain *why*, not just *what* — a maintainer who doesn't know that `src/content/` *is* the website will treat it as disposable, and a maintainer who doesn't know why image paths are relative will "tidy" them and break every image without a single build error.

---

## 12. Phase 0 — build this first

**Riskiest assumption:** that a nursing exec with no technical background can publish a post from Pages CMS and see it live on the site without asking for help.

Everything else in this project is conventional static-site work. This one loop is the product. Validate it before writing a single component or making a single design decision.

The thinnest slice:

1. Define a `posts` collection in `src/content.config.ts` and mirror it in `.pages.yml`.
2. Scaffold Astro. Render a bare, unstyled index and `/news/[slug]` from the collection.
3. Deploy to Cloudflare Pages on a `.pages.dev` subdomain, building on push.
4. Install the Pages CMS GitHub App on the repo and invite a council member as an email collaborator.
5. **Hand it to a council member. Watch them publish a post. Say nothing.**

If they get stuck, the CMS choice is wrong and it's cheap to change now. If it works, the rest of the build is execution and the October deadline is realistic.

Do not skip step 5.

### Status — 2026-10-14

**Switched from Notion to Pages CMS** (decision 1). Steps 1 and 2 are **built and verified locally**: all MVP collections are defined in `src/content.config.ts` and `.pages.yml`, plus the index and `/news/[slug]`. Typecheck is clean and the build needs no environment variables. `npm run verify` passed against throwaway fixtures (since removed) covering:

- the cover and Markdown-body images were optimised to `/_astro/*.webp`;
- drafts stayed out;
- an external-link post got no page;
- the duplicate-slug, missing-description and `javascript:` link cases each dropped the bad value with a warning;
- blank optional fields parsed cleanly;
- an unprocessed `/src/…` image path made `verify` fail;
- a bad slug failed the build with a message that names the file and field.

**CI added 2026-10-13** (decision 16). `npm run verify` now also runs `tests/`: a contract test between `.pages.yml` and the schemas, and a build test against `tests/fixtures/content/`. Each was proven to catch a deliberate regression.

**Step 4 done 2026-10-14:** Pages CMS is installed, and the trial passed (§9).

**Step 3 done 2026-10-20:** the site is live at https://mcgill-nus.pages.dev, from a Cloudflare Pages project in the NUS-owned account (`nus.nursing@mail.mcgill.ca`), with the deploy-failure alert on. The whole loop (an email collaborator saves in Pages CMS → commit to `main` → Cloudflare build → live page) was tested end to end.

**Step 5: treated as done, by the user's decision on 2026-10-21.** This records a decision, not a session observed in this project: nothing here shows how a council member got on when publishing without help. The decision lifts this section's hold on building components and pages. The machine working is still not the same as the bet being validated, so record the session's findings here when there are some.
- **Where the council member hesitated:** _TODO. Note especially whether they missed the **Published** toggle (see §9, "Watch for in step 5")._

### Status — 2026-10-21

**The six informational pages are built** (branch `feature/info-pages`):

- **Routes.** One route file each: `src/pages/about/{index,fees,governance,ison,elections}.astro` and `src/pages/contact.astro`. Each only names its content file. `src/components/InfoPage.astro` renders the heading as the only `<h1>`, the search description as the meta description, and the text below. There is no catch-all route (decision 12a).
- **Nav.** Labels are in `src/config/nav.ts` and addresses in `src/config/routes.ts`. A plain nav in every header shows Home, About (Fees, Governance, ISoN, Elections) and Contact. The 404 page suggests the same top-level links.
- **Build-log notes**, never failures, from `src/lib/content.ts`:
  - a page last checked over a year ago;
  - one line listing pages never checked (all six today);
  - a filename-only alt text in a page's text, which `src/lib/image-alt.mjs` makes decorative, as in posts;
  - a page file with no route.
- **A missing page file** fails the build, naming the file.
- **Anchors.** `tests/redirects.test.mjs` checks that every `#anchor` redirect to one of the six pages matches a heading. `/nus-council-meetings` depends on Governance's *NUS Meeting Minutes* heading.
- **Found and fixed:** Astro adds its image stylesheet (the rule that keeps an image inside the column) only to pages that import `astro:assets`. A picture pasted into a page's text would have shown at full size. `src/layouts/Base.astro` now imports it for every page; the committee pages would have hit the same bug.

The page text is the Wix import, unedited. Rewording it is the council's job, in the CMS.

### Status — 2026-10-30

**The council roster, resources directory and Get Involved pages are built** (branch `feature/roster-resources-involved`). Those were the last MVP sections without pages, and they make the old Wix redirects to them land.

- **Routes.** `/about/council/`, `/resources/`, `/involved/`, and `/involved/<slug>/` for each committee without an external link (8 of 11; NPMP, VASC and Athletic link out). All four are in `src/config/routes.ts` and the nav.
- **Council term.** Site settings now says `2025-2026`, the council the club says still stands. `src/lib/settings.ts` reads Site settings and never fails the build. If the current term has no entries, `src/lib/council-term.mjs` shows the newest term that has some, and the heading always names the term shown. That was tested on the real content while the setting still said `2026-2027`.
- **Resource anchors are filenames,** so `/general-8` now redirects to `/resources/#student-mistreatment-policy`, and `tests/redirects.test.mjs` checks it.
- **Images.** 22 headshots and 10 committee logos, from the club's public Drive, shrunk (uploads went from 376K to 4.4M) with location data stripped. Each headshot was paired by the club's own Wix record, which holds the member's name and the photo's filename, then checked against the photo Wix showed. Two choices to confirm with the council:
  - the Drive has a second, different photo named after Sophie Bujold (striped shirt); the site uses the one Wix showed;
  - Wix showed a "Grad Committee 2025" logo that isn't on the Drive; the site uses the Drive's undated `Grad committee.png`.
- **Found and fixed:** Astro never enlarges an image, so a photo smaller than 400×500 kept its own shape. Rules in `CouncilMember.astro` and `CommitteeLogo.astro` now hold every photo to 4:5 and every logo to a square. Separately, a link pasted as its full address pushed two committee pages sideways on a phone; `Base.astro` now wraps long words.
- **Build-log notes**, never failures: an email that isn't an address, a resource link that isn't `https://` or a page on this site (including `//other-site`, which the CMS form allows, and `/<tab>/other-site`, which browsers read the same way), resource links never or long ago checked (all fifteen today), and committees with no short description (NPMP and VASC).

### Status — 2026-10-31

**The page structure was simplified further, rather than copied from Wix** (branch `structure/simplify`). The IA had already dropped Wix's catch-all "More" menu, merged three governance pages into one, and archived Sponsors, Calendar and the Note-Taking Club. Three more changes:

- **The homepage is the News tab.** No separate `/news/` list until posts outgrow the homepage. The nav is now News · About (Council, Fees, Governance, Elections) · Get involved · Resources · Contact. Decision 17's tabs cover the first four; Contact stays by choice.
- **No `/submit/` page.** The Wix listserv form was a Wix form, so it goes with Wix. `/listserv` redirects to Contact, which now says to email `nus.nursing@mail.mcgill.ca` instead of pointing at a form that no longer exists.
- **ISoN became two resources** (the school and the NGSA), and its old address redirects to the school's entry. The page's two "Academic Affairs Coordinator" emails were dropped: those roles aren't on the council (decision 12, updated).

Found on the way: five Wix redirects pointed at `/news/` or `/submit/`, which were never built, so they showed "Page not found". A new test in `tests/build.test.mjs` checks that every redirect to a fixed page lands on a built page.

**Still for the council:** the Elections page is titled "2026-2027 Elections" and opens with the Winter 2026 call, so it's already out of date, and the vacant-seat card links to it. The suggestion is a page that doesn't expire (how elections work, who to ask) with each year's call published as a post.

**Unrelated to code and more urgent than any of it:** `mcgillnus.ca` expires **2026-11-01**. See §9.
