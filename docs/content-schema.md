# Content Schema & Editing Contract

All site content lives **in this repo**, as Markdown, YAML and JSON files under `src/content/`, with images in `src/assets/uploads/`. Council editors change those files through **Pages CMS**, a free hosted editor at `app.pagescms.org`. They never see a file, a path or a commit. Every Save in the CMS is a commit to `main`, and Cloudflare Pages rebuilds the site on every commit.

Until 2026-10-11 the plan was Notion. That changed. See `CLAUDE.md` decision 1 for the reasons.

## The contract has two halves, and they must match

| File | Audience | What it does |
|---|---|---|
| `.pages.yml` | Editors (via Pages CMS) | Defines the forms: field labels, help text, required fields, patterns, which entries can be created or deleted. |
| `src/content.config.ts` | The build | Validates the same fields with Zod and hands typed data to the pages. |

**Field names must be identical in both.** A field present in one and not the other is either invisible to editors or silently ignored by the site. Worse, Pages CMS rewrites a file from its form on every save (`settings.content.merge` defaults to `false`), so a field the build needs but the form lacks is **deleted** the next time an editor saves. `tests/cms-contract.test.mjs` fails CI on any mismatch in names, required fields or select options.

**The rule that governs every schema: never be stricter than the CMS form.** A schema error fails the build. Cloudflare then keeps serving the previous deploy, so the site stays up, but the exec's change silently doesn't appear and they can't see why. So anything the form lets an editor save must build. Softer problems are handled in `src/lib/content.ts`, which drops the one bad value, logs a warning, and publishes everything else:

- a cover image with no description (the image is dropped, the post publishes);
- a link that doesn't start with `http(s)://` (the link is dropped; this also blocks `javascript:` links);
- two posts with the same web address (the older one is dropped).

## Setup

- The **Pages CMS GitHub App** is installed on this repo by the **NUS-owned GitHub account**, never a personal one. Whoever installs it controls who can edit.
- Council editors are added as **collaborators by email** in Pages CMS, and must sign in that way. They need **no GitHub account**. A collaborator's save is written by the Pages CMS app, which the "Protect main" ruleset exempts; a GitHub sign-in writes as that person, and is blocked. Collaborators can edit content and media; they cannot touch `.pages.yml` or manage other collaborators.
- **The collaborator list lives in Pages CMS's own database, not in this repo.** Keep a copy of who has access in `MAINTENANCE.md` → Access inventory.
- No API tokens, no environment variables. The build needs no secrets.

## Conventions used everywhere

| Convention | Rule | Why |
|---|---|---|
| **Filename = key** | Each entry's filename is set once when it's created and can't be renamed in the CMS (`operations: rename: false`). The build uses it as the entry's permanent id. | This is what decision 5a's `Key` property was for. In a file-based system the filename does the job for free, so there is no separate `Key` field for editors to fill in and accidentally change. A future French version would sit alongside as `fr/<same filename>`. |
| **Slug = URL** | `slug` ("Web address" in the CMS) is editable and validated as lowercase letters, numbers and hyphens. | URLs can change when they need to; keys can't. |
| **Published toggle** | Posts default to `published: false`; council, resources and committees default to `true`. Unpublished entries are invisible to the build. | Posts get drafted; reference entries mostly don't. |
| **Order** | A number; lower comes first. Leave gaps (10, 20, 30). | Insert without renumbering. |
| **Image paths are relative** | The CMS writes `../../assets/uploads/<file>`. Every content file that can hold an image sits exactly two folders below `src/` (`src/content/<collection>/<file>`). | Astro only optimises a Markdown-body image if its path is relative. A path starting with `/` ships unresized, or broken. `npm run verify` fails if one reaches `dist/`. |
| **Blank means absent** | An optional field saved as `""` or `null` is treated as not set. | The CMS can write either for a field nobody touched. |
| **Optional dates start empty** | Every optional `date` field in `.pages.yml` sets `default: ""`. | Otherwise Pages CMS fills it with today's date on every new entry: a post arrives "pinned until today" and a resource "verified today" with no one having checked. Found in the trial (2026-10-14); the contract test enforces it. |
| **Images in body text are decoration** | An image pasted into a rich-text body whose alt text is only a filename gets `alt=""`, and the build log names the post or page. Covers and logos, which have a required description field, are unaffected. | Pages CMS's editor sets every pasted image's alt text to its filename (`image.png`) and gives editors no way to change it, so a screen reader would read the filename aloud. Empty alt marks the image decorative, so it gets skipped. Done in `src/lib/image-alt.mjs` (found 2026-10-20); `tests/build.test.mjs` enforces it. The field help text in `.pages.yml` tells editors to put the photo that matters in Cover image, and to write any information a picture holds in the text too. |

---

## 1. Posts — `src/content/posts/<slug>.md`

Drives the homepage, the news index and, later, the email export. The most-used collection, so its ergonomics matter more than any other's.

| Field | CMS label | Type | Required | Notes |
|---|---|---|---|---|
| `title` | Title | string | ✓ | |
| `published` | Published | boolean | | Default `false`. |
| `date` | Date | date | ✓ | Sort key. Editors can backdate or schedule. |
| `slug` | Web address | string | ✓ | `/news/<slug>/`. The filename is taken from it on creation and then fixed. |
| `summary` | Summary | text | ✓ | 1–2 sentences. Cards, meta description, email preview. |
| `category` | Category | select | | `Announcement`, `Event`, `Opportunity`, `Governance`, `Newsletter` |
| `cover` | Cover image | image | | |
| `coverAlt` | Cover image description | string | | **Needed if `cover` is set.** Without it the cover is dropped with a warning; the post still publishes. |
| `featured` | Featured on the homepage | boolean | | Cap of 4, to be warned on once the homepage block exists. |
| `authorRole` | Written by (role) | string | | **A role, not a person.** Pages outlive people. |
| `externalLink` | Link somewhere else instead | string | | If set, the card links out and **no detail page is built**. Must be `http(s)`. |
| `pinnedUntil` | Keep at the top until | date | | Pinned posts sort first until this date. **It is checked at build time**, so a pin expires at the first build after the date, which in practice means the next Save of anything. |
| *(body)* | Post | rich text → Markdown | | Images pasted here are decorative; see *Images in body text are decoration* above. |

## 2. Pages — `src/content/pages/{about,fees,governance,elections,contact}.md`

The five informational pages. Without this collection they would be hard-coded prose. The pages most likely to go stale (Elections is annual, Fees changes by referendum) would then need a developer, which is the incumbent site's failure mode all over again.

| Field | CMS label | Type | Required | Notes |
|---|---|---|---|---|
| `title` | Page heading | string | ✓ | |
| `metaDescription` | Search engine description | text | ✓ | Unique per page. |
| `lastReviewed` | Last checked | date | | **Surfaced in the build log.** A page last checked more than a year before the build gets a warning naming it. One summary line lists every page never checked (blank, `null` and missing all count). Neither fails the build. Done in `src/lib/content.ts`. |
| *(body)* | Page content | rich text → Markdown | | Images pasted here are decorative; see *Images in body text are decoration* above. Headings become anchors; see below. |

**The filename is the route join.** `about.md` serves `/about/`, `fees.md` serves `/about/fees/`, and so on (see `information-architecture.md`). Each route file (`src/pages/about/fees.astro` and the rest) only names its file: `<InfoPage name="fees" />`. `src/components/InfoPage.astro` renders the rest:

- `title` as the page's only `<h1>`, and in the browser tab as `<title> — McGill NUS`;
- `metaDescription` as the meta description;
- the body below the heading.

In `.pages.yml` this collection has `create`, `rename` and `delete` all switched off, so editors change what a page *says* and cannot add, remove or move one. That is decision 12a, enforced by configuration rather than code. Adding a seventh page is a developer's job; see `MAINTENANCE.md` → *Adding a new page*. A file here with no route isn't published, and the build log says so.

**All five files always exist.** The CMS can't delete one, and `tests/cms-contract.test.mjs` checks they are all there. If one goes missing anyway, the build fails with a message naming the file. Since 2026-10-21 they hold the old Wix site's text, word for word.

**Headings are link targets.** Astro gives each heading an id made from its text: `## NUS Meeting Minutes` becomes `#nus-meeting-minutes`. The old Wix address `/nus-council-meetings` redirects to that anchor on Governance, so renaming that heading quietly sends visitors to the top of the page instead. `tests/redirects.test.mjs` fails if any `#anchor` redirect to one of the six pages no longer matches a heading.

**What must never go in this collection:** the Land Acknowledgement and the Commitment to Truth & Reconciliation. Both are verbatim texts (`PRODUCT.md` → Brand Commitments) and live as constants in `src/config/`, which is never exposed in `.pages.yml`. Decision 13.

## 3. Council — `src/content/council/<term>-<role>.yml`

| Field | CMS label | Type | Required | Notes |
|---|---|---|---|---|
| `role` | Role | string | ✓ | |
| `term` | Term | string | ✓ | `2026-2027`. Pattern-checked. |
| `council` | Council | select | ✓ | `Executive` / `General` |
| `vacant` | Position is vacant | boolean | | Renders a "position open" card linking to Elections. |
| `name` | Name | string | | Optional because of `vacant`. |
| `program` | Program | string | | `U3 BScN`, `U2 BNI Online` |
| `email` | Email | string | | Keep the `{role}.nus@mail.mcgill.ca` convention. A bare address or `mailto:` link; anything else is dropped with a build-log warning. |
| `photo` | Photo | image | | Optional; no photo means no image, not a placeholder. Shown cropped to 4:5 whatever its shape. Its alt text is empty, because the name beside it already says who it is. |
| `roleDescription` | What this role does | text | | 1–3 sentences. |
| `funFact` | Fun fact | text | | Keep this. It's why students read the page. |
| `order` | Order | number | ✓ | Executive order is meaningful (President first). |
| `published` | Show on the site | boolean | | Default `true`. |

**Keyed by term and role, never by person.** The site shows the term named in Site settings → `currentTerm`. Past councils are the same collection filtered by a different term.

**The page never goes empty.** If `currentTerm` has no published entries (an exec switched it before entering the new council), `/about/council/` shows the newest term that has some, and the build log says so. The heading always names the term shown ("Council 2025–26"). See `src/lib/council-term.mjs`.

## 4. Resources — `src/content/resources/<title>.yml`

| Field | CMS label | Type | Required | Notes |
|---|---|---|---|---|
| `title` | Title | string | ✓ | |
| `category` | Category | select | ✓ | `Academic`, `Financial`, `Wellbeing & Safety`, `Clinical & Professional`, `Governance` |
| `description` | Description | text | ✓ | |
| `link` | Link | string | ✓ | `https://…`, or `/…` for one of our own pages. |
| `linkLabel` | Link text | string | | Defaults to "Learn more". |
| `lastVerified` | Link last checked | date | | **Surface in the build log.** Link rot is how a resource directory dies; this makes the decay visible. |
| `order` | Order | number | ✓ | Within a category. Categories themselves always appear in the order above. |
| `published` | Show on the site | boolean | | Default `true`. |

**Each resource has an anchor, and it is the filename.** `/resources/#student-mistreatment-policy` lands on that resource's heading. The filename is set when the entry is created and the CMS can't rename it, so the anchor survives a reworded title. The old Wix address `/general-8` redirects to that anchor, and `tests/redirects.test.mjs` fails if a resource some redirect points at is deleted or hidden.

## 5. Committees — `src/content/committees/<slug>.md`

| Field | CMS label | Type | Required | Notes |
|---|---|---|---|---|
| `name` | Name | string | ✓ | |
| `slug` | Web address | string | ✓ | `/involved/<slug>/` |
| `shortDescription` | Short description | text | ✓ | Card copy. |
| `logo` | Logo | image | | |
| `logoAlt` | Logo description | string | | Needed if `logo` is set; same soft rule as `coverAlt`. |
| `externalLink` | Link somewhere else instead | string | | If set, no detail page (NPMP, VASC, the Athletic Committee). |
| `instagram` | Instagram link | string | | |
| `contactEmail` | Contact email | string | | |
| `acceptingMembers` | Recruiting now | boolean | | Shows "Recruiting now" as text, on the card and the page. |
| `order` | Order | number | ✓ | |
| `published` | Show on the site | boolean | | Default `true`. |
| *(body)* | Committee page | rich text → Markdown | | The detail page. The short description shows on the card; the page shows it only when this is empty. |

## 6. Gallery — `src/content/gallery/gallery.json`

One file holding a list, so editors can drag photos into order. List position is the order. The build numbers the items itself, because the CMS writes no ids.

| Field | CMS label | Type | Required |
|---|---|---|---|
| `image` | Photo | image | ✓ |
| `alt` | Photo description | string | ✓ |
| `caption` | Caption | string | |
| `term` | Term | string | |

`term` lets older photos age out by filter rather than by deletion.

## 7. Site settings — `src/content/settings.json`

Facts about the club that appear site-wide: `currentTerm`, `contactEmail`, `officeAddress`, `officeHours`, `instagramUrl`, `tiktokUrl`, `facebookUrl`, `linkedinUrl`.

**This one degrades rather than validates.** It is not a content collection. Read it through `getSettings()` in `src/lib/settings.ts`, which falls back to a repo default for any blank value and logs a warning (`currentTerm` has no default; the council page copes without it). Only `currentTerm` is read today; the footer will read the rest. A stale office-hours string is a nuisance on one page; strict validation on a value used in the footer would take every page down.

**Boundary, guard it against drift:** settings hold facts about the club, never labels, button text or nav copy. Those stay in `src/config/` (decision 6). The test: if changing it changes what a control *says*, it's the repo's. If it changes what the club *is*, it's here.

## 8. Electives *(fast-follow — don't build until the data is confirmed)*

Not yet in `.pages.yml`. Pages CMS has a spreadsheet-style `datagrid` format that is likely the right fit for this table. Fields as previously planned: course code, title, credits, terms offered, faculty, level, prerequisites, description, tags, curated student notes (**not** user-submitted), last updated. The table must work without JavaScript as a plain sorted table.

---

## Editor's guide

A plain-language guide for a nursing student with no technical background. Per `CLAUDE.md` §11 it must never mention git, a terminal or a file path. **Default home: a Google Doc in the NUS-owned Drive**, linked from `MAINTENANCE.md`. The club already keeps its documents in Drive, and editing the guide shouldn't need a developer. It should cover:

- How to log in (the email invite), write a post, and publish it: switch on **Published**, press **Save**, wait about two minutes
- Why images need a description, and why **the photo that matters goes in Cover image**: pictures pasted into the text can't be described, so screen readers skip them. Anything a picture says (a poster's date, a schedule) has to be in the text too
- How to edit one of the informational pages, and why pages can't be added or deleted
- How to add a homepage photo
- How to update office hours, address and social links in Site settings
- The annual council rollover, step by step
- Who to contact when something breaks

This is a deliverable, not documentation. It is the difference between a site that survives handover and one that doesn't.
