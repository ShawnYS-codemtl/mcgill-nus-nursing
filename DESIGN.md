---
name: McGill NUS
description: "Desk by the Window": a student society's desk of index cards under a window onto Mont Royal.
---

# Design System: McGill NUS

The record of how the site looks, written from the built site on 2026-11-08. It replaces the Figma file as the record (CLAUDE.md decision 17). Figma is still a workbench, but it sits in a personal account and may fall behind.

**The values live in code, not here.** Every colour, size, font and shadow is a custom property at the top of `src/styles/global.css`, and `tests/contrast.test.mjs` reads them from there. This file names tokens (`--color-ink`) and never copies their values, so it can't disagree with the site. To change a value, follow `docs/MAINTENANCE.md` → "Changing a colour or font".

## Overview

**Creative North Star: "Desk by the Window"**

The site is a student's desk. A navy cutting mat is the page, a stack of coloured sheets sits on it, and index-card tabs stick out of the top of the stack. Each tab is a section of the site. Posts, council members and resources are white index cards on the sheets, held down with washi tape. The newest post gets one sticky note. Above the desk a window looks out on Mont Royal, and the view changes with the term: fall, winter, summer.

It is two directions the club liked, put together. The stationery comes from "The Desk" and the window from "Mont Royal Poster". The club asked for a "slightly more professional" palette, so it's dark and muted. That leaves one risk: the club's design brief says a polished corporate result would be a failure. The handwriting, the tape and the sticky note keep the site from looking corporate, so they stay through any later trimming.

Everything that has to be read sits level, in one clear typeface, and passes WCAG AA. The playful parts are decoration and asides only.

**Key Characteristics:**

- Physical stationery drawn in CSS: ruled lines, a red margin line, tape, tabs, a sticky note, a lanyard badge. No image files except the window scenes, the lanyard and photos.
- Four fixed section colours, one per tab. Only the window, the sticky note and the tape change with the season.
- One readable typeface (Bricolage Grotesque) and one handwriting face (Gochi Hand), used for three asides and nothing else.
- Phone first. A laptop gets the same sheet as a 720px column centred on the mat.
- No motion, no animation, and nothing that depends on JavaScript. The one inline script only corrects the season.

## Colors

A dark desk with white cards, four muted section colours, and seasonal accents.

### Primary: the four sections

Each tab and its sheet share a colour (`src/config/nav.ts` assigns sections). These never change with the season.

- **Oxblood** (`--color-oxblood`): News, which is the homepage. White text.
- **Mustard** (`--color-mustard`): About, with Council, Fees, Governance and Elections. **Ink text**, because white on mustard fails contrast.
- **Forest** (`--color-forest`): Get involved. White text. It is also the colour of the "Recruiting now" badge.
- **Slate** (`--color-slate`): Resources. White text.

Contact, and the "Page not found" page, sit on the white front page (`--color-card`). On laptops Contact is a white fifth tab.

A sheet's text and link colours come from `--sheet`, `--on-sheet` and `--on-sheet-link`, set per section in `global.css`. A component on a sheet uses those, not a colour token, so it works on every sheet. Cards set ink and pen back.

### Secondary: the season

Set by the `:root[data-season=…]` blocks in `global.css`:

- **Sticky** (`--season-sticky`): the sticky note's paper.
- **Tape** (`--season-tape`): every strip of washi tape, drawn by `--tape` with white stripes over it.

The window scenes use the same two colours, copied into `scripts/scenes.mjs`. Change a season colour in both places.

### Neutral

- **Cutting mat** (`--color-mat`): the page background, under everything. Its grid is `--color-mat-grid` (a line every 26px) and `--color-mat-grid-strong` (every 130px, and the footer's top rule).
- **Card** (`--color-card`): index cards, the badge, chips, the term label, the white front page. Also white text on dark sheets, and the outer half of the focus ring.
- **Ink** (`--color-ink`): text on cards and on mustard. The inner half of the focus ring. The current About chip and the current Contact button are ink.
- **Ink muted** (`--color-ink-muted`): dates, author roles, programs, small labels.
- **Pen** (`--color-pen`): links and link icons on cards, and the handwriting.
- **Rule** (`--color-rule`): ruled lines, `<hr>`, the logo frame, the dashed frame of an open council seat.
- **Margin** (`--color-margin`): the red margin line under a card's heading.
- **Window** (`--color-window`, `--color-sill`, `--color-sill-edge`): the window frame, its crossbars, and the sill.

### Named Rules

**The Fixed Tabs Rule.** The four section colours never change with the season. A visitor finds their way by tab colour, so it has to stay the same all year.

**The Tested Pair Rule.** Every text-on-surface pair the design uses is a line in `tests/contrast.test.mjs`, held to 4.5:1. The focus ring is checked on every surface a control can sit on. If a new colour fails, pick another; don't loosen the test. A new pairing (text on a surface it never sat on before) gets a line in the test first. The test also records the pairs that fail and are therefore never used: white on mustard, pen on mustard (links on the About sheet are ink, underlined), and the tab colours against the mat.

**The Not-Only-Colour Rule.** Colour never carries meaning alone. Links are underlined, or carry an arrow or external icon. The current tab is taller, joined to its sheet, underlined and `aria-current`. The current chip is a different shape (flat) as well as a different colour.

## Typography

**Body font:** Bricolage Grotesque (`--font-body`), a variable font with weight and optical-size axes, falling back to `system-ui, sans-serif`.
**Handwriting font:** Gochi Hand (`--font-hand`), falling back to `cursive`.

Both are committed woff2 files in `src/assets/fonts/`, loaded through Astro's Fonts API (`astro.config.mjs`), so the build fetches nothing. Together they are under 100KB.

**Character:** a friendly grotesque with some quirk at display sizes, and handwriting for notes in the margin. `font-optical-sizing` stays `auto`: titles break where the signed-off screens break only at auto.

### Hierarchy

Each role is a composite `font` token: weight, size, line height and family in one. Sizes are in rem, so the text follows a visitor's browser font size.

- **Title XL** (`--text-title-xl`): a page's `<h1>`, and the lead post's title.
- **Title LG** (`--text-title-lg`): the default `<h2>`. Compact post titles, the verbatim cards' headings, Resources' category headings.
- **Title MD** (`--text-title-md`): the default `<h3>`. Section headings on the homepage and Council, council roles, committee names.
- **Brand badge** (`--text-brand-badge`): "McGill NUS" on the badge, and nothing else.
- **Body** (`--text-body-md`): all reading text. Its line height is `--line`, which is also the pitch of the ruled lines, so text sits on the rules.
- **Body strong** (`--text-body-strong`): link cues ("Read the post", "How to run for council", resource and jump links) and council members' names.
- **Label MD** (`--text-label-md`): tabs, the About chips, the Contact button.
- **Label SM** (`--text-label-sm`): dates, programs, captions, the term label, "Recruiting now", and the tabs below 390px.
- **Label XS** (`--text-label-xs`): "Nursing Undergraduate Society" on the badge.
- **Aside** (`--text-aside`): Gochi Hand. Asides only (the next rule).

### Named Rules

**The Three Asides Rule.** Handwriting appears in exactly three places: the sticky note ("latest!" or "pinned"), "Fun fact!" on a council card, and "you?" in an open seat's empty photo frame. It is never used for anything a visitor must read to get something done, and never for body text, headings or navigation.

**The Full Date Rule.** Dates are written in full everywhere ("October 21, 2026"), from `PostDate.astro`, with the ISO date in `<time datetime>`.

## Layout

**Phone first.** The design starts at 390px wide and must hold at 320. Two breakpoints, written as range queries:

- **Below 390px** (`width < 24.375rem`): tabs go compact so "Get involved" fits at 320, and the left gutter narrows to 8px.
- **From 768px** (`width >= 48rem`), "laptops": the sheet becomes a 720px (`45rem`) column centred on the mat, with a 672px text column inside it. Photos go three to a row (two on phones), and council cards two to a row, each as wide as on a phone.

**The desk column.** `.desk` (in `global.css`) lines up the tab row, the sheet and, on laptops, the header's badge and term label. On laptops the tabs, headings, cards and footer share one left edge.

**The window** spans the full width on every laptop page (236px tall). It stops growing past a 1252px pane so the scene never crops. On phones the homepage gets the full window and every other page a short strip.

**Lists of cards** use `.card-list`: a one-column grid, 12px apart (`--space-3`). The column is `minmax(0, 1fr)`, so one long word wraps instead of widening every card (`docs/MAINTENANCE.md` troubleshooting).

**Spacing** comes from `--space-1` to `--space-12`, on a 4px grid. Components also use exact px values copied from the signed-off screens.

**Long text never scrolls sideways.** `body` has `overflow-wrap: break-word`. An email address gets a break chance after the @ (`EmailLink.astro`). A title's link icon is held to its last word so it never wraps onto a line alone. A word can only break if its box is allowed to shrink, so any grid column that holds text from the CMS is `minmax(0, 1fr)`, never `1fr`, and a flex item holding a name gets `min-width: 0`.

### Named Rules

**The Header Not Hero Rule.** The window takes about a third of a laptop's first screen and a quarter of a phone's homepage before any news. It stays a header and never grows into a hero.

**The No Sideways Scroll Rule.** Every page is checked at 320, 390 and 1280 wide, in Chromium, Firefox and WebKit, with no horizontal scroll. Nothing clips overflow, so a real overflow still shows up.

**The Larger Text Rule.** Some visitors set a bigger default text size in their browser (Chrome's "Large" is 20px, "Very large" 24px). Type and breakpoints are in rem, so they follow it. So a box that holds text is sized in rem or by its content, never a fixed px box around rem text. The header grows to fit the badge, the tabs grow with their labels and move up to a second tier when they don't fit, and the sticky note grows with its handwriting. At the default size all of this is exactly the signed-off design. To check a change, set Chrome's font size to Very large (Settings → Appearance) and look at 320, 390 and a laptop width.

## Elevation & Depth

Depth is physical: paper lying on paper on a desk. Shadows show what is on top of what. Nothing moves or lifts on hover.

### Shadow Vocabulary

- **Card** (`--shadow-card`): index cards, the window frame, the badge, photo prints.
- **Lifted** (`--shadow-lifted`): small things laid on top of a card or the window: the sticky note, the term label, the About chips, the Contact button.
- **Sheet** (`--shadow-sheet`): the front sheet, casting upward onto the sheets behind it.
- **Tab** (`--shadow-tab`): each tab.

**The stack of sheets** behind the front sheet is drawn as extra box-shadows on `main::before` in `Base.astro`, so it needs no markup. Each sheet behind is a step further right and higher, in tab order. On laptops the white Contact sheet is at the back of every stack.

### Named Rules

**The Forced Colours Rule.** Windows High Contrast mode drops backgrounds and shadows, so every surface that depends on them (cards, the sheet, tabs, chips) draws a `CanvasText` border under `@media (forced-colors: active)`. A new surface with a shadow gets one too.

**The Ring On Top Rule.** The focus ring is a 2px ink outline inside a 4px white box-shadow, `!important`, in `global.css`. Without `!important`, a component's own shadow replaces the white half, and the ink line disappears on the mat and the dark tabs. A current tab's focus ring rises above the sheet so it shows on all four sides.

## Shapes

Stationery corners: almost square, softened just enough to read as paper.

- **Cards and sheets** (`--radius-card`): cards, sheets, and the top corners of tabs.
- **Controls** (`--radius-control`): the About chips, the Contact button, "Recruiting now", a committee logo's frame.
- **The badge** (`--radius-badge`): the lanyard badge, rounder, like a plastic ID card.
- **The clip slot** (`--radius-clip`): the slot in the badge where the lanyard clips on.
- **Photos**: 2px corners, as prints.

**Stationery, drawn in CSS:**

- **Ruled lines** (`--rules`): a 1px `--color-rule` line at the foot of every `--line`. On the lead post's summary and the empty-state card.
- **The red margin line**: 2px of `--color-margin` under a card's heading (the lead post, a prose sheet).
- **Washi tape** (`--tape`): a strip in the season's tape colour with white stripes, slightly tilted. Each component sizes and places its own strip.

**Images take the layout's shape, never their own.** The club's photos and logos come in every shape, so each slot crops or frames them: headshots 4:5 (96×120), committee logos whole inside a square frame, gallery prints 4:3, the lead post's cover 16:9. On a post's own page the cover is shown whole, because a flyer's text matters. Every image is optional, and every layout must still look right without it.

## Components

### The window (`src/components/Header.astro`)

The signature. A white frame with crossbars and a sill around a flat-ink view of Mont Royal: autumn, winter or summer.

- **Scenes:** three SVGs in `src/assets/header/`, drawn by **`scripts/scenes.mjs`, which is their source.** To change a scene, edit the script and run `node scripts/scenes.mjs`. Never hand-edit the SVGs, and never export them from Figma (its export is about four times the size). Anything that matters stays between x 540 and 900 of the 1440-wide drawing, which survives the narrowest phone crop.
- **Season:** `Base.astro` builds the page with the build date's season in `data-season` on `<html>`. An inline script resets it from the visitor's date before first paint (January–April winter, May–August summer, September–December fall; `src/lib/season.mjs`). With JavaScript off, the page shows the season it was built in. `?season=fall` (or `winter`, `summer`) previews any season.
- **Lanyard and badge:** the lanyard hangs left of the mountain, clear of the cross and mast. The badge is the home link: "McGill NUS" over "Nursing Undergraduate Society". It is text only until the council sends the logo file. It sits in the header's flow, so the header is as tall as the badge needs: with a larger browser text size the badge hangs below the sill instead of covering the tabs. On the phone strip it hangs just under the Contact button. One value (`--badge-top`) places the badge and sets the lanyard's length.
- **Term label:** a white label taped to the window ("Fall term · 2026–27"). It follows the visitor's real date, even under `?season=`. Hidden on the phone strip.
- **Contact:** on phones, a white button on the window. On the Contact page it is an ink chip with a thin white outline. On laptops it is hidden, and Contact is the fifth tab instead.

### Tabs (`src/components/Nav.astro`)

Index-card dividers sticking up from the stack. They are plain links, not ARIA tabs, because each goes to another page.

- **Default:** the section's colour, its label in `--on-sheet`, `--text-label-md`, rounded top corners, `--shadow-tab`.
- **Current:** taller, joined to its sheet and drawn over it, underlined, and `aria-current` (`page` on the page itself, `true` inside its section).
- **Phones:** four tabs. Contact lives on the window. Below 390px the tabs go compact. If they still don't fit (a large browser text size on a narrow phone), the last tabs move up to a second tier above the first, never off the screen.

### Sheets (`src/layouts/Base.astro`)

The current section's sheet, under its tab, holding the page. The other sheets are stacked behind it (see Elevation). Contact and "Page not found" use the white front page. On laptops, "Page not found" has a thin ink-muted line along its top, so it doesn't look joined to the white Contact tab.

### Index cards (`.card` in `global.css`)

- **Background:** `--color-card`, with ink text and pen links (`--link`).
- **Corners:** `--radius-card`. **Shadow:** `--shadow-card`.
- **Padding:** 16px on council, committee and resource cards; 22px top and 18px sides on post, prose and empty cards.
- Cards in a list sit 12px apart (`.card-list`).

### Post cards (`src/components/PostCard.astro`)

- **The lead:** the pinned post, or else the newest. A ruled card: the date and author role above the title, the red margin line, the cover (if any), then the summary on ruled lines. It carries the one sticky note.
- **Compact** (Featured and More news): title, summary, then "Read the post →" and the date on one row. The whole card is the title link. The cue is hidden from screen readers, so each post is still one link. Featured cards are taped. More news cards are not.
- **A post that is only a link** has no page here. Its title carries the external icon instead of the cue.

### The sticky note

The one tilted, handwritten object near the top of the homepage: the season's sticky colour, pen ink, `--text-aside`, a hand-drawn arrow toward the post. It says **"latest!"** only when the lead has the newest date, and **"pinned"** when a pinned post leads ahead of a newer one, so it is always true. Space beside the title is reserved with a float, so only the lines next to the sticky are shortened. The note, its arrow and the float are sized in rem, so they grow with the handwriting at a larger browser text size.

### Taped photos (the homepage gallery)

White-bordered prints, each tilted slightly (alternating left and right), with a strip of tape across the top. The picture is cropped to 4:3. Captions sit level under the print.

### Verbatim cards

The Land Acknowledgement and the Commitment to Truth & Reconciliation, last on the homepage. **Plain cards: never tilted, taped, stickied or handwritten.** Their text comes from `src/config/` and is never edited (decision 13).

### Council cards (`src/components/CouncilMember.astro`)

The headshot, taped on, beside the role, name and program. Once that column would be narrower than 150px (a long role, or any card at 320), it wraps under the photo, so "Representative" never breaks mid-word. Below: "What this role does", then the handwritten "Fun fact!", then the email. **An open seat** shows a dashed empty frame saying "you?" (hidden from screen readers), "Position open", and a link to Elections.

### Committee cards and pages (`CommitteeCard.astro`, `src/pages/involved/[slug].astro`)

The logo (64px on the card, 96px on the page, in a framed white square) beside the name. The name is the link: an arrow to the committee's page, or the external icon when it links out. A forest "Recruiting now" badge when the committee is looking for members. On the page, the Instagram link's icon stays at the card's right edge while a long name wraps.

### Resource cards (`src/pages/resources/index.astro`)

Grouped by category under a heading with a thin rule under it in the sheet's colour. Each card: title, description, then a link with its label and an arrow (a page on this site) or the external icon.

### Prose sheets (`.prose-sheet` in `global.css`)

Text from the CMS, which arrives as Markdown with no classes. The heading (and a post's date line) sits over the red margin line, then the text. 12px between blocks, and 24px above a heading that follows text. On a coloured sheet it is a card. On Contact and "Page not found" it lies straight on the white page.

### Chips and links

- **About chips** (`AboutIndex.astro`): white, lifted, `--text-label-md`. The current page's chip is flat ink with an underlined white label.
- **Jump links** (`JumpLinks.astro`): "On this page", under the heading on Council and Resources. They take the sheet's text colour, as headings do, with a downward arrow.
- **Text links:** underlined by default (`global.css`). Links that carry an arrow or external icon drop the underline.
- **Icons** (`Icon.astro`): only two, an arrow and an external-link mark, 18px, drawn in the text colour and hidden from screen readers. The link's words say where it goes.

### Empty states

A blank ruled card with one plain line ("No posts yet. Check back soon."). They are real states, not edge cases: a quiet month will happen.

### Footer (`src/components/Footer.astro`)

On the mat, below the sheets, in white: the contact email, office address and hours, the social links that are filled in, and a link to the Land Acknowledgement.

## Do's and Don'ts

These restate CLAUDE.md decision 17 and the club's design sign-off (CLAUDE.md §12, 2026-11-05). Their reasons are recorded there.

### Do:

- **Do** use a token. Never type a hex value or a new shadow into a component: use the token in `global.css`, or add one there.
- **Do** use real dates. "Latest" is allowed because it's always true; the sticky checks that it is.
- **Do** keep the handwriting, tape and sticky note through any redesign or trimming. Without them the site turns into the polished corporate result the brief calls a failure.
- **Do** make every image optional. Each slot sets its own aspect ratio, and every layout must look right with no image at all.
- **Do** design the empty and crowded states: no posts, three posts and three hundred must all look intended.
- **Do** check a change at 320, 390 and 1280 wide, and every season with `?season=`.
- **Do** give every new surface with a background or shadow a `forced-colors` border.

### Don't:

- **Don't** change a tab's colour with the term. Only the window, sticky and tape follow the season.
- **Don't** tilt anything that has to be read. Tilt is for tape, the sticky note and photo prints. Captions, cards and verbatim texts sit level.
- **Don't** put more than one sticky note on a screen.
- **Don't** use "today", "new" or "this week" labels. The site rebuilds only when someone saves, so they would go stale in a quiet month.
- **Don't** let the changing window stand in for fresh posts. The view changes on its own. The news has to be posted by someone.
- **Don't** let the window grow into a hero (the Header Not Hero Rule).
- **Don't** use handwriting outside the three asides (the Three Asides Rule).
- **Don't** decorate the Land Acknowledgement or the Commitment to Truth & Reconciliation: no tape, tilt, sticky or handwriting.
- **Don't** put pen-coloured links or white text on mustard. Both fail contrast.
- **Don't** tape More news cards. Only Featured cards are taped.
- **Don't** add motion, carousels, autoplay or hover lifts. Nothing on the site moves.
- **Don't** hand-edit or Figma-export the window scenes. Edit `scripts/scenes.mjs`.
