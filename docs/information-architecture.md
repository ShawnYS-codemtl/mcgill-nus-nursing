# Information Architecture

## Problems with the current IA

- **"More" is a junk drawer.** Elections, Fees, Sponsors, Listserv, and Calendar have nothing in common except that nobody knew where to put them.
- **Slugs don't match labels.** Elections lives at `/programs`. Two committee pages live at `/blank-page` and `/blank-page-1`. Three featured pages are `/general-8`, `/general-8-1`, `/general-9`.
- **"Student Services" mixes destinations and detours.** Two of five items are external links off-site.
- **The homepage explains the navigation.** A "Website Contents" block describing what each menu tab contains is a symptom, not a solution.
- **Nothing is time-aware.** No structural distinction between things that change weekly (announcements), yearly (council, elections), and rarely (fees, constitution).

## Organising principle

Three top-level sections, aligned to what a student actually arrives wanting:

1. **What's happening** — news, events, elections. High churn, this is what brings people back.
2. **What we do / who we are** — council, committees, governance. Yearly churn.
3. **What can help me** — resources, electives, handbook. The reference layer, near-permanent.

---

## Sitemap

The site is **English only** — no locale prefixes, no language switcher. See `CLAUDE.md` §3.

```
/                             Home — the news feed, and the News tab
/news/[slug]/                 Post detail
/news/[slug]/email/           Email-safe render               [fast-follow]

/about/                       About the NUS
/about/council/               Current council roster
/about/council/[term]/        Past council by term            [fast-follow]
/about/governance/            Constitution, by-laws, meeting minutes
/about/elections/             Elections
/about/fees/                  NUSF and NURF

/involved/                    Committees + clubs index
/involved/[slug]/             Committee detail

/resources/                   Resource directory
/resources/electives/         Electives explorer              [fast-follow]

/contact/                     Contact + office info
```

Notes on the shape:

- **The informational routes are CMS-editable, but their paths are not.** `/about/`, `/about/fees/`, `/about/governance/`, `/about/elections/`, and `/contact/` each have an explicit route file in `src/pages/` that reads its content from `src/content/pages/<name>.md` (`about`, `fees`, `governance`, `elections`, `contact`). There is no catch-all route. An exec can rewrite any of these pages in Pages CMS; nobody can move one, rename one, or add one without a code change. See `content-schema.md` §2 and `CLAUDE.md` decision 12a.
- **Governance consolidates three thin pages.** Constitution, by-laws, and meeting minutes were three separate pages that are mostly links to PDFs and Drive folders. One page serves better.
- **Elections moves under About.** It's a governance function, not a "more" item.
- **Fees moves under About.** It explains what the society is and how it's funded.
- **Simplified further on 2026-10-31**, rather than copying Wix:
  - **The homepage is the news feed**, so there is no separate `/news/` list. An archive page can come when posts outgrow the homepage. Wix addresses that pointed at news now go to `/`.
  - **No `/submit/` page.** The Wix listserv form was a Wix form, so its submissions go with Wix, and this site can't host forms. The Contact page says to email `nus.nursing@mail.mcgill.ca`.
  - **ISoN folded into Resources.** The page was links to McGill's own site, the student handbook (already a resource), the grad students' association, and contacts for roles the council no longer has. The school and the NGSA are now resources, which can't go stale the way a page of prose does.
- **No Sponsors page** (decision 11). `/sponsors` redirects home.

**Leave room for locale prefixes.** French is out of scope, but don't build anything that would make `/fr/…` structurally impossible later — chiefly, avoid hardcoding absolute paths in components. Use a single link helper or Astro's routing rather than scattering `href="/about/council/"` string literals through the codebase. This costs nothing now and is the whole difference between adding French later and rewriting every component.

### Navigation

Primary nav — five items, no third level:

`News` (the homepage) · `About` (dropdown) · `Get involved` · `Resources` · `Contact`

The site title in the header also links home. Decision 17's index-card tabs cover the first four; Contact stays in the nav as well (decided 2026-10-31).

Footer: contact block, office address, social links, the listserv email (`nus.nursing@mail.mcgill.ca`), and a link to the Land Acknowledgement's full text on the homepage. No short form: the text is verbatim (decision 13), and a shortened one would be a paraphrase.

**UI strings** — nav labels, button text, form labels — live in a single config or constants file in the repo, not scattered through components and not in the CMS. The boundary: if an exec should be able to change it, it belongs in the CMS; if changing it could break navigation, it belongs in the repo. Keeping these centralised also means a future French version is a second file rather than a hunt through the codebase.

**Footer contents are not UI strings.** The office address, office hours, contact email, and social links come from Site settings (`src/content/settings.json`, edited in the CMS) so they aren't developer-only, and fall back to repo defaults if a value is blank. The labels around them stay in the repo. Same file, different sources — see `content-schema.md` §7.

---

## Redirect map

The Wix site has been live for years and these URLs are indexed and linked from McGill pages, Instagram bios, and old emails. All redirects are **301**, configured in `public/_redirects`. `tests/redirects.test.mjs` checks that file on every PR, and `MAINTENANCE.md` → *Adding a redirect* says how to add one. Keep this table and the file in step.

| Old path | New path |
|---|---|
| `/about` | `/about/` — **no rule**: Cloudflare adds the trailing slash itself, and a rule could loop |
| `/constitution-by-laws` | `/about/governance/` |
| `/nus-council` | `/about/council/` |
| `/past-nus-councils` | `/about/council/` |
| `/nus-council-meetings` | `/about/governance/#nus-meeting-minutes` (the anchor is made from the heading *NUS Meeting Minutes* on the Governance page) |
| `/ingram-school-of-nursing-ison` | `/resources/#ingram-school-of-nursing-ison` (the page became a resource) |
| `/get-involved-1` | `/involved/` |
| `/helpful-resources` | `/resources/` |
| `/ntc` | `/resources/` |
| `/ntc-nur1-300` | `/resources/` |
| `/nur1-301-pharmacology-for-nursing-2` | `/resources/` |
| `/programs` | `/about/elections/` |
| `/fees` | `/about/fees/` |
| `/sponsors` | `/` — the page is archived, see decision 11 |
| `/listserv` | `/contact/` — the Wix form goes with Wix; Contact says to email instead |
| `/calendar` | `/` |
| `/contact` | `/contact/` — **no rule**, as for `/about` |
| `/general-8` | `/resources/#student-mistreatment-policy` (the anchor is the resource's filename) |
| `/general-8-1` | `/involved/equity-committee/` |
| `/general-9` | `/news/21st-century-fund/` |
| `/canadian-nursing-students-associati` | `/involved/cnsa/` |
| `/canadian-black-nurses-alliance-cbna` | `/involved/cbna/` |
| `/swab-the-world` | `/involved/swab-the-world/` |
| `/blank-page` | `/involved/social-committee/` |
| `/blank-page-1` | `/involved/graduation-committee/` |
| `/mngh` | `/involved/mngh/` |
| `/mcgill-nurses-for-planetary-health-mnph` | `/involved/mnph/` |
| `/opportunities` | `/` — found in the Wix sitemap 2026-10-21: student opportunity notices from 2020 |
| `/general-clean` | `/` — found in the Wix sitemap 2026-10-21: the February 2025 career fair |
| `/event-details-registration/*` | `/` |
| `/_files/*` | `/about/governance/` — Wix's address for uploaded PDFs; the Elections page linked the by-laws this way |

Also serve a **404 page** offering search or the main sections. Wix generated URL patterns we may not have crawled; a good 404 is the safety net. Done: `src/pages/404.astro` links the main sections (search can join it once Pagefind is in).

**Re-crawled 2026-10-21** from Wix's own `sitemap.xml` (`pages-sitemap.xml` and `event-pages-sitemap.xml`), which lists the pages the truncated "More" menu hides. It added `/opportunities` and `/general-clean`; every other page was already here. Crawl once more just before cutover in case the council adds a page.

---

## SEO and metadata

- Every page: unique `<title>`, meta description, Open Graph image. The current site has one shared OG image and the keyword meta tag reads `Where, and, come, dreams, true, wishes` — a leftover Wix template value. Don't carry it.
- `sitemap.xml` via `@astrojs/sitemap`.
- `<html lang="en">` set explicitly.
- `Organization` and `NewsArticle` JSON-LD on the relevant page types.
- Canonical URLs on `mcgillnus.ca`, not the Cloudflare Pages subdomain.
