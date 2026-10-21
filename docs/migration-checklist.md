# Migration, Launch & Handover Checklist

## Phase 0 — validate the CMS bet (do this first, before design)

> **Changed 2026-10-11:** the CMS is now Pages CMS with content in the repo, not Notion. See `CLAUDE.md` decision 1. The Notion layer that was built is preserved in `git stash` on the `pages-cms` branch, as the fallback if the spike below fails.

- [x] Define the content collections and mirror them in `.pages.yml` — **done 2026-10-13**
- [x] Scaffold Astro; render the post index and detail pages, unstyled — **done 2026-09-29, moved to content collections 2026-10-13**
- [x] Deploy to a `*.pages.dev` subdomain on Cloudflare Pages, building on push to `main` — **live at https://mcgill-nus.pages.dev** (2026-10-20). The full chain, from an email collaborator's save to the live page, was tested the same day
- [x] Turn on Cloudflare's **Deployment failed** alert, to `nus.nursing@mail.mcgill.ca` (2026-10-20)
- [x] **Pages CMS spike:** passed **2026-10-14** on the `pages-cms` branch (PR #1). Findings are in `CLAUDE.md` §9.
- [x] **"Protect main" ruleset** turned on 2026-10-14: deletion and force-push blocked, PR required, **`verify` required (from GitHub Actions)**, Pages CMS on the bypass list
- [x] After PR #1 merges: save one edit in Pages CMS on `main` and confirm the commit lands with the ruleset active — **passed 2026-10-14 as an email collaborator**. A GitHub sign-in is blocked by design (2026-10-19); see `MAINTENANCE.md` Landmine 3
- [x] **Sit a council member down and have them publish a post without help.** If they stumble, change the CMS approach now — it costs almost nothing at this stage and is very expensive later.
  - **Treated as done by the user's decision on 2026-10-21**, which lifted the hold on building pages. That is a decision, not a session observed here. Record where the council member hesitated in `CLAUDE.md` §12.
  - Book this early. It needs the single council contact, so it cannot be arranged on demand.
  - Watch for hesitation, not just success. Where they pause is the finding.

## Extract from Wix before it comes down

Wix CDN URLs stop resolving when the site is decommissioned. Get these while they work:

- [ ] By-laws PDF, linked from the Elections page. The `mcgillnus.ca` address 404s since the domain broke (2026-10-20); it is still at `nusnursing.wixsite.com/website/_files/ugd/0a9b8d_6c6e7a950bb946b382f21e47eec111e3.pdf`
- [ ] NUS Council Structure diagram (PNG, ~1545×1996)
- [ ] Logo variants — transparent PNG and the 400×120 header wordmark. Ask the club for vector originals.
- [ ] All homepage gallery photos (~14) at the largest available size
- [ ] Council member photos (23) — ask for originals; the CDN copies are cropped and compressed
- [ ] Committee logos (~8)
- [x] Full text of the land acknowledgement and Truth & Reconciliation commitment, **verbatim** — in `src/config/indigenous-relations.ts` (2026-10-21)
- [x] Re-crawl for any page missed in the initial pass — done 2026-10-21 from Wix's own `sitemap.xml`. It found two pages the redirect map lacked (`/opportunities`, `/general-clean`, both stale) and seven Wix-hosted PDFs on the Constitution and Elections pages, not one
- [ ] The **other six PDFs**: NUS Constitution, Role and Governance By-Laws, Financial By-Laws, General Electoral By-Laws, Committees & External Groups By-Laws, and the SSMU-NUS Memorandum of Agreement. All linked from `/constitution-by-laws`, all on Wix's file server. Move them to the NUS Drive with the by-laws PDF above
- [ ] Past Councils rosters (2017–18 to 2024–25, names and roles) from `/past-nus-councils`. Not imported yet; the page dies with Wix

## Confirm external dependencies are NUS-owned

Several Google Drive links are load-bearing. If they sit in a graduating student's personal Drive, they vanish.

- [ ] Textbook PDF folder
- [ ] Financial aid resources PDF
- [ ] Elective courses PDF
- [ ] EN-FR nursing dictionary PDF
- [ ] Meeting minutes folders — Fall 2024, Winter 2025, Fall 2025, Winter 2026
- [ ] Listserv submission form (currently a Microsoft Form)
- [ ] Mistreatment report form — verify this is McGill-owned, and leave it there

## Content preparation

- [ ] Populate content in Pages CMS: Posts, Council (2025–26 + incoming term), Resources (15), Committees (11), the six Pages, Homepage photos, Site settings
  - [x] Imported from Wix 2026-10-21, word for word: Council 2025–26 (23), Resources (15), Committees (11), the six Pages, and two Posts from the homepage LINKS block. Gaps are listed in `CLAUDE.md` §9
  - [ ] Council 2026–27 (then change **Current council term** in Site settings, which is already set to 2026-2027)
  - [ ] Homepage photos, member photos and logos, from the club's originals
  - [ ] Drive links on the Governance page, once the PDFs are on Drive
- [ ] Get new Sponsors copy from Laurence Carrière — the existing page is written in a departed coordinator's voice and lists 2024 events
- [ ] Confirm with the council which content gets cut (Note-Taking Club, Calendar, and the stale Sponsors content are proposed for archival)
- [x] Add the missing NUS Athletic Committee entry — added 2026-10-21 with the only thing Wix has for it: one line and a link to a 2024 Instagram post. Ask the council for a real description
- [ ] Decide whether the events calendar has an owner. If not, don't build it.

## Pre-launch

- [x] All redirects from `information-architecture.md` in place — `public/_redirects`, checked on every PR by `tests/redirects.test.mjs` (2026-10-21). Many targets are pages not built yet
- [ ] Every redirect tested in a browser once its target page exists, and again on `mcgillnus.ca` after the DNS move
- [ ] `sitemap.xml` generated and valid
- [x] Custom 404 page — `src/pages/404.astro` (2026-10-21)
- [ ] Lighthouse: performance, accessibility, SEO, best practices all ≥95
- [ ] Manual keyboard-only pass over every page type
- [ ] Screen reader spot-check on the council roster and the electives table
- [ ] Failure path tested: break a field in a content file on a branch, confirm the build fails readably, the previous deploy stays live, and the failure email arrives
- [ ] `npm run verify` passes on the final content (no unprocessed image paths)
- [ ] All `mailto:` links tested (the current site has a broken one on the Director of Academics)
- [ ] OG images render correctly when shared to Instagram and Facebook

## DNS cutover

> **Corrected 2026-09-29.** This section previously said "the domain is at GoDaddy… nameservers do not need to move." That was wrong, and it was the stated reason for choosing Netlify. GoDaddy is only the **registrar**; DNS is served by **Wix** (`ns4.wixdns.net`, `ns5.wixdns.net`). The current DNS therefore belongs to the subscription being cancelled, and **nameservers have to move regardless of host**. See `CLAUDE.md` decision 3.

### First, before touching anything

- [ ] 🔴 **Renew the domain. It expires `2026-11-01`.** Confirm auto-renew is on and not tied to a graduating student's card.
- [ ] **Record every existing DNS record before the move.** `dig` the zone and screenshot the Wix DNS panel. Once nameservers change, the old records are gone.
- [ ] **The `MX` record is load-bearing:** `mcgillnus.ca` currently points mail at `mail.mcgillnus.ca` (`69.195.124.181`). Find out who uses it. If it is not recreated in Cloudflare, **club email silently stops** at cutover — and mail failures are much harder to notice than a website being down.

### Then the move

- [ ] Add `mcgillnus.ca` as a zone in Cloudflare; let it import existing records, then **check the import against your own list** — it misses records
- [ ] Lower the TTL on existing records ~24h beforehand
- [ ] Change nameservers at GoDaddy to the two Cloudflare gives you
- [ ] Add `mcgillnus.ca` and `www.mcgillnus.ca` as custom domains on the Pages project (apex works via CNAME flattening, which is why the zone must be on Cloudflare)
- [ ] Verify the certificate provisions for both apex and www
- [ ] Confirm HTTPS redirect and www→apex (or apex→www — pick one and be consistent)
- [ ] **Send a test email to the domain** after cutover, before assuming it worked
- [ ] Keep the Wix site accessible at its `wixsite.com` URL for a few weeks as a fallback
- [ ] Submit the new sitemap to Google Search Console
- [ ] Update the link in the Instagram bio, TikTok, Facebook, and LinkedIn profiles

**Do not cancel the Wix subscription until the new site has been live and stable for a month** — and be aware that cancelling it also removes the DNS that is serving the domain today, so the nameserver move must be complete and verified first.

## Handover — the part that determines whether this survives

The dominant failure mode for a student club website is that it dies with the account of the person who built it. Every item below is a real risk, not a formality.

- [ ] **Pages CMS** installed on the repo by the NUS-owned GitHub account (not the developer's), with the current editors invited as collaborators and listed in `MAINTENANCE.md`
- [ ] **"Protect main" ruleset** carried over after the repo transfer: PR + required `verify` check, force-push and deletion blocked, **Pages CMS on the bypass list** (check by saving one edit in the CMS)
- [ ] **GitHub repo** transferred to an NUS-owned account or org. Forking from a personal repo is not sufficient; the canonical repo must be theirs.
- [ ] **Cloudflare account** owned by an NUS account, holding both the Pages project and DNS, with the repo connected from there. *Partly done:* the account is `nus.nursing@mail.mcgill.ca` and holds the Pages project. DNS moves at cutover, and the GitHub connection follows the repo when it moves to an NUS-owned account
- [ ] **Domain** — confirm who holds the GoDaddy login and that renewal doesn't depend on one person's credit card. **A lapsed domain renewal is the single most likely way this site disappears.**
- [ ] Editor's guide published as a Google Doc in the NUS-owned Drive, and linked from `MAINTENANCE.md` (see `content-schema.md`)
- [ ] `MAINTENANCE.md` complete — every `_TODO_` filled in, especially the access inventory table and the repo tour. **Test it: hand the repo and this file to someone who wasn't involved and ask them to get it running locally and deploy a change.** If they can't, it isn't finished.
- [ ] A named role in the council that owns the website — put it in the by-laws if possible, so it survives the people
- [ ] One live walkthrough with the incoming exec, recorded

## Post-launch

- [ ] Confirm builds stay within the free tier (500/month; every CMS Save is one)
- [ ] Analytics (Cloudflare Web Analytics — free, no cookie banner needed)
- [ ] Check in after one month: is anyone actually posting? If not, the problem is the workflow, not the tooling — go find out where they got stuck.
