# Content Inventory — Existing Wix Site

Source: `https://nusnursing.wixsite.com/website` (live on `mcgillnus.ca`), crawled August 2026.

**Disposition key**
`MIGRATE` — carry over, content is current
`REWRITE` — carry the page, content is stale or wrong and needs new copy from the council
`ARCHIVE` — do not carry to MVP; confirm with club before deleting
`LINK` — external destination, keep as an outbound link only

---

## Homepage

| Element | Disposition | Notes |
|---|---|---|
| Logo + "The McGill Nursing Undergraduate Society" + mission paragraph | MIGRATE | Two sentences: student-run representation for ISoN undergrads, represents both BScN and BNI students. |
| **Land Acknowledgement** | MIGRATE **verbatim** | Acknowledges unceded Indigenous territory, Haudenosaunee and Anishinaabeg, Kanien'keha:ka Nation as traditional custodians. Do not paraphrase, reword, or "improve" this text. |
| **Commitment to Truth & Reconciliation** | MIGRATE **verbatim** | References Joyce's Principle and systemic inequities in Indigenous health outcomes. Same rule — exact text only. |
| "Website Contents" wayfinding block | ARCHIVE | A four-item explanation of the nav menu. If the new nav needs explaining, the nav is wrong. |
| "Events & Announcements" module | REWRITE | Currently empty — literally says "None for now!! / Nursing School is rough sometimes so we will update you soon!" Replaced by the Posts system. |
| "LINKS" featured block | MIGRATE (as a component) | Four featured items → detail pages. This block is the club's existing hand-rolled newsletter; it becomes the homepage featured-links component driven by Notion. |
| Photo gallery (~14 images) | MIGRATE → **Gallery DB** | Event photos. Re-source originals if possible; Wix CDN versions are compressed and cropped. Loading them into the Gallery DB rather than committing them as files is what keeps the homepage from freezing at launch — execs can add photos after each event. |
| Social icons | MIGRATE | Instagram `@mcgillnus`, TikTok `@mcgillnus`, Facebook `McGillNUS`, LinkedIn `company/mcgillnus`. |
| Instagram feed embed | ARCHIVE (→ Later) | Fragile. See CLAUDE.md §7. |
| Contact block + form | MIGRATE | Folded into the Contact page; homepage keeps a short contact CTA. |

### Featured link detail pages (from the LINKS block)

| Old URL | Content | Disposition |
|---|---|---|
| `/general-9` | **Nursing 21st Century Fund** — new fund providing NUS financial support for student research | MIGRATE → becomes a Post or a static page |
| `/general-8-1` | **NUS Equity Committee** — signup, Instagram `@equitynus`, Microsoft Forms signup link | MIGRATE → Committees DB |
| `/general-8` | **Student Mistreatment Policy** (2024) — reporting policy and form. Contact: `nusequitycommissioner@mail.mcgill.ca` | MIGRATE, form stays external |
| — | **NUS Athletic Committee** — links to an Instagram post, no page of its own | REWRITE → give it a real Committees DB entry |
| — | **EN-FR Nursing Dictionary** (collab with UdeM) — Google Drive PDF | MIGRATE → featured link. Note: an active project, cover-art contest ran August 2026. |

---

## About

| Old URL | Page | Disposition | Notes |
|---|---|---|---|
| `/about` | A Bit About Us | MIGRATE | Mandate: liaison between faculty and students, contact with campus orgs and national nursing groups. Organises extracurriculars (Nursing-Engineering parties, Nursing Auctions, CNSA, Nursing Games, apparel). Explains class representatives. Still accurate. |
| `/constitution-by-laws` | Constitution & By-Laws | MIGRATE | Thin page; the substance is a PDF at `mcgillnus.ca/_files/ugd/0a9b8d_6c6e7a950bb946b382f21e47eec111e3.pdf`. **Download this file before the Wix site is decommissioned.** |
| `/nus-council` | NUS Council 2025–26 | MIGRATE → **Council DB** | The single highest-churn page. Full roster below. |
| `/past-nus-councils` | Past Councils | Fast-follow | Same DB, filtered by `Term`. |
| `/nus-council-meetings` | Meeting Minutes | Fast-follow | Explains any nursing student may attend and access minutes. Links to four Google Drive folders: Fall 2024, Winter 2025, Fall 2025, Winter 2026. Contact `nus.nursing@mail.mcgill.ca` to attend. |
| `/ingram-school-of-nursing-ison` | About ISoN | MIGRATE | Verify content is current against mcgill.ca/nursing. |

### Council roster — 2025–26 (source data for the Council DB)

**Executive Council** — "governs the NUS in a manner consistent with the policies set out by the NUS General Council"

| Role | Name | Program | Email |
|---|---|---|---|
| President | Alex Bilodeau | U3 BScN | president.nus@mail.mcgill.ca |
| Director of Logistics | Sabrina Wang | U2 BScN | nus.nursing@mail.mcgill.ca |
| Director of Financial Affairs | Andrea Lian | U3 BScN | finance.nus@mail.mcgill.ca |
| Director of External Affairs | Alyson Vogel Mardinger | U3 BScN | external.nus@mail.mcgill.ca |
| Director of Internal Affairs | Sophie Bujold | U3 BScN | internal.nus@mail.mcgill.ca |
| Director of Academics | Jane Soh | U2 BScN | academics.nus@mail.mcgill.ca |
| Director of Sustainability | Justine Li | U2 BScN | globalhealth.nus@mail.mcgill.ca |
| Equity Commissioner | Melanie Xie | U2 BScN | nusequitycommissioner@mail.mcgill.ca |

**General Council** — Executive plus elected representatives, coordinators, and officers

| Role | Name | Program | Email |
|---|---|---|---|
| Opportunities Coordinator | Lili-Rose Poitras | U3 BScN | opportunities.nus@mail.mcgill.ca |
| Sponsorship Coordinator | Laurence Carrière | U3 BScN | sponsorships.nus@mail.mcgill.ca |
| Nursing Senator | William Kallianiotis | U2 BScN | nursingsenator@ssmu.ca |
| SSMU Representative | Alex Yam | U2 BScN | nursingrep@ssmu.ca |
| Café Coordinator | Alison Chow | U3 BScN | alison.chow@mail.mcgill.ca |
| CBNA Representative | Marie Fébro | U3 BScN | yelciata.febro@mail.mcgill.ca |
| Indigenous Awareness Representative | Franny Hansen | U3 BScN | frances.hansen@mail.mcgill.ca |
| U3 BScN Representative | David Sun | U3 BScN | david.sun2@mail.mcgill.ca |
| U3 BNI Representative | Olivia Francisco | U3 BNI On-Campus | olivia.francisco@mail.mcgill.ca |
| U3 BNI Online Representative | Florence Morin | U3 BNI Online | florence.morin2@mail.mcgill.ca |
| U2 BScN Representative | Anna Sakamaki | U2 BScN | anna.sakamaki@mail.mcgill.ca |
| U2 BNI Representative | Seralathen Sivappiragasam | U2 BNI On-Campus | seralathen.sivappiragasam@mail.mcgill.ca |
| U2 BNI Online Representative | Allison O'Reilly | U2 BNI Online | allison.oreilly@mail.mcgill.ca |
| U1 BScN Representative | Alina Li | U1 BScN | alina.li@mail.mcgill.ca |
| U0 BScN Representative | *VACANT* | — | — |

Every member also has a one-to-three sentence **role description** and a **fun fact** on the current site — migrate both, they're a large part of the page's warmth. Note the existing page has a broken mailto (Director of Academics uses `http://` instead of `mailto:`); don't reproduce the bug.

Also on the page: a **NUS Council Structure diagram** (PNG, ~1545×1996). Reused on the Elections page. Worth recreating as an SVG or accessible HTML — as a raster image it's unreadable on mobile and invisible to screen readers.

**Design implication:** 23 people with photos, bios, and fun facts is a lot of page. Whatever layout `impeccable` produces must handle a VACANT row, a missing photo, and a three-sentence role blurb next to a one-line one.

---

## Student Services

| Old URL | Page | Disposition | Notes |
|---|---|---|---|
| `/get-involved-1` | Ways to Get Involved | MIGRATE → **Committees DB** | Card grid, 10 entries. |
| `/helpful-resources` | Helpful Resources | MIGRATE → **Resources DB** | 15 entries. Best-structured content on the site. |
| *(external)* | Elective Courses for U3 | REWRITE → **Electives DB** | Currently one Google Drive PDF. Becomes the filterable explorer. |
| `/ntc` + 2 subpages | Note-Taking Club | ARCHIVE | NUR1 300 Pharmacology 1 (Fall 2019 only), NUR1 301 Pharmacology 2 (Winter 2018 only). Seven years stale. |
| *(external)* | Textbook Marketplace | LINK | Facebook group `349210685468204`. |

### Get Involved entries

| Entry | Current link | Disposition |
|---|---|---|
| Canadian Nursing Students' Association (CNSA) | `/canadian-nursing-students-associati` | MIGRATE |
| Nursing Peer Mentorship Program (NPMP) | mcgill.ca | LINK |
| Canadian Black Nurses Alliance (CBNA) | `/canadian-black-nurses-alliance-cbna` | MIGRATE |
| Swab the World | `/swab-the-world` | MIGRATE |
| Nursing Social Committee | `/blank-page` | MIGRATE — check for real content; the slug is not encouraging |
| Graduation Committee | `/blank-page-1` | MIGRATE — same caveat |
| McGill Nurses for Global Health (MNGH) | `/mngh` | MIGRATE |
| McGill Nurses for Planetary Health (MNPH) | `/mcgill-nurses-for-planetary-health-mnph` | MIGRATE |
| Vascular Access Student Club (VASC) | cvaa.info | LINK |
| NUS Equity Committee | `/general-8-1` | MIGRATE |
| *(missing)* NUS Athletic Committee | — | ADD — referenced on the homepage but has no entry here |

### Helpful Resources entries — all 15

Each has a title, a descriptive paragraph, and a "Learn More" link. Fields map cleanly onto the Resources DB.

1. **Nursing Textbook Resources** — shared Drive folder of textbook PDFs
2. **Nursing Student Handbook** — mcgill.ca/nursing/students/student-handbooks (grading, GPA, Minerva course selection, professionalism)
3. **Financial Aid Resources** — Drive PDF: Canadian Nurses Foundation, McGill Financial Aid, OIIQ scholarships, Quebec Perspective Scholarship, entrance bursaries
4. **Student Mistreatment Policy** — internal page + external report form
5. **Mental Health Resources | SSMU** — ssmu.ca/resources/mental-health
6. **The WELL Office** — academic and wellness support for ISoN/SPOT/SCSD learners, counselling, group sessions
7. **Office for Respectful Environments (ORE)** — mistreatment reports in clinical settings
8. **International Institute of Strengths-Based Nursing and Health Care** — sbnhc.org
9. **Students' Society of McGill University (SSMU)** — ssmu.ca
10. **McGill Library | Nursing** — subject guides, room booking
11. **RNAO** — Nursing Best Practice Guidelines
12. **OIIQ** — Ordre des infirmières et infirmiers du Québec
13. **Bates' Visual Guide to Physical Examination** — 8+ hours of technique video
14. **McGill University Health Centre (MUHC)** — muhc.ca
15. **Education Loan Finance (ELFI)** — student loan refinancing guide

Suggested categories for the new directory: *Academic*, *Financial*, *Wellbeing & Safety*, *Clinical & Professional*, *Governance*.

---

## More

| Old URL | Page | Disposition | Notes |
|---|---|---|---|
| `/programs` | Elections 2026–27 | MIGRATE | Winter 2026 election notice, contacts `andrea.lian2@mail.mcgill.ca` and `president.nus@mail.mcgill.ca`, by-laws PDF, structure diagram. Note the slug is `/programs` for a page called Elections — fix in the new IA. Content is date-bound; consider making it a Post rather than a permanent page. |
| `/fees` | Fees | MIGRATE | **NURF:** Nursing 21st Century Fund Fee, non-opt-outable, $5.00/semester, established 1994, funds professional development initiatives. **NUSF:** funds National Nursing Games, CNSA regional/national conferences, annual career fair, frosh, graduation, meet & greet, CNSA membership, community donations. Changes require a student referendum. |
| `/sponsors` | Sponsors & Collaborations | **REWRITE — do not migrate as-is** | Written in the first person by a sponsorship coordinator who is no longer on council (current holder is Laurence Carrière). Lists an Evenko discount partnership with events dated **2024** — Disney on Ice, Harlem Globetrotters — and a Nurse IQ discount code `MNUS10`. Contact email is a personal Gmail and an Instagram handle. Needs entirely new copy and a structure that doesn't bind sponsor content to one person's identity. |
| `/listserv` | Listserv/Newsletter Submission | MIGRATE | Embedded form for students requesting a newsletter blast to the student body. |
| `/calendar` | Calendar | ARCHIVE → Fast-follow, conditional | Titled "NUS Calendar 2024-2025." Only rebuild if an exec commits to owning it. |
| `/contact` | Contact Us | MIGRATE | Office hours vary; council members contactable directly or via `nus.nursing@mail.mcgill.ca`. **680 Rue Sherbrooke Ouest, Suite 1923, Montreal, QC, H3A 0B8.** Links to the council roster. Has a submit form. |

---

## Cross-cutting notes

**Where the `MIGRATE` prose actually lands.** The six informational pages — About, Constitution & By-Laws (→ Governance), ISoN, Elections, Fees, Contact — are loaded into the **Pages DB**, not written into the repo as hardcoded prose. Migration is therefore a content-entry job in Notion, and every one of these pages stays editable by a council exec afterwards. This matters most for Elections (date-bound, rewritten annually) and Fees (changes by referendum). See `notion-schema.md` §6.

**External dependencies to preserve.** Several Google Drive links are load-bearing: textbook folder, financial aid PDF, elective courses PDF, EN-FR dictionary PDF, four meeting-minutes folders. Confirm these live in an **NUS-owned** Drive, not a graduating student's personal account. This is the same handover risk as the GitHub and Notion accounts.

**Assets to extract before decommissioning Wix.** The by-laws PDF, the council structure diagram, the logo (several variants: `NUS LOGO v2 transparent`, a wordmark used in the header at 400×120), and the homepage gallery photos. Wix CDN URLs stop working when the site comes down.

**Contact emails follow a pattern** — `{role}.nus@mail.mcgill.ca` — with exceptions for cohort reps (personal McGill addresses) and SSMU roles (`@ssmu.ca`). Worth noting in the Council DB guidance so future execs keep the convention.

**Tone.** The existing copy is warm and unpolished — fun facts about raccoons and instant ramen, a coordinator calling herself the "Sponsor-Rizzer." That voice is an asset and the reason students read the page at all. Preserve it. Do not professionalise this site into a corporate brochure.
