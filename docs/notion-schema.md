# Notion Schema & Integration Contract

Notion is the CMS. These schemas are the contract between what execs edit and what the build expects. Changing a property name in Notion breaks the build — so the fetch layer must **validate the schema at build time and fail loudly with a human-readable message**, not throw a `TypeError` on `undefined.plain_text`.

## Setup

- One **NUS-owned** Notion workspace (free plan is sufficient). Not a personal one. See `migration-checklist.md`.
- One internal integration, token stored as `NOTION_TOKEN` in Netlify environment variables. Never committed.
- Each database must be explicitly shared with the integration — a common first-run failure that presents as an empty result set rather than an error.
- Database IDs in `NOTION_DB_*` env vars, or a committed `notion.config.ts` (IDs aren't secret; the token is).
- Pin the Notion API version explicitly in the client config so a server-side version bump can't silently change response shapes.

## Conventions used by every database

| Property | Type | Purpose |
|---|---|---|
| `Key` | Text | Stable identifier. `council-2026-alex-bilodeau`, `resource-well-office`. **Never change once published** — it's the basis of URLs and cross-references. |
| `Status` | Select: `Draft` / `Published` / `Archived` | Only `Published` is fetched. Everything else is invisible to the build. |
| `Order` | Number | Manual sort. Leave gaps (10, 20, 30) so items can be inserted without renumbering everything. |

**On `Key`.** The site is English-only, so on most databases `Key` has no immediate job — `Slug` handles URLs. Keep it anyway. It is one text column, and it is the join point a future translation would hang off (one row per language, grouped by `Key`). Retrofitting stable identifiers across eight populated databases after the fact is far more painful than carrying an unused column now. Do not remove it as a simplification.

Two databases use `Key` for real work rather than holding it in reserve, and there it is load-bearing rather than optional: **Pages** (§6) matches it against a route allowlist in the repo, and **Settings** (§8) uses it as the lookup name — so in Settings it is the Title property rather than a Text column. Changing a `Key` in either place breaks the thing it names.

---

## 1. Posts

Drives the homepage, the news index, and the email export. The most-used database — optimise its ergonomics over everything else.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Title` | Title | ✓ | |
| `Key` | Text | ✓ | |
| `Status` | Select | ✓ | |
| `Slug` | Text | ✓ | URL segment. Auto-suggest from title, but editable — execs will want `frosh-2026`, not `frosh-2026-sign-ups-are-now-open`. |
| `Published date` | Date | ✓ | Sort key. Not the Notion `created_time` — execs need to backdate and schedule. |
| `Summary` | Text | ✓ | 1–2 sentences. Used on cards, in OG description, and in the email preview. Enforce a soft length limit in the editor guide. |
| `Category` | Select | | `Announcement`, `Event`, `Opportunity`, `Governance`, `Newsletter` |
| `Cover image` | Files | | Optional. Must have `Cover alt`. |
| `Cover alt` | Text | | **Required if `Cover image` is set.** Validate at build; fail the item, not the build. |
| `Featured` | Checkbox | | Pins to the homepage featured-links block. Cap at 4 — warn in the build log if more are set. |
| `Author role` | Text | | e.g. "Director of Internal Affairs". **A role, not a person** — pages outlive people. |
| `External link` | URL | | If set, the card links out and no detail page is generated. Covers the "featured link to an Instagram post" case the current site handles by hand. |
| `Pinned until` | Date | | Optional. Keeps time-sensitive posts at the top, then lets them fall naturally. Solves the stale-featured-content problem structurally. |

**Body:** the Notion page content itself. Supported blocks: paragraph, heading 1–3, bulleted/numbered list, quote, callout, divider, image (with caption used as alt), bookmark, embed, code, table, toggle. Document the supported set in the editor guide; render unsupported blocks as a visible build warning, never silently drop them.

---

## 2. Council

| Property | Type | Required | Notes |
|---|---|---|---|
| `Name` | Title | ✓ | |
| `Key` | Text | ✓ | |
| `Status` | Select | ✓ | |
| `Term` | Select | ✓ | `2025-2026`, `2026-2027`. Drives current-vs-past. The annual rollover is: duplicate rows, change `Term`, update people. |
| `Council` | Select | ✓ | `Executive` / `General` |
| `Role` | Text | ✓ | |
| `Program` | Text | | `U3 BScN`, `U2 BNI Online` |
| `Email` | Email | | |
| `Photo` | Files | | Optional — must degrade to a placeholder. |
| `Role description` | Text | | 1–3 sentences. |
| `Fun fact` | Text | | Keep this. It's why students read the page. |
| `Vacant` | Checkbox | | Renders a "position open" card linking to Elections instead of a person. Better than a row named "VACANT". |
| `Order` | Number | ✓ | Executive order is meaningful (President first); alphabetical is wrong. |

**Design note:** 23 members, variable-length bios, some without photos, one vacant. The layout must survive all of that.

---

## 3. Resources

| Property | Type | Required | Notes |
|---|---|---|---|
| `Title` | Title | ✓ | |
| `Key` | Text | ✓ | |
| `Status` / `Order` | | ✓ | |
| `Category` | Select | ✓ | `Academic`, `Financial`, `Wellbeing & Safety`, `Clinical & Professional`, `Governance` |
| `Description` | Text | ✓ | One paragraph. |
| `Link` | URL | ✓ | |
| `Link label` | Text | | Defaults to "Learn more". |
| `Internal` | Checkbox | | True for links to our own pages (e.g. mistreatment policy). |
| `Last verified` | Date | | **Surface this in the build log.** Anything unverified for over a year gets flagged. Link rot is how a resource directory dies, and this makes decay visible instead of invisible. |

Consider a build-time link checker that reports 404s rather than failing — a broken external link shouldn't block a deploy, but nobody should have to discover it by accident.

---

## 4. Committees

| Property | Type | Required | Notes |
|---|---|---|---|
| `Name` | Title | ✓ | |
| `Key` / `Status` / `Order` | | ✓ | |
| `Slug` | Text | ✓ | |
| `Short description` | Text | ✓ | Card copy. |
| `Logo` | Files | | Card image. |
| `Logo alt` | Text | | Required if logo set. |
| `External link` | URL | | If set, the card goes off-site and no detail page is built (CNSA, NPMP, VASC). |
| `Instagram` | URL | | Several committees run their own accounts. |
| `Contact email` | Email | | |
| `Accepting members` | Checkbox | | Drives a "recruiting" badge — directly serves the "give students an opportunity to be involved" goal. |

Body = the detail page.

---

## 5. Electives *(fast-follow — don't build until the data is confirmed)*

| Property | Type | Notes |
|---|---|---|
| `Course code` | Title | e.g. `NUR1 300` |
| `Course title` | Text | |
| `Key` / `Status` | | |
| `Credits` | Number | |
| `Term offered` | Multi-select | `Fall`, `Winter`, `Summer` |
| `Faculty` | Select | Nursing, Arts, Science, Management… |
| `Level` | Multi-select | Which years can take it |
| `Prerequisites` | Text | |
| `Description` | Text | |
| `Tags` | Multi-select | `Light workload`, `No final`, `Group project`, `Bird course` — whatever taxonomy the council agrees on |
| `Notes from students` | Text | Curated by the Director of Academics, **not** user-submitted. UGC is out of scope. |
| `Last updated` | Date | Course offerings change; stale advice here is actively harmful. |

Rendered as a client-side filterable table (one Astro island). Filters: term, faculty, credits, tags. Plus free-text search. Must work without JavaScript as a plain sorted table — some students browse on poor connections in clinical placements.

---

## 6. Pages

Backs the six informational pages. Without this database they would be hardcoded prose, and the pages most likely to go stale — Elections is date-bound and annual, Fees changes by referendum, ISoN needs checking against mcgill.ca — would need a developer to change. That is the incumbent site's failure mode, reproduced.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Title` | Title | ✓ | Rendered as the page heading. |
| `Key` | Text | ✓ | **This is the route join.** One of exactly: `page-about`, `page-fees`, `page-governance`, `page-ison`, `page-elections`, `page-contact`. Never change once published — the repo matches on it. |
| `Status` | Select | ✓ | |
| `Meta description` | Text | ✓ | Per-page SEO. Every page needs a unique one — see `information-architecture.md`. |
| `Last reviewed` | Date | | Surface in the build log the same way `Resources.Last verified` is. Anything unreviewed for over a year gets flagged. Informational pages decay silently; this makes it visible. |

**Body:** the Notion page content, same supported block set as Posts.

**Routing lives in the repo, not here.** Each of the six has an explicit route file under `src/pages/`, which fetches its content by `Key` from an allowlist in `src/config/`. There is no catch-all route and execs cannot create new pages. This is deliberate: it keeps file path equal to URL, and it means an editor can change what a page *says* without being able to change where it *is* or break the nav. Adding a seventh page is a code change — small, but a developer's job.

**Degradation.** These six URLs must always exist:

| Situation | Behaviour |
|---|---|
| `Key` resolves live | Render normally. |
| Missing live, present in committed cache | Render from cache, log a loud warning naming the key. |
| Missing from both | Render the page shell with its title and a brief "this page is being updated" notice. Log an error. **Do not fail the build.** |

The last row matters because the likeliest cause is an exec setting `Status: Draft` by accident. A site missing one page beats a site missing every page.

**What must never move into this database:** the Land Acknowledgement and the Commitment to Truth & Reconciliation. Both are verbatim texts (`PRODUCT.md` → Brand Commitments) that must not be edited, paraphrased, or "improved." They live as constants in `src/config/`. Putting them in Notion would hand every future exec an edit button on text that must not change.

---

## 7. Gallery

The event photo library is the strongest asset the club has. Without a database it would be ~14 files committed once and frozen at launch.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Title` | Title | ✓ | Internal label for the editor's benefit. Not rendered. |
| `Key` | Text | ✓ | |
| `Status` | Select | ✓ | |
| `Order` | Number | ✓ | |
| `Image` | Files | ✓ | |
| `Alt` | Text | ✓ | **Validate at build; fail the item, not the build** — same rule as `Cover alt`. |
| `Caption` | Text | | Optional, rendered. |
| `Term` | Select | | `2026-2027` etc. Lets the homepage show recent photos and lets older ones age out by filter rather than by deletion. |

---

## 8. Settings

Key-value store for facts about the club that appear site-wide. Stops the footer, the office hours, and the social links from being developer-only.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Key` | Title | ✓ | `office-address`, `office-hours`, `contact-email`, `instagram-url`, `tiktok-url`, `facebook-url`, `linkedin-url` |
| `Value` | Text | ✓ | |
| `Notes` | Text | | Guidance for the editor — what this value is used for and where it appears. |

**This database degrades rather than validates, and that is the opposite of every other database here.** A missing, renamed, or blank key falls back to a repo-side default in `src/config/` and logs a warning. It never fails an item and never fails the build. The reasoning: a stale office-hours string is a nuisance on one page, whereas strict validation on a value used in the footer would take down every page on the site.

**Boundary — guard this against drift.** Settings holds facts about the club. It does not hold labels, button text, or nav copy; those stay in `src/config/` under decision 6 in `CLAUDE.md`. The test: if changing the value changes what a control *says*, it belongs in the repo. If it changes what the club *is*, it belongs here.

---

## Fetch layer requirements

1. **Fetch everything at build time.** No runtime Notion calls.
2. **Normalise into typed objects.** No Notion API shapes past the fetch boundary — `post.title`, not `page.properties.Title.title[0].plain_text`.
3. **Write `.cache/notion/*.json` and commit it.** On API failure, log a prominent warning and build from cache. A stale site beats a broken one.
4. **Download all images to `src/assets/notion/`** and pass through `astro:assets`. Notion file URLs are signed and expire in roughly an hour. Never emit one into HTML.
   - Cache key must be the S3 object path with the query string **stripped** — Notion re-signs the URL on every fetch, so keying on the full URL re-downloads everything every build.
   - The committed `.cache/notion/*.json` must store **local asset paths, not Notion URLs**. Otherwise the fallback build resolves images to signatures that expired months ago, and the resilience mechanism defeats itself.
   - Handle `external`-type files too (images pasted as a URL rather than uploaded). They don't expire, but they hotlink a third-party server.
   - **Acceptance test:** after a production build, `grep -r "amazonaws.com\|notion-static\|prod-files-secure" dist/` must return nothing. Wire this into CI. This failure mode passes every launch-day check and surfaces a week later as broken images with no obvious cause.
5. **Validate schemas.** If a required property is missing or renamed, fail with `Posts DB: expected property "Published date", found none. Did someone rename it?` — a message an exec could act on.
   - **Two databases are exempt from failing.** `Pages` degrades per the table in §6 (cache → placeholder shell) because its six URLs must always exist. `Settings` degrades to repo defaults per §8 because its values appear on every page. Both still log loudly. Everything else fails as described above.
6. **Handle pagination.** The Notion API returns 100 results per page. The Electives DB will exceed that.
7. **Handle rate limits.** ~3 requests/second. Block children fetches for many pages will hit this; add throttling and retry with backoff.
8. **Log a content summary each build:** counts per database, resources unverified for over a year, **informational pages unreviewed for over a year**, **any page served from cache or rendered as a placeholder**, **any Settings key that fell back to a repo default**, gallery items dropped for missing `Alt`, and posts with >4 `Featured`.

---

## Editor's guide

Ships as a Notion page in the same workspace, written for a nursing student with no technical background. Cover:

- How to write and publish a post, with screenshots
- What each `Status` value does
- Which Notion blocks are supported
- Why alt text is required
- The "Publish now" link and why changes take a couple of minutes
- **How to edit one of the six informational pages** — and why the `Key` must not be touched
- **How to add a photo to the homepage gallery**
- **How to update the office hours, address, and social links** in Settings
- The annual council rollover, step by step
- Who to contact when something breaks

This is a deliverable, not documentation. It is the difference between a site that survives handover and one that doesn't.
