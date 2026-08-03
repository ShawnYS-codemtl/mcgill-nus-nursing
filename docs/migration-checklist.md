# Migration, Launch & Handover Checklist

## Phase 0 — validate the CMS bet (do this first, before design)

- [ ] Create the NUS Notion workspace and a minimal `Posts` database
- [ ] Scaffold Astro; fetch and render one post, unstyled
- [ ] Deploy to a `*.netlify.app` subdomain
- [ ] Create a Netlify deploy hook; save it in Notion as a "Publish now" link
- [ ] **Sit a council member down and have them publish a post without help.** If they stumble, change the CMS approach now — it costs almost nothing at this stage and is very expensive later.

## Extract from Wix before it comes down

Wix CDN URLs stop resolving when the site is decommissioned. Get these while they work:

- [ ] By-laws PDF (`mcgillnus.ca/_files/ugd/0a9b8d_6c6e7a950bb946b382f21e47eec111e3.pdf`)
- [ ] NUS Council Structure diagram (PNG, ~1545×1996)
- [ ] Logo variants — transparent PNG and the 400×120 header wordmark. Ask the club for vector originals.
- [ ] All homepage gallery photos (~14) at the largest available size
- [ ] Council member photos (23) — ask for originals; the CDN copies are cropped and compressed
- [ ] Committee logos (~8)
- [ ] Full text of the land acknowledgement and Truth & Reconciliation commitment, **verbatim**
- [ ] Re-crawl for any page missed in the initial pass — committee detail pages were only discoverable through card links, and the nav has a truncated "More" item

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

- [ ] Populate Notion: Posts, Council (2025–26 + incoming term), Resources (15), Committees (11)
- [ ] Get new Sponsors copy from Laurence Carrière — the existing page is written in a departed coordinator's voice and lists 2024 events
- [ ] Confirm with the council which content gets cut (Note-Taking Club, Calendar, and the stale Sponsors content are proposed for archival)
- [ ] Add the missing NUS Athletic Committee entry
- [ ] Decide whether the events calendar has an owner. If not, don't build it.

## Pre-launch

- [ ] All redirects from `information-architecture.md` in place and tested
- [ ] `sitemap.xml` generated and valid
- [ ] Custom 404 page
- [ ] Lighthouse: performance, accessibility, SEO, best practices all ≥95
- [ ] Manual keyboard-only pass over every page type
- [ ] Screen reader spot-check on the council roster and the electives table
- [ ] Build-from-cache tested: revoke the Notion token locally, confirm the build completes with a warning
- [ ] All `mailto:` links tested (the current site has a broken one on the Director of Academics)
- [ ] OG images render correctly when shared to Instagram and Facebook

## DNS cutover

The domain is at **GoDaddy**. Netlify supports apex domains via an A record, so nameservers do not need to move.

- [ ] Add `mcgillnus.ca` and `www.mcgillnus.ca` as custom domains in Netlify
- [ ] Lower the TTL on existing records ~24h beforehand
- [ ] Point the apex A record at Netlify's load balancer; `www` as a CNAME to the Netlify subdomain
- [ ] Verify the Let's Encrypt certificate provisions for both apex and www
- [ ] Confirm HTTPS redirect and www→apex (or apex→www — pick one and be consistent)
- [ ] Keep the Wix site accessible at its `wixsite.com` URL for a few weeks as a fallback
- [ ] Submit the new sitemap to Google Search Console
- [ ] Update the link in the Instagram bio, TikTok, Facebook, and LinkedIn profiles

**Do not cancel the Wix subscription until the new site has been live and stable for a month.**

## Handover — the part that determines whether this survives

The dominant failure mode for a student club website is that it dies with the account of the person who built it. Every item below is a real risk, not a formality.

- [ ] **Notion workspace** owned by an NUS account, with at least two execs as admins — not the developer's personal account
- [ ] **GitHub repo** transferred to an NUS-owned account or org. Forking from a personal repo is not sufficient; the canonical repo must be theirs.
- [ ] **Netlify site** owned by an NUS account, with the repo connected from there
- [ ] **Domain** — confirm who holds the GoDaddy login and that renewal doesn't depend on one person's credit card. **A lapsed domain renewal is the single most likely way this site disappears.**
- [ ] Notion integration token documented — where it lives, how to rotate it
- [ ] Deploy hook URL saved somewhere findable by a future exec
- [ ] Editor's guide published in Notion (see `notion-schema.md`)
- [ ] `MAINTENANCE.md` complete — every `_TODO_` filled in, especially the access inventory table and the repo tour. **Test it: hand the repo and this file to someone who wasn't involved and ask them to get it running locally and deploy a change.** If they can't, it isn't finished.
- [ ] A named role in the council that owns the website — put it in the by-laws if possible, so it survives the people
- [ ] One live walkthrough with the incoming exec, recorded

## Post-launch

- [ ] Set the scheduled rebuild (12h) and confirm build minutes stay within the free tier
- [ ] Analytics (Cloudflare Web Analytics — free, no cookie banner needed)
- [ ] Check in after one month: is anyone actually posting? If not, the problem is the workflow, not the tooling — go find out where they got stuck.
