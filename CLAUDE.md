# McGill NUS Website — Project Context

> Read this file first, every session. For deeper detail, load the file named in each section.
> Related docs: `MAINTENANCE.md`, `docs/content-inventory.md`, `docs/information-architecture.md`, `docs/notion-schema.md`, `docs/design-brief.md`, `docs/migration-checklist.md`

---

## 1. What we're building

A public website for the **McGill Nursing Undergraduate Society (NUS)**, the student-run representative body for undergraduates at McGill's Ingram School of Nursing (ISoN). It replaces an aging Wix site at `nusnursing.wixsite.com/website` (live on the club's domain, `mcgillnus.ca`).

The current site fails in three specific ways, and every design decision below traces back to one of them:

1. **It goes stale.** Sponsors content is two years old and signed by a coordinator who has left. The calendar says "2024-2025." The Note-Taking Club hosts notes from 2018. Nobody updates it because updating it is a chore.
2. **There's no reason to return.** It's a static brochure. The homepage has an empty "Events & Announcements" module and an ad-hoc "LINKS" block that is, in effect, a hand-maintained newsletter — the club is already trying to do the thing this rebuild should make easy.
3. **It's not a useful resource.** The single most-wanted piece of information — which electives to take — is a PDF behind a Google Drive link.

**The core bet:** if a non-technical nursing exec can publish an update in under five minutes from a tool they already use, the site stays alive after the person who built it graduates. Everything else is secondary to that.

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
- ❌ **User accounts / login on the public site.** Resources stay public; publishing is controlled by Notion workspace permissions, not by site auth. This keeps the build fully static.
- ❌ **Comments, forums, ratings, or any user-generated content.** Deferred past MVP by explicit decision — it carries a moderation burden the council cannot sustain.
- ❌ **Self-hosted email sending / subscriber list management.** See §6. The club already has a McGill listserv; building a parallel list invites CASL compliance problems.
- ❌ **A database, backend server, or serverless functions.** The output is static files. If a feature seems to need a server, escalate rather than adding one.
- ❌ **Re-implementing Google Drive.** Minutes, textbook PDFs, and financial-aid documents stay as Drive links. Do not build a file manager.
- ❌ **The mistreatment reporting form.** Stays on McGill's Microsoft Forms. Sensitive reports must not route through student-run infrastructure. Link out only.
- ❌ **E-commerce, ticketing, merch checkout.** Link to whatever external tool the council is already using.
- ❌ **A CMS admin UI of our own.** Notion *is* the admin UI. Do not build a dashboard.

---

## 4. Architecture

```
Notion workspace (NUS-owned)          ← execs write here
  ├── Posts DB          (news / newsletter)
  ├── Council DB        (roster, filtered by term)
  ├── Resources DB      (student services directory)
  ├── Committees DB     (get-involved cards + detail)
  ├── Pages DB          (the six informational pages, fixed routes)
  ├── Gallery DB        (homepage event photos)
  ├── Settings DB       (address, office hours, social links)
  └── Electives DB      (course data → filterable table)
          │
          │  @notionhq/client, at BUILD TIME only
          ▼
  Astro site (static)   ← this repo
    - fetches Notion → normalises → writes .cache/notion/*.json
    - downloads Notion images → local, processed by astro:assets
    - renders all routes
          │
          ▼
  Netlify (static host)  ← free tier
    - build on git push
    - build on cron (12h)
    - build on deploy-hook URL  ← "Publish now" link, saved in Notion
          │
          ▼
  mcgillnus.ca (GoDaddy registrar, GoDaddy DNS)
```

### Key flows

**Publishing.** An exec edits a Notion page and sets `Status: Published`. Either they wait for the next scheduled rebuild, or they click a "Publish now" bookmark in Notion that hits the Netlify deploy hook. Site rebuilds in ~1–2 min. There is no other publishing path.

**Build-time resilience.** Every Notion fetch is written to `.cache/notion/*.json`, and that cache is **committed to the repo**. If the Notion API is down, the token has expired, or a database was accidentally deleted, the build falls back to cache and emits a loud warning rather than failing. A club site must survive neglect; a red build on a Tuesday in three years is a site that stays broken.

**Images.** Notion's file URLs are signed S3 links that expire in about an hour. They must be downloaded at build time and passed through Astro's image pipeline. Never emit a Notion URL into the HTML — this is the single most common way this architecture breaks silently a week after launch.

**English only.** The site ships in English. French is not in scope — see §3. The `Key` property is nonetheless retained on every Notion database (see `docs/notion-schema.md`): it costs one unused column now and is the difference between adding French later being a content job versus a migration.

---

## 5. Tech stack

### MVP dependencies

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** | Content-first, ships zero JS by default, islands available for the one interactive feature (electives table). Also has first-class i18n routing if French is ever added. |
| Content source | **Notion API** (`@notionhq/client`) | Chosen over a git-based CMS because editors are non-technical nursing students; Notion is a tool they already use and requires no GitHub account. |
| Notion → HTML | `notion-to-md` **or** a hand-rolled block renderer | Evaluate at setup. Hand-rolled gives control over callouts/columns; the library is faster to ship. Prefer the library for MVP unless block coverage is inadequate. |
| Styling | **Tailwind CSS** | Design direction comes from the `impeccable` plugin — see `docs/design-brief.md`. Do not invent a visual language here. |
| Host | **Netlify** free tier | Decisive factor: apex-domain support via an A record works with GoDaddy DNS unchanged, so no nameserver migration and no club approval needed. Also gives deploy hooks and scheduled builds. |
| Forms | External embeds / links | Microsoft Forms and Google Forms already in use. Netlify Forms (100/mo free) is acceptable for the simple contact form if an embed looks bad. |
| Package manager | npm | No reason to add a tool a successor won't recognise. |

### Deferred to later phases

- Email service provider (MailerLite or Buttondown) — only if §6 fast-follow is greenlit
- Search (Pagefind — trivially added to Astro, but not MVP)
- Analytics (Plausible free tier is not free; Cloudflare Web Analytics is)

### Standing note on versions

Verify every package against current docs at setup time. `@notionhq/client`'s API version header moves; do not trust versions recalled from memory. Pin the Notion API version explicitly in the client config.

---

## 6. The newsletter decision (read before building this)

The requirement was "one post publishes to the web and generates the email." Splitting that in two:

**MVP — web + a copy-pasteable email version.** A published post renders at `/en/news/[slug]` and also at `/en/news/[slug]/email`, which outputs email-safe inlined HTML the exec copies into the existing McGill listserv (`nus.nursing@mail.mcgill.ca`). Distribution stays on infrastructure McGill already runs.

**Why not a real ESP for MVP.** Running an independent mailing list means collecting consent, honouring unsubscribes, and keeping records — CASL obligations that fall on a rotating student council. The McGill listserv already reaches the entire student body, which is the actual audience. Building subscriber management would add the most compliance risk of anything in this project for the least marginal reach.

**Fast-follow, if the club wants it:** MailerLite free tier (1,000 subscribers), triggered by a build step. Revisit only after the site is live and the council has asked for it.

---

## 7. Features by phase

### MVP — must ship by October

- `[MVP]` **Homepage as newsletter:** latest post in full or as a lead card, recent posts below, featured links block, land acknowledgement.
- `[MVP]` News/post system from Notion: index, detail pages, dates, author (role, not person), optional cover image.
- `[MVP]` **Council roster** from Notion, filtered to the current term. Executive and General Council sections, photo/name/program/role/fun fact/email per member. Handles a VACANT row gracefully.
- `[MVP]` **Resources directory** from Notion — the 15 existing entries, grouped by category, each with title, description, outbound link.
- `[MVP]` Get Involved: committee/club cards from Notion, with detail pages for the ones that have real content.
- `[MVP]` **Informational pages from Notion:** About, Fees, Governance (Constitution & By-Laws), ISoN, Elections, Contact. Content comes from the Pages DB; the six routes are a fixed allowlist in the repo. Execs edit what a page says, never where it lives. See decision 12.
- `[MVP]` **Homepage photo gallery** from the Gallery DB, so the event photo library doesn't freeze at launch.
- `[MVP]` **Site settings from Notion:** office hours, address, contact email, social links. Degrades to repo defaults, never fails a build.
- `[MVP]` Contact page: office info, address, email, link to council roster, contact form.
- `[MVP]` 301 redirects from all old Wix URLs (see `docs/information-architecture.md`).
- `[MVP]` Accessibility baseline: semantic HTML, WCAG AA contrast, keyboard nav, alt text enforced at the Notion schema level.
- `[MVP]` **Editor's guide**, written in Notion, in plain language, for the incoming exec.

### Fast-follow — after launch, before end of term

- `[Fast-follow]` **Electives explorer:** filterable/searchable table from the Electives DB. Highest-value feature for students; deferred only because the source data needs cleanup first.
- `[Fast-follow]` Email export view (`/news/[slug]/email`).
- `[Fast-follow]` Past councils (same Notion DB, filtered by a different term — nearly free once the roster exists).
- `[Fast-follow]` Meeting minutes index (links to Drive folders by term).
- `[Fast-follow]` Events / calendar — **only if** a council member commits in writing to maintaining it. The current one died in 2024.
- `[Fast-follow]` Site search via Pagefind.

### Later

- `[Later]` ESP integration with a real subscriber list.
- `[Later]` Instagram feed. The existing embed is fragile and Meta's free options are unreliable; a manually curated photo grid from Notion may serve better.
- `[Later]` Any user-generated content: elective reviews, Q&A, comments. Requires a moderation plan first.
- `[Later]` **French translation of the site.** Out of scope now, but the likeliest thing to come back given the Quebec context and the club's own EN-FR dictionary project. The `Key` property and Astro's i18n routing keep the door open; adding it later is a content and routing job, not a rebuild.
- `[Later]` Note-Taking Club archive. Content is from 2018–19; confirm it's worth migrating at all.

---

## 8. Key decisions log

| # | Decision | Rationale |
|---|---|---|
| 1 | Notion as CMS, not a git-based CMS | Editors are non-technical and rotate annually; requiring a GitHub account per exec is a handover failure waiting to happen. |
| 2 | Astro, static output, no server | Free hosting, no runtime to maintain, nothing to patch. A static site left alone for two years still works. |
| 3 | Netlify over Cloudflare Pages | Apex domain works via A record with GoDaddy DNS unchanged — no nameserver migration, no club approval. **Escape hatch:** if the 300 build-min/month cap binds, move to Cloudflare Pages and migrate DNS then. |
| 4 | Committed Notion cache, build never hard-fails | Guards against expired tokens, API changes, and deleted databases years from now. |
| 5 | English only; no French for MVP | Removed from scope by the client. Cuts roughly a third of the build and all translation-commissioning work before an October deadline. |
| 5a | `Key` property kept anyway | One unused column is cheap insurance. Without it, adding French later means reissuing identifiers across every database and every URL. |
| 6 | UI strings in repo JSON, not Notion | Nav labels and button text shouldn't require a rebuild-through-Notion round trip, and execs shouldn't be able to break navigation. **Facts about the club** — address, office hours, social handles — are not UI strings and live in the Settings DB (decision 12). The test: if changing it changes what a control *says*, it's a UI string; if it changes what the club *is*, it's content. |
| 7 | Newsletter email = copy-paste export, not an ESP | Avoids CASL obligations on a rotating student council; McGill's listserv already reaches the full audience. |
| 8 | Mistreatment form stays on Microsoft Forms | Sensitive disclosures must not pass through student-run infrastructure. |
| 9 | Council term as a DB property, not a new database per year | Makes "Past Councils" free and makes the annual rollover a filter change instead of a migration. |
| 10 | Everything (repo, Notion, Netlify) must end up NUS-owned | Personal accounts are the single most common way a club site dies. See `docs/migration-checklist.md`. |
| 11 | Sponsors, Note-Taking Club, and Calendar all archived — not migrated, not rewritten | Confirmed 2026-08-03. Each was stale in a way no rewrite fixes: Sponsors is bound to a departed coordinator and 2024 events, NTC is seven years old, the Calendar has no owner. Cutting all three removes the site's three worst staleness liabilities before launch rather than after. |
| 12 | Informational pages, the homepage gallery, and site settings all come from Notion — not hardcoded | Decided 2026-08-03. **Reverses the earlier "static informational pages" wording in §7.** Leaving About, Fees, Governance, ISoN, Elections, and Contact in the repo would mean the pages that change most predictably — Elections annually, Fees by referendum, ISoN whenever McGill's page moves — need a developer nobody is guaranteed to have. That is failure mode #1 from §1, rebuilt on purpose. The infrastructure cost is near zero: three database definitions reusing the fetch, cache, and image pipeline that Posts already requires. |
| 12a | Page routes are a fixed allowlist in the repo; execs cannot create pages | Keeps decision 6's boundary intact. Editors change what a page *says*; they cannot change a URL, orphan a page outside the nav, or 404 their own work with a slug typo. File path still equals URL, so the `MAINTENANCE.md` repo tour stays true. Adding a seventh page is a small code change, deliberately. |
| 13 | The Land Acknowledgement and Truth & Reconciliation statement stay in the repo, not Notion | Both are verbatim texts that must not be edited, paraphrased, or "improved." Everything else on this list moved *into* Notion to make it editable; these two are excluded for exactly that reason. Putting them in the Pages DB would give every future exec an edit button on text that must not change. |

---

## 9. Open questions — do not invent answers

- ~~**To decide:** Which content gets cut.~~ **Resolved 2026-08-03:** Sponsors, Note-Taking Club, and Calendar are all archived. See §8 decision 11.
- ~~**To confirm:** Access to the original logo files and a photo asset folder.~~ **Resolved 2026-08-03:** both confirmed in hand — vector logo originals and the event photo library. Design may commit to real imagery.
- **To decide:** Whether the NUS has, or will create, an organisation-owned GitHub account and Notion workspace. Build proceeds on personal accounts; transfer is a launch blocker, not a nice-to-have.
- **To decide:** Whether an exec will commit *in writing* to maintaining an events calendar. Decision 11 archives the dead 2024–25 page; it does not authorise a replacement. Still governed by §7 — if nobody owns it, don't build it.
- **To confirm:** That the council is content shipping English-only, given the Quebec context and that some BNI content and the club's own dictionary project are francophone-facing. Not a blocker — just make sure it's a decision they've made rather than one they inherit.
- **To confirm:** That the club can use the McGill listserv for newsletter distribution as described in §6.
- **To confirm:** Source and shape of the electives data before building the explorer.

---

## 11. Documentation upkeep — standing rules

Two audiences, two documents, and they must not be merged:

- **Editors** (council members, non-technical, rotate annually) → the **editor's guide**, written in Notion. Never mentions git, the terminal, or a file path.
- **Maintainers** (whoever inherits the repo — likely a student, not a professional developer, possibly with no way to contact the original author) → **`MAINTENANCE.md`** at the repo root.

`MAINTENANCE.md` is the handover artifact. It is the difference between a successor who ships a fix in an afternoon and one who gives up and puts the site back on Wix. Treat it as a deliverable with the same weight as the code.

**Standing instructions — apply these without being asked:**

- When you **change the repo structure** (add, move, or rename a directory in `src/`), update the repo tour in `MAINTENANCE.md` in the same change.
- When you **add a recurring task** a maintainer will need to perform, add a runbook entry.
- When you **discover a non-obvious failure mode**, add it to the troubleshooting table or Landmines — whichever fits.
- When you **resolve a `_TODO_`** in `MAINTENANCE.md`, fill it in rather than leaving it for later. Those placeholders exist because the structure didn't exist yet at planning time; each one is a gap a future maintainer will fall into.
- When you **change or reverse a decision** in §8, update the log entry with the new reasoning. A decisions log that has quietly stopped being true is worse than no log at all.
- Bump **Last reviewed** at the top of `MAINTENANCE.md` on any edit.

Write `MAINTENANCE.md` for someone competent but unfamiliar, working alone, possibly at 11pm before a deadline. Explain *why*, not just *what* — a maintainer who doesn't know why `.cache/notion/` is committed will delete it, and a maintainer who doesn't know why images are downloaded locally will "simplify" the fetch layer and break the site an hour after their next deploy.

---

## 12. Phase 0 — build this first

**Riskiest assumption:** that a nursing exec with no technical background can publish a post from Notion and see it live on the site without asking for help.

Everything else in this project is conventional static-site work. This one loop is the product. Validate it before writing a single component or making a single design decision.

The thinnest slice:

1. Create one Notion database — `Posts` — with the minimum fields: `Title`, `Key`, `Slug`, `Status`, `Body`.
2. Scaffold Astro. Fetch that database at build time. Render a bare, unstyled `/en/news/[slug]`.
3. Deploy to Netlify on a `.netlify.app` subdomain.
4. Create a deploy hook. Save it as a link in Notion labelled "Publish now."
5. **Hand it to a council member. Watch them publish a post. Say nothing.**

If they get stuck, the CMS choice is wrong and it's cheap to change now. If it works, the rest of the build is execution and the October deadline is realistic.

Do not skip step 5.
