# Website v3: the record is the page

Date: 3 November 2026. Status: proposed, waiting for the founder's "go ahead". Supersedes the visual direction in `2026-11-02-website-rebuild-plan.md`; the content rules, routes and form logic from that plan stay.

Research behind this plan (scratchpad, not committed): a live Chrome walk of all 26 reference sites at 1440 and 390 px with scroll steps, menus and mobile drawers (`LIVE-WALK.md`), four design critiques of the same sites (`CRITIQUE-*.md`), a teardown of assay.wtf, its docs and both GitHub repos (`ASSAY-TEARDOWN.md`), and the earlier audience and proof-of-reserves studies.

## 1. Why the current build fails

The founder's verdict: the November 2 build copied Strimz's structure. The live captures confirm it. These devices appear on Strimz and on the current Solva build in the same order: floating pill header with a circular theme toggle, a rounded inset hero panel with a ring or particle field, a green-dot pill tag above the headline, a morphing audience word, a tilted product card with a border beam, a four-column fact strip under the hero, a sticky how-it-works with a swapping mock, stacked rounded feature panels, a rounded dark CTA band, and a giant gradient wordmark in the footer. Any one of them is ordinary; all of them together is the Strimz template, which is also the generic SaaS template that Base, Starknet, Ult and half of the reference set fall into.

The second problem is register. Solva sells to the operations or compliance lead of an anchor and to the founder or CFO of a custodial app. Those readers trust ledgers, dated figures and plain method. The current site talks to them with a SaaS vocabulary: pills, glows, tilted cards, isometric clipart, a "Proof of reserves, recorded on Stellar" badge that says nothing a reader can check.

The third problem is the bar a reviewer will now hold us to. Assay (assay.wtf) is a weekly crawler of SEP-1 reserve links with a public board and two small testnet contracts. It has no cryptographic proof, one contributor and zero stars. But every number on it is dated and sourced down to the ledger, it has a method page written like a statistics office, it shows "unknown" rather than faking data, and it prints every testnet transaction hash. A reviewer who reads both sites will compare honesty before design. Solva's real advantages (a zero-knowledge proof of liabilities over a Merkle sum tree, on-chain UltraHonk verification at about 0.012 XLM, per-customer inclusion checks that never publish a balance, institution self-publishing by passkey wallet) are not visible above the fold today.

## 2. Is the current look made for Solva's readers?

No. The test is simple: cover the logo and ask who the page is for. The current site could sell payroll software. What the three readers need to see, in order:

1. The compliance lead at a small anchor: what a record is, what it proves and does not prove, what it costs them in effort, and that no customer data leaves their systems. They read method pages and footnotes. They distrust gradients.
2. The founder or CFO of a custodial app: that a lending pool or wallet can read the record for free, that holders can check themselves, and that the institution keeps control of its entry. They read the integration call and the control story.
3. The SCF reviewer (before 8 November): that the thing works on testnet today, with transaction hashes, that the claims are scoped, and that the team ships.

None of these readers is helped by a morphing word or a tilted card. All of them are helped by a real record, dated, with a verification they can click.

## 3. The idea

One sentence, filled from the subject and not from the category:

> On this page, **the daily coverage record** becomes **the layout**: every chapter is a part of one record being made, and the Seal's tick ring is the only instrument that moves.

The competitor test passes. Assay's page is a board about other people's links; Strimz's page is a product tour; Circle's is a platform catalogue. No reference site renders a cryptographic record as the page.

Three decisions follow.

**The tick is the one owned device.** A short stroke from the Seal ring (2 by 12 px, chartreuse) marks the leading edge of every evidential element: the live figure, a verified row, the active chapter, the primary button. Nowhere else. The accent lands on under five percent of pixels, which is what every credible reference does with its colour.

**The Seal is an instrument, not a logo lock-up.** The same tick ring reads three ways across the site: as a coverage meter (ticks fill to the coverage percent, today's tick chartreuse, a short record shows the gap, a stale one shows dashed), as a calendar (ticks are days, missed days hollow), and as a progress ring (one arc per chapter of the how-it-works). It is drawn from `seal-geometry.ts`, which already exists.

**Paper ledger, not dark SaaS.** Two full-height hairline rails frame a 1200 px column on the paper ground. Hairlines separate content; there are no cards with shadows, no rounded inset panels, no gradients, no glow. Dark mode is the same ledger on near-black ink paper, not a different design. One near-black band per page at most, used to mark one chapter.

## 4. The system

### Type

- Bricolage Grotesque for display, at weight 400 and 500 only, 64 to 88 px on desktop, 40 px on phones. Never the 600 to 700 weights at 72 px that Strimz uses; that is what makes two sites read as siblings regardless of layout. Headlines are two lines or fewer at every width, sentence case, no full-stop gimmicks.
- Hanken Grotesk for running text at 17 to 18 px, full ink. Grey is for secondary notes only.
- IBM Plex Mono is the evidentiary voice: anything a ledger or the prover attested is mono (dates, ledger sequences, hashes, ratios, status words, chapter indices, button labels in uppercase at 11 to 12 px with 0.08 em tracking). Human sentences are never mono. This single rule gives the site its register.
- One italic phrase per page at most, Bricolage italic, for emphasis in a human sentence.

### Colour

- Light: paper `#F5F4EE` class ground, ink near-black, hairline at 10 to 12 percent ink. Dark: near-black ground, paper ink, hairline at 14 percent paper.
- Chartreuse `#CFE524` only as state: the tick, the live dot, the active rule, the primary button. It never fills a surface or a headline word. The three coverage states keep their own colours (covered, short, stale) because those are data, not brand.

### Layout primitives

- Rails: two 1 px vertical lines at the column edges, full page height, with a 12 px tick at every section boundary. On phones the rails collapse to the 16 px gutters and the ticks remain in the left gutter.
- Chapter index: a mono `01` to `06` in the left gutter, sticky on desktop, with a 2 px active rule.
- Ruled cell: a hairline box with square corners; stat strips, record fields and tables are ruled cells. Corner registration marks (four small `+` glyphs) only on the live registry frame.
- Provenance line: a 12 px mono line under every figure: `LEDGER 54,201,113 · 2026-11-03 00:00 UTC · TX 7f3a…c21e`. Where the figure is aspirational (allowed by the content rules) the line names the scenario (`EXAMPLE · KESTREL ANCHOR · ARSK`), never "sample data".
- Status stamp: the existing `StateStamp`, squared, mono, with the tick.
- Chapter divider: a 16 px Seal glyph centred on a hairline.
- Section cadence: one rhythm, `clamp(72px, 10vw, 144px)` between chapters; headlines alternate left and right; two content widths (1200 for records and tables, 1040 for prose) so sections visibly nest.

### Motion

- GSAP, ScrollTrigger and Lenis stay (the dependencies exist and the gate already respects reduced motion). What changes is what they do: pinned chapters that advance a figure, a travelling marker on the rails, ticks filling on the Seal, odometer digits only on numbers that move (ledger sequence, seconds since the last record). No tilt, no beam, no particles, no morphing word, no confetti.
- Every pinned chapter renders its final state without JavaScript and under `prefers-reduced-motion`.
- Mobile keeps the sequence but unpins: each chapter becomes a stacked figure plus text, since every reference site that pinned on mobile broke there.

### Imagery

- Drawn figures in brand primitives (hairlines, ticks, rings, square nodes), in the palette's real colours, one chartreuse mark per figure. They explain the mechanism: balances entering a tree, the root sealed, the proof verified, the record written.
- Real product screens as evidence, cropped and scaled like documents: the record sheet, the inclusion check result, the registry table, the lending-pool rule. No browser chrome, no tilt.
- The isometric clipart (`iso-art.tsx`), the border beam, the morph word and the tick-rings backdrop are deleted. The Insights etchings stay as article covers only.

## 5. Home: the scroll journey

Six chapters, each a part of one record being made. Chapter indices in the gutter.

**00 Opening (paper).** Full-width headline in Bricolage 400, two lines: "Reserve coverage, proven daily, on Stellar." Under it, one supporting sentence and the primary action "Talk to us" with the secondary "Read the method". Right of the headline, inline with the baseline, the Seal as a live meter at 160 px with the latest coverage in mono inside it and the provenance line beneath. Below the fold line, not a fact strip but a stat sentence in Hanken 26 px: "3 example records · covered 103.61% · ledger 3,412,088 · next record in 22 hours", numbers in ink, words in grey. No badge, no border, no rounded panel, no dot grid.

**01 The record.** The record itself, rendered as a full-width document in ruled cells: institution, asset, date, reserves, liabilities, coverage, state, ledger, proof hash, verifier. The chapter heading right-aligned: "One record, every day." A dotted-leader breakdown under the figure (Reserves … Liabilities … Surplus …). A calendar field of daily records runs behind the chapter as texture: 52 by 7 small ticks, sealed days in ink, missed days hollow, today chartreuse.

**02 How a record is made (pinned).** A persistent horizontal baseline holds the 100 percent coverage line across the stage. Left, a scroll-spy index: 01 Balances, 02 Tree, 03 Proof, 04 Verify, 05 Record. Right, one figure anchored to the line: balances enter as mono rows, collapse into a Merkle sum tree, the root passes through the tick ring (the verifier), reserves rise above the line, and the record is stamped. Each step carries a bracketed mono stamp: `[LEDGER 3,412,088 · 2026-11-02 · VERIFIED]`. The Seal in the margin gains one arc per step. This replaces the sticky how-it-works tour and the record-flow diagram.

**03 What it proves, and what it does not.** A two-column ruled table, plain language: proven (every customer balance is counted, the sum is below reserves, no balance is published), attested (reserve figures come from the institution's named sources), not proven (that off-chain cash exists). The counter-example sits above it: the sentence every issuer publishes ("backed 1:1 with reserves"), then the first one a reader can check. This chapter is the answer to Assay's method page and to the reviewer's first question.

**04 Who reads it.** A vertical-rule accordion, not three cards: Anchors, Custodial apps, Partners (wallets, lending pools, auditors). Each row opens to one sentence and one real screen: the anchor's asset page, the custodial app's inclusion check, the lending pool's `is_covered` rule drawn as a policy mock. Each row ends with the tick and a link to its page.

**05 Check it yourself.** The coverage check (already built as a slider) becomes an instrument in a bracket frame with registration marks: move reserves against liabilities, watch the Seal fill, the state stamp change and the provenance line update. Beside it, the inclusion check: paste an account, see "included in the record for ARSK at ledger N" with the Merkle path. One live thing per page; this is it.

**06 Questions, then the close.** The FAQ as hairline rows on a six percent tint ("Is this an audit?", "Where do reserve numbers come from?", "What happens on a short day?"). Then two paper cards to close, side by side: "Put an asset on the record" (institutions) and "Read a record" (partners and auditors). No dark band.

**Footer.** Mono, in the rails: columns of links, the testnet notice ("Testnet. Pre-audit. Nothing here is an audit or investment advice."), the verifier contract ID and circuit hash printed like a key fingerprint, a status dot fed by the orchestrator when it is live, the theme toggle repeated, and the Seal glyph. No wordmark watermark.

## 6. The other pages

Every page keeps the rails, the chapter index and the opening pattern (headline, one sentence, the figure inline). Each owns one device so the site does not repeat itself.

- **Anchors**: opens on the anchor's public asset page as the figure; chapter on supply read from the ledger versus reserves attested; the "what your holders see" screen; control by passkey; cost in XLM per record with the provenance line; FAQ.
- **Custodial apps**: opens on the inclusion check; the privacy chapter (what leaves your systems: a root, not a balance); the record compare (a monthly PDF versus a daily record, counted: 1 document, 30 to 90 days stale, 6 parties versus 1 record, daily, checkable by anyone); FAQ.
- **Partners**: opens on the `is_covered` call in Rust and TypeScript with the testnet contract ID; a table of verdicts and their meaning; the lending-pool rule as a policy mock; the auditor's export as a dated table; alerts.
- **How it works**: the long form of chapter 02 with the technical detail: circuit, host functions, proof size, verification cost, cadence, and the "never does" list.
- **The coverage record**: the record sheet as a document, the history table, the three readers' views.
- **See it work** (demo): the instrument from chapter 05 at full size with the step notes.
- **Method and limits** (replaces the current Trust page content, keeps the `/trust` route): written for a risk officer, dated and versioned: what is proven, what is attested, what is not, trust assumptions, staleness, the audit plan, corrections and right of reply, a changelog.
- **About**: the origin, the principles, how the registry is run, no team pictures and no company name.
- **Insights, Contact, Waitlist, Legal, 404**: restyled to the system; forms keep their logic; the contact page's hero figure is the record a pilot ends with.

## 7. Navigation

- Header: a full-width hairline bar, not a floating pill. Wordmark left, mono uppercase section labels (Solutions, Product, Company, Docs), the theme toggle as a 32 px ruled square with the moon or sun, "Talk to us" as the one chartreuse button. On scroll the bar gains a bottom hairline, nothing else.
- Desktop menus: a ruled panel under the bar, three columns of title plus one-line description, no icon tiles, and one featured cell that shows the latest record.
- Mobile drawer: the reported bug (the list stops at "Trust") is a scroll problem, not a content problem. The panel is a top-layer popover with `overflow-y-auto`, but Lenis intercepts touch scrolling at the document level, so the inner list cannot scroll on a phone. Fix: mark the panel `data-lenis-prevent`, stop Lenis while the popover is open, make the panel a flex column with a scrollable list region and a pinned action row, and reduce the list to one line per link (no icon tiles) so all nine links plus Docs and the two actions fit on a 390 by 844 screen without scrolling.

## 8. Standing against Assay without copying it

What the site will show that Assay cannot:

1. A verified proof above the fold: the record with its verification transaction. Where a real testnet transaction exists in the repo, the provenance line links to it on the explorer. Where it does not yet, the line names the scenario and the page says so in plain words.
2. The category sentence, once, on the home page: "Registries record what an issuer says. Solva verifies that every customer balance is covered, without publishing any." No competitor is named.
3. The inclusion check as a public instrument.
4. `is_covered(issuer, asset)` documented with snippets and the testnet contract ID, and a verdict table.
5. The method and limits page written for a risk officer.
6. Provenance under every number, including the aspirational ones, which are labelled as examples rather than dressed as live.
7. A footer that prints the verifier contract ID, the circuit hash, and "testnet, pre-audit" on every page.

Honesty conventions borrowed from the whole category (Assay, Circle's footnotes, Stellar's dated sources), not from Assay's layout: dated figures, sourced claims, scoped language. Nothing from Assay's board, crawler or report format is reproduced.

## 9. What is removed and what stays

Removed with everything they carried (Directive 6): the floating pill header and its icon dropdown cards, `page-hero.tsx` as a rounded inset panel, the `Eyebrow` pill, `morph-word.tsx`, `border-beam.tsx`, `tick-rings.tsx`, `iso-art.tsx`, the home fact strip, `tour-mocks.tsx` and `use-step-tour.ts`, `record-flow.tsx`, the rounded dark `cta-band.tsx`, `brand-watermark.tsx`, the `grain` and `dot-grid` utilities, `product-panel.tsx` as a card. Phosphor stays for the few functional icons (menu, close, theme, external link); decorative duotone icons go.

Stays, reworked: `seal-geometry.ts` and `seal-gauge.tsx` (becomes the three-way instrument), `record-card.tsx` (becomes the record document), `state-stamp.tsx`, `coverage-bar.tsx`, `coverage-check` and `use-coverage-check`, the inclusion check, the demo machine, the forms, `coveragePercent`, the theme provider and toggle, GSAP, Lenis and the motion gate, the Insights pipeline, the navigation config, the tests.

## 10. Build order

Page by page, each previewed in Chrome at 1440 and 390 px, light and dark, before the next starts:

1. System first: tokens, rails, chapter index, provenance line, ruled cell, the Seal instrument, the header, the mobile drawer fix, the footer. Reviewed on the 404 page because it is the smallest.
2. Home, chapter by chapter, with the pinned chapter built last.
3. Method and limits (Trust route), because it is the page a reviewer opens second.
4. Anchors, Custodial apps, Partners.
5. How it works, The coverage record, See it work.
6. About, Insights, Contact, Waitlist, Legal.
7. Full preflight, the ship script, the release note and the ADR amendment.

## 11. Immediate fixes carried into step 1

- Remove the hero badge ("Proof of reserves, recorded on Stellar").
- Remove the hero border and the rounded inset panel; the opening sits on the page ground.
- Fix the mobile drawer so every link and both actions are reachable.

## 12. Questions for the founder

1. The repo holds one real on-chain verification: contract `CA3KQYYAGUEIURJSB5CSWVMNIY2FF2EG3YTM7SBBRSN7DQWZXCCXWXN3` on Testnet, verify transaction `de9c70fc…2901` at ledger 3,191,042, fee 0.0122514 XLM, with a flipped-byte proof rejected (`contracts/proof-registry/README.md`). It verified the reference circuit, not a coverage record. The site will link it as exactly that ("a proof verified on this contract, ledger 3,191,042, 0.0123 XLM") in the footer and on the method page, and the opening record stays labelled as an example until a coverage proof is published to Testnet. Agreed?
2. The Trust route becomes "Method and limits". Keep the URL `/trust` or move to `/method`?
3. Home opens on paper with no dark act. If you want one dark moment, it goes on the "What it proves" chapter. Preference?
