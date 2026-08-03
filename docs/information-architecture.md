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
/                             Home — newsletter feed
/news/                        All posts, paginated
/news/[slug]/                 Post detail
/news/[slug]/email/           Email-safe render               [fast-follow]

/about/                       About the NUS
/about/council/               Current council roster
/about/council/[term]/        Past council by term            [fast-follow]
/about/governance/            Constitution, by-laws, meeting minutes
/about/elections/             Elections
/about/ison/                  Ingram School of Nursing
/about/fees/                  NUSF and NURF

/involved/                    Committees + clubs index
/involved/[slug]/             Committee detail

/resources/                   Resource directory
/resources/electives/         Electives explorer              [fast-follow]

/contact/                     Contact + office info
/submit/                      Listserv / newsletter submission

/sponsors/                    Sponsors & partnerships         [pending rewrite]
```

Notes on the shape:

- **The six informational routes are Notion-backed, but their paths are not.** `/about/`, `/about/fees/`, `/about/governance/`, `/about/ison/`, `/about/elections/`, and `/contact/` each have an explicit route file in `src/pages/` that pulls its content from the Pages DB by `Key`. There is no catch-all route. An exec can rewrite any of these pages from Notion; nobody can move one, rename one, or add a seventh without a code change. See `notion-schema.md` §6 and `CLAUDE.md` decision 12a.
- **Governance consolidates three thin pages.** Constitution, by-laws, and meeting minutes were three separate pages that are mostly links to PDFs and Drive folders. One page serves better.
- **Elections moves under About.** It's a governance function, not a "more" item.
- **Fees moves under About.** It explains what the society is and how it's funded.
- **`/submit` stays out of the main nav** — it's a utility page, linked from the footer and from the newsletter section.
- **Sponsors stays top-level** because sponsors need a clean URL to be shown, and the sponsorship coordinator will want to point partners at it.

**Leave room for locale prefixes.** French is out of scope, but don't build anything that would make `/fr/…` structurally impossible later — chiefly, avoid hardcoding absolute paths in components. Use a single link helper or Astro's routing rather than scattering `href="/about/council/"` string literals through the codebase. This costs nothing now and is the whole difference between adding French later and rewriting every component.

### Navigation

Primary nav — five items, no third level:

`Home` · `News` · `About` (dropdown) · `Get Involved` · `Resources` · `Contact`

Footer: contact block, office address, social links, listserv submission link, land acknowledgement (short form linking to the full text).

**UI strings** — nav labels, button text, form labels — live in a single config or constants file in the repo, not scattered through components and not in Notion. The boundary: if an exec should be able to change it, it belongs in Notion; if changing it could break navigation, it belongs in the repo. Keeping these centralised also means a future French version is a second file rather than a hunt through the codebase.

**Footer contents are not UI strings.** The office address, office hours, contact email, and social links come from the Settings DB so they aren't developer-only, and fall back to repo defaults if a key goes missing. The labels around them stay in the repo. Same file, different sources — see `notion-schema.md` §8.

---

## Redirect map

The Wix site has been live for years and these URLs are indexed and linked from McGill pages, Instagram bios, and old emails. All redirects are **301**, configured in `netlify.toml` or `public/_redirects`.

| Old path | New path |
|---|---|
| `/about` | `/about/` |
| `/constitution-by-laws` | `/about/governance/` |
| `/nus-council` | `/about/council/` |
| `/past-nus-councils` | `/about/council/` |
| `/nus-council-meetings` | `/about/governance/#minutes` |
| `/ingram-school-of-nursing-ison` | `/about/ison/` |
| `/get-involved-1` | `/involved/` |
| `/helpful-resources` | `/resources/` |
| `/ntc` | `/resources/` |
| `/ntc-nur1-300` | `/resources/` |
| `/nur1-301-pharmacology-for-nursing-2` | `/resources/` |
| `/programs` | `/about/elections/` |
| `/fees` | `/about/fees/` |
| `/sponsors` | `/sponsors/` |
| `/listserv` | `/submit/` |
| `/calendar` | `/news/` |
| `/contact` | `/contact/` |
| `/general-8` | `/resources/#mistreatment` |
| `/general-8-1` | `/involved/equity-committee/` |
| `/general-9` | `/news/21st-century-fund/` |
| `/canadian-nursing-students-associati` | `/involved/cnsa/` |
| `/canadian-black-nurses-alliance-cbna` | `/involved/cbna/` |
| `/swab-the-world` | `/involved/swab-the-world/` |
| `/blank-page` | `/involved/social-committee/` |
| `/blank-page-1` | `/involved/graduation-committee/` |
| `/mngh` | `/involved/mngh/` |
| `/mcgill-nurses-for-planetary-health-mnph` | `/involved/mnph/` |
| `/event-details-registration/*` | `/news/` |

Also serve a **404 page** offering search or the main sections. Wix generated URL patterns we may not have crawled; a good 404 is the safety net.

**Before cutover,** crawl the live Wix site once more for any page not in this table — the Wix nav has a truncated "More" item that may hide entries, and committee detail pages were only discoverable through card links.

---

## SEO and metadata

- Every page: unique `<title>`, meta description, Open Graph image. The current site has one shared OG image and the keyword meta tag reads `Where, and, come, dreams, true, wishes` — a leftover Wix template value. Don't carry it.
- `sitemap.xml` via `@astrojs/sitemap`.
- `<html lang="en">` set explicitly.
- `Organization` and `NewsArticle` JSON-LD on the relevant page types.
- Canonical URLs on `mcgillnus.ca`, not the Netlify subdomain.
