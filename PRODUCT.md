# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static output), Tailwind CSS, npm, hosted on **Cloudflare Pages** free tier. Content is Markdown/YAML/JSON in the repo, edited by council members through **Pages CMS** (a free hosted form editor that commits on Save). Documented with rationale in `CLAUDE.md` §5 and §8; not an open question. The CMS was Notion until 2026-10-11 (decision 1) and the host was Netlify until 2026-09-29 (decision 3); both reversals are explained there.

Phase 0 is scaffolded: the Astro project, the content collections, the Pages CMS config, and the post index and detail pages exist. Styling does not — Tailwind is not installed yet, and Phase 0 is deliberately unstyled.

Hard architectural constraint: the output is static files. No database, no backend server, no serverless functions, no site auth. A feature that appears to need a server is an escalation, not a build.

## Users

**Primary: McGill undergraduate nursing students**, roughly 18–24, across BScN and BNI programs, on-campus and online, U0 through U3.

Their situation is the design problem. They are chronically short on time, moving between clinical placements and lectures, and reading on a phone — the median visit should be assumed to arrive from an Instagram bio link on a phone, possibly on poor hospital wifi. They already follow the NUS on Instagram, which is far better than a website at being fun. The site does not win by competing with it.

The jobs they arrive with:

- *"Did anything happen?"* — checking for news, events, open positions.
- *"Which electives should I take?"* — the single most-wanted piece of information, currently a PDF behind a Google Drive link.
- *"Where do I go for help?"* — financial aid, mental health, mistreatment reporting, textbooks, library.
- *"Who do I email about this?"* — finding the right council member.

**Secondary audiences:** prospective students judging whether McGill nursing has a real community; ISoN faculty; sponsors.

**A second user class with different needs entirely: the editors.** Council execs are non-technical nursing students who will never see a terminal, a git commit, or a markdown file. They publish from Pages CMS, which shows them forms, never files. The entire council turns over annually.

## Product Purpose

A public website for the McGill Nursing Undergraduate Society (NUS), the student-run representative body for undergraduates at McGill's Ingram School of Nursing. It replaces an aging Wix site at `nusnursing.wixsite.com/website`, live on the club's domain `mcgillnus.ca`.

The incumbent site fails in three specific, documented ways, and every requirement traces back to one of them:

1. **It goes stale.** Sponsors content is two years old and signed by a coordinator who has left. The calendar says "2024-2025." The Note-Taking Club hosts notes from 2018. Nobody updates it because updating it is a chore.
2. **There is no reason to return.** It is a static brochure whose "Events & Announcements" module literally reads "None for now!!"
3. **It is not a useful resource.** The most-wanted information is locked in a PDF.

**Success is not a launch.** Success is the site still being current two years after the person who built it has graduated. The operational definition, from `CLAUDE.md` §12: a non-technical nursing exec can publish an update in under five minutes, from a plain web form, without asking for help. Everything else is secondary to that.

## Positioning

Not a faculty page and not an Instagram substitute — the student society's own voice, in a place that outlives any one council.

Two things a neighbouring student-club site could not truthfully copy:

- **The publish loop is the product.** Pages CMS is the admin UI; there is no CMS of our own, no dashboard, and no per-exec GitHub account (editors are invited by email). Publishing is: switch on **Published**, press **Save**. That commit is the build. There is no other publishing path and no second step.
- **It is built to survive neglect, not just to launch.** The content lives in the club's own repo, so the build has no API, token or external service to lose. If the editor ever disappears, the content doesn't. A bad edit drops one value with a warning rather than failing, and a failed build leaves the last good site up. Nothing depends on a specific person's account, knowledge, or goodwill.

## Operating Context

- **Annual turnover of the entire council.** Every artifact — repo, the Pages CMS install, Cloudflare account, Google Drive folders — must end up NUS-owned rather than sitting in a graduating student's personal account.
- **Zero budget.** Free tiers only, and only free tiers that don't quietly expire or require a card on file.
- **Solo developer, October deadline.** The Wix site stays live during the build, so there is no pressure to ship half a site — but there is pressure to ship a complete small one.
- **Content lives in the repo, in seven collections:** Posts, Council, Resources, Committees, Pages, Gallery, Settings (Electives to follow). Schema in `docs/content-schema.md`. Pages, Gallery, and Settings exist so that informational prose, homepage photos, and club details are editable by execs rather than by a developer — see `CLAUDE.md` decision 12.
- **Load-bearing external dependencies that stay external:** Google Drive (textbook PDFs, financial-aid documents, meeting minutes, the EN-FR dictionary, the by-laws PDF), Microsoft Forms (the student mistreatment report), Facebook (textbook marketplace), and the McGill listserv `nus.nursing@mail.mcgill.ca` for newsletter distribution.
- **Newsletter distribution stays on McGill infrastructure.** A published post also renders an email-safe version an exec copies into the existing listserv. Running an independent subscriber list would put CASL obligations on a rotating student council for no marginal reach.
- **Physical office:** 680 Rue Sherbrooke Ouest, Suite 1923, Montreal, QC, H3A 0B8. Office hours vary.
- **Domain:** `mcgillnus.ca`, GoDaddy registrar. DNS is served by **Wix**, not GoDaddy — so a nameserver move is required no matter which host is used, and it moves to Cloudflare. **The domain expires 2026-11-01.** There is a live `MX` record that must survive the move or club email breaks.

### How decisions get made on this project

The developer is a volunteer with a **single council contact** who relays questions to the club. Answers are possible but have latency. Batch questions rather than blocking on them one at a time, and prefer recording an open decision over inventing an answer.

This has one sharp consequence. The riskiest assumption in the project — that a non-technical exec can publish unaided — is validated by handing the deploy loop to a council member and watching them use it without helping (`CLAUDE.md` §12, step 5). That test requires scheduling through the single contact. It is achievable, but it is not on-demand, and it should be requested early rather than discovered as a blocker in October.

## Capabilities and Constraints

### Confirmed scope — must ship by October

- Homepage built as a newsletter: latest post, recent posts, featured links block, land acknowledgement in full.
- News/post system, editable in the CMS: index, detail pages, dates, author attributed by **role, not person**, optional cover image.
- Council roster, editable in the CMS, filtered to the current term, Executive and General Council sections. 23 people, photo/name/program/role/fun fact/email each.
- Resources directory, editable in the CMS — 15 entries across five suggested categories (Academic, Financial, Wellbeing & Safety, Clinical & Professional, Governance).
- Get Involved: 10–11 committee/club cards, editable in the CMS, with detail pages where real content exists.
- Informational pages, editable in the CMS: About, Fees, Governance (Constitution & By-Laws), ISoN, Elections, Contact. Editable by execs; the CMS can edit the six but cannot add, rename or delete one, so content changes cannot move a URL or break the nav.
- Homepage photo gallery, editable in the CMS, so the event photo library stays current rather than freezing at launch.
- Site settings, editable in the CMS — office hours, address, contact email, social links — degrading to repo defaults rather than failing a build.
- 301 redirects from all old Wix URLs (`docs/information-architecture.md`).
- An editor's guide, in plain language, for the incoming exec (a Google Doc in the NUS-owned Drive by default).

### Confirmed fast-follow

Electives explorer (filterable table — highest student value, deferred only because the source data needs cleanup), email export view at `/news/[slug]/email`, past councils, meeting minutes index, site search.

### Explicitly out of scope — do not build

French/i18n · user accounts or login · comments, forums, ratings, or any user-generated content · self-hosted email sending or subscriber management · any database, server, or serverless function · a file manager replacing Google Drive · the mistreatment reporting form (stays on Microsoft Forms; sensitive disclosures must not route through student-run infrastructure) · e-commerce or ticketing · a CMS admin UI of our own.

### Content shapes that must not break the design

These are facts about the real data, not hypotheticals:

- **Photo aspect ratios in the source data are wildly inconsistent.** The layout must impose its own.
- **Some council members have no photo.** At least one position is VACANT and renders as a "position open" call to action rather than an empty card.
- **Role descriptions run from one line to four**, and sit next to each other.
- **Committee logos vary in quality and dimensions.** Some entries link off-site, some to detail pages, some carry a "recruiting" badge.
- **Every image must be optional in practice.** No layout may depend on decorative imagery being present.
- **Label lengths vary and will vary more.** Role titles, committee names, and post headlines already differ a lot; French is the likeliest future addition even though it is out of scope now.
- **The empty and near-empty states are real states.** "Nothing posted in a month" will happen. Three posts and three hundred posts must both look intentional.
- **Electives data is dense and tabular** and must be usable on a phone. A horizontally scrolling table is a last resort, not a plan.

### Technical constraints with a failure mode attached

- **Uploaded image paths must stay relative** (`../../assets/uploads/…`). Astro only optimises a Markdown-body image with a relative path; one starting with `/` ships unprocessed and broken, with no build error. `npm run verify` catches it. See `MAINTENANCE.md` Landmine 4.
- **Minimal JavaScript.** One interactive island (the electives filter). Assume poor hospital wifi.
- **Free assets only.** System font stacks or a properly licensed open font. No paid icon sets, no stock photography.
- **Every entry's filename is its permanent key** and cannot be renamed in the CMS, even though French is out of scope. That is the difference between adding French later being a content job rather than a migration (decision 5a).

### Open decisions — record, do not invent

- Whether the NUS has or will create an **organisation-owned GitHub account**, which owns the repo (and so all content) and installs Pages CMS. The build proceeds on personal accounts; transfer is a launch blocker, not a nice-to-have.
- Whether an exec will **commit in writing to maintaining an events calendar**. If nobody owns it, it does not get built. The previous one died in 2024.
- **Source and shape of the electives data**, to be confirmed before the explorer is built.
- Confirmation that the club can **use the McGill listserv** for newsletter distribution as described above.
- Confirmation that the council has actively **chosen English-only** rather than inherited it, given the Quebec context, francophone-facing BNI content, and the club's own EN-FR dictionary project. Not a blocker.

## Brand Commitments

**Name:** McGill Nursing Undergraduate Society — "NUS." Parent school: the Ingram School of Nursing (ISoN).

**Voice — binding, and the most easily broken thing in this record.** Warm, unpolished, funny. The current council bios include a president whose fun fact is a stated preference for raccoons, and a coordinator who titled herself "Sponsor-Rizzer." That register is not a bug to be cleaned up; it is the reason students read the page at all. The design must have room for it.

> **A polished corporate result would be a failure, even a beautiful one.**

**Palette: open.** There is no existing brand palette, and the club has explicitly given latitude to make the site look better. McGill's institutional red is *available* as a reference point but is not a requirement — leaning on it hard risks looking like a faculty page rather than a student society.

**Verbatim text, not to be edited, paraphrased, or "improved":**

- The **Land Acknowledgement** (unceded Indigenous territory; Haudenosaunee and Anishinaabeg; Kanien'keha:ka Nation as traditional custodians). It appears on the homepage in full, and its treatment should be considered and respectful — not small print in the footer, and not a decorative banner.
- The **Commitment to Truth & Reconciliation** (references Joyce's Principle and systemic inequities in Indigenous health outcomes).

**Stated equity commitment.** No dark-pattern engagement mechanics; the audience is students.

**Explicit non-goals:** not an Instagram clone — it should complement the social accounts, not compete on their terms. No carousels, no auto-playing anything, no scroll-jacking, no cursor effects.

**Social accounts:** Instagram `@mcgillnus`, TikTok `@mcgillnus`, Facebook `McGillNUS`, LinkedIn `company/mcgillnus`.

## Evidence on Hand

**Confirmed available (2026-08-03):**

- **The event photo library** — potlucks, socials, clinical skills sessions, group shots. Real McGill nursing students, not stock. This is the strongest asset the club has and design should use it. Roughly 14 images also sit in the Wix homepage gallery, but those are compressed and cropped; prefer the originals.
- **Vector logo originals**, plus the transparent-PNG NUS logo and a wordmark used in the current header at roughly 400×120.

**Real content, already inventoried** in `docs/content-inventory.md`: the full 2025–26 council roster (23 people with roles, programs, emails, role descriptions, and fun facts), all 15 resource entries with descriptions and links, 10 Get Involved entries, the Fees copy (NURF $5.00/semester non-opt-outable, established 1994; NUSF), office address, and both verbatim Indigenous-relations texts.

**Assets that must be extracted before the Wix site is decommissioned** — Wix CDN URLs stop working when it comes down: the by-laws PDF (`mcgillnus.ca/_files/ugd/0a9b8d_6c6e7a950bb946b382f21e47eec111e3.pdf`), the NUS Council Structure diagram (PNG, ~1545×1996 — worth recreating as SVG or accessible HTML, since as a raster it is unreadable on mobile and invisible to screen readers), and the homepage gallery photos.

**Absences future work must not fabricate.** There are no testimonials, no metrics, no press, no case studies, and no membership numbers. There is no current sponsor roster — the existing Sponsors page is being archived (below), and its Evenko partnership events are dated 2024. Do not invent sponsor logos, student quotes, event attendance figures, or awards.

**Known defect in the source data, do not reproduce:** the current council page has a broken mailto for Director of Academics using `http://` instead of `mailto:`.

## Product Principles

1. **Freshness is the primary design problem.** The failure mode of the incumbent is a homepage that looks identical in March and October. A visitor should be able to tell within two seconds that something happened recently.
2. **Design for neglect, not for launch day.** Whatever ships will be filled by a rotating cast of busy students. It must look intentional with three posts and with three hundred. A layout that only looks right when perfectly populated will not stay looking right.
3. **The voice is load-bearing.** Warmth and humour are the reason students read the page. Anything that professionalises the club into a corporate brochure has failed, however well-crafted.
4. **Nothing may depend on a person.** Not an account, not a name in the copy, not institutional knowledge. Content is bound to roles and terms, never to individuals.
5. **Scannability over decoration in the resource layer.** A student who doesn't know which elective to take should find their way there without reading a nav menu.

## Accessibility & Inclusion

**WCAG 2.1 AA minimum, treated as a requirement rather than a goal.** This is a healthcare-adjacent student body, and some of them are studying accommodation in their own coursework — shipping an inaccessible site to this audience is a substantive failure, not a technical one.

Concretely: semantic HTML, real focus states, full keyboard navigation, AA contrast, and no colour-only signalling. Cover images and logos require a description in the CMS form, and the build drops one that arrives without it. Pictures pasted into body text can't be described in the CMS (it would use the filename), so the build marks them decorative (`alt=""`) and the editor help text steers meaningful photos to the cover. Any information a picture holds must also be in the text.

The council structure diagram is a specific known failure: currently a large raster image, unreadable on mobile and invisible to screen readers.

Inclusion commitments that are content, not styling: the Land Acknowledgement and Truth & Reconciliation statement carry verbatim, with considered placement. The audience explicitly spans on-campus and online BNI students — online students are not an afterthought segment.
