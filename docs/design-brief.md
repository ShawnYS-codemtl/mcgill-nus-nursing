# Design Brief

> Input for the `impeccable` plugin. This file states the constraints and the problems to solve. It deliberately does **not** specify a visual direction — that's the plugin's job.

## Who this is for

McGill undergraduate nursing students, roughly 18–24, across BScN and BNI programs, on-campus and online. They are chronically short on time, frequently on their phones between clinical placements and lectures, and they already follow the NUS on Instagram. The website competes for attention with an Instagram account that is far better at being fun.

Secondary audiences: prospective students deciding whether McGill nursing has a real community, faculty, and potential sponsors.

## What the design has to accomplish

**1. Make the homepage feel alive.** The brief from the club is "home page as a newsletter." The failure mode of the current site is a homepage that looks identical in March and October. Someone landing on it should be able to tell, within two seconds, that something happened recently. Freshness is the primary design problem.

**2. Give people a reason to come back.** They should leave knowing there's something here they'd want to check again — an event, an open position, a resource they didn't know existed.

**3. Make the resource layer genuinely scannable.** Fifteen resources and eventually a large elective catalogue. A student who doesn't know what elective to take should find their way there without reading a nav menu.

**4. Survive neglect.** Whatever is designed will be filled by a rotating cast of busy students. It must look intentional with three posts, and with three hundred. Layouts that only look right when perfectly populated will not stay looking right.

## Constraints

- **Mobile-first, decisively.** Assume the median visit is a phone, arriving from an Instagram bio link.
- **English only.** No language switcher, no locale prefixes. That said, don't design components whose layout depends on a label being exactly the length it is today — role titles, committee names, and post headlines already vary a lot, and French is the likeliest future addition.
- **Accessibility is not optional.** WCAG 2.1 AA minimum. This is a healthcare-adjacent student body; some of them are learning about accommodation in their own coursework. Semantic HTML, real focus states, keyboard navigation, AA contrast, no colour-only signalling.
- **Performance.** Static Astro, minimal JavaScript. One interactive island (electives filter). Assume poor hospital wifi.
- **Free assets only.** System font stacks or a properly licensed open font. No paid icon sets or stock photography.

## Brand inputs

- **Logo:** existing NUS logo, transparent PNG. Also a wordmark used in the current header at roughly 400×120. Vector originals to be confirmed.
- **Palette:** open. There is no existing brand palette, and the club has explicitly given latitude to make the site look better. McGill's institutional red is *available* as a reference point but is not a requirement, and leaning on it too hard risks looking like a faculty page rather than a student society.
- **Photography:** an existing library of event photos — potlucks, socials, clinical skills sessions, group shots. Real students, not stock. Use them; they're the strongest asset the club has.
- **Voice:** warm, unpolished, funny. The current council bios include a president whose fun fact is a stated preference for raccoons and a coordinator who titled herself "Sponsor-Rizzer." That register is not a bug to be cleaned up — it's the reason students read the page. The design must have room for it. **A polished corporate result would be a failure, even a beautiful one.**

## Components needing specific attention

**Homepage newsletter block.** The hardest problem here. Needs to work when the latest post is a two-line announcement and when it's a full newsletter with images. Consider how it looks when nothing has been posted in a month — that state will happen, and it shouldn't look broken.

**Council roster.** 23 people. Executive and General sections. Variable-length role descriptions (one line to four), fun facts, some missing photos, at least one vacant position rendered as a "position open" call to action. Photo aspect ratios in the source data are wildly inconsistent — the layout must impose its own.

**Resource directory.** Fifteen items across five categories, each with a title, a paragraph, and an outbound link. Scannability over decoration.

**Committee cards.** Ten to eleven entries with logos of inconsistent quality and dimensions. Some link off-site, some to detail pages. Some carry a "recruiting" badge.

**Electives table.** Dense tabular data with filters. Must be usable on a phone — a horizontally scrolling table is a last resort, not a plan.

**Land acknowledgement.** Appears on the homepage in full. Its treatment should be considered and respectful, not a small-print footer item and not a decorative banner. This text is migrated verbatim and is not to be edited.

## Explicit non-goals

- Not an Instagram clone. It should complement the social accounts, not compete on their terms.
- No carousels, no auto-playing anything, no scroll-jacking, no cursor effects.
- No dark-pattern engagement mechanics. The audience is students, and the club has a stated equity commitment.
- No dependency on decorative imagery being present — every image must be optional in practice.
