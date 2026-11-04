# ADR-2026-11-01: Rebuild joinsolva.xyz to sell Solva to anchors and custodial apps

- **Status:** Accepted
- **Approved by:** Emmanuel Omemgboji, 2026-11-02
- **Companion:** [ADR-2026-11-01-website-rebuild-for-dummies.md](ADR-2026-11-01-website-rebuild-for-dummies.md)
- **Depends on:** ADR-2026-11-01-ai-governance (accepted), ADR-2026-11-01-brand-system

## Context

`apps/website` was built for a hackathon audience. It reads as a developer tool and carries claims the code does not support: "Prove true solvency" in the hero, a fake "verified 3s ago" loop with made-up hashes, a marquee of invented bank names, a `/status` page with mocked uptime and incidents, `/pricing` offering Mainnet publishing, and "Zero-knowledge guarantees" on `/security`.

Who the site is for (founders, 2026-11-02): anchors that issue fiat tokens on Stellar and custodial apps that hold customer money and move it over Stellar. The site sells Solva to them: what it is, what it does, the value it brings. It is institutional, professional and in plain business language. No competitor comparisons. Technical depth lives in the docs. No link to the dashboard.

Source of truth for the product: the SCF Build interest form (coverage registry, per-asset covered, short or stale, free reads for wallets, lending pools and holders, customer inclusion checks, Mainnet after the Soroban Audit Bank review), then the niche document. Nothing Nigeria-linked appears in public material.

Research behind this ADR (scratchpad `rebuild/`): a browser study of 26 reference sites (`web/WEB-PATTERNS.md`), audience and market evidence (`research/AUDIENCE-IA.md`: 13 fiat-token anchors in the Stellar Anchor Directory, 8 with no working reserve evidence, about 71,700 accounts holding those tokens, counted 1 November 2026), an inventory of the current site (`web/EXISTING-INVENTORY.md`), and the approved brand (ADR-2026-11-01-brand-system).

## Options considered

### Restyle the current app

Keeps Tailwind 3 (Kokonut UI needs v4), GSAP plus Lenis plus Motion, a flat component folder with no layer rules, and copy written for developers.

### Rebuild from zero at the same path

A new Next.js 16 app at `apps/website`, same Worker (`solva-website`) and domain, designed from the research and the brand, on the governance architecture. The current app is deleted in the same change. Only two capabilities are rebuilt as features with new design and code: the Testnet demo and the contact form.

## Decision

Rebuild from zero.

1. **Stack.** Next.js 16.4.3, React 19.3, Tailwind CSS 4, React Compiler, TypeScript strict. shadcn with the `@kokonutui` and `@vengeanceui` registries; `motion` loaded lazily. No GSAP, no smooth-scroll library, no charting library. Cache Components off. Fonts through `next/font`.
2. **Architecture.** `docs/architecture.md` app level: `app`, `components/layout`, `features/<name>` (with `index.ts` and `server.ts`), `components/ui`, `hooks`, `lib`, `config`; `eslint-plugin-boundaries` default-deny; knip and Vitest added to the workspace.
3. **Pages and navigation.** Header: logo, Solutions (For anchors, For custodial apps), How it works, Trust, Company (About, Research, Roadmap, Insights), Docs, and a "Talk to us" button. Routes:
   - `/` Home
   - `/anchors` For anchors
   - `/custodial-apps` For custodial apps
   - `/how-it-works` How it works, in plain steps
   - `/coverage-record` What holders, partners and auditors see: the covered, short and stale record, shown with example entries
   - `/partners` Wallets, lending pools and auditors: they read coverage for free; links to the docs for integration
   - `/trust` Security, independent review path, what a result does and does not show, in plain words
   - `/research` and `/research/reserve-evidence-on-stellar-2026` The market study, aggregates only, no anchor named
   - `/roadmap` From Testnet to Mainnet, Done / Now / Next
   - `/demo` A guided Testnet demo for a non-technical visitor
   - `/waitlist` (join the waitlist for the console), `/about`, `/insights` (the four existing posts, checked against the claim rules), `/contact` (pilot request with a role selector), `/legal`
   - Redirects: `/solutions` to `/anchors`, `/pricing`, `/request-a-demo` and `/status` to `/contact` or `/coverage-record`, `/sandbox` to `/demo`, `/developers` and `/solvency-oracle` to `/partners`, `/security` to `/trust`, `/blog` to `/insights`.
4. **Homepage, in order.** Hero (headline, one action, the proof seal with a sample coverage record), three outcomes for the institution, the market gap (dated research figures), built for anchors, built for custodial apps, how it works in three steps, what your stakeholders see, why it can be trusted (Stellar, open source, independent review before Mainnet, the hackathon judges' line), the pilot programme and roadmap, team, questions, closing action, footer. No code samples, no contract IDs and no comparisons on the homepage.
5. **Copy.** Plain business language, written by the style guide in `rebuild/research/STYLE-GUIDE.md`. The product is described as the interest form describes it, as what Solva is built to do. No "Testnet" or "sample data" badges or status tags (amended by the maintainer at approval). Product interfaces use realistic example institutions, assets and amounts without labels, as product sites do. Goal figures are written as targets. Invented traction (customers, assets verified, user counts) is never presented as achieved. Market research figures carry their source and date.
6. **Dashboard.** Nothing links to app.joinsolva.xyz. Any "Open the app" or "Get started" style action opens a coming-soon toast or goes to `/waitlist`, a form that records interest through the contact pipeline (amended by the maintainer at approval).
7. **Motion.** Landing Page Motion Pack: hero reveal (calmed), count-up on real figures only, process draw for how it works, click-to-success on the contact form (no confetti). The proof seal draws once and settles. Everything respects reduced motion.
8. **Quality.** Every route reviewed at phone and desktop width in light and dark mode; Worker smoke test covers every route and redirect; no text in the built site matches the banned-claims list or links to app.joinsolva.xyz.

## Diagram

```
browser ─► Cloudflare (joinsolva.xyz) ─► solva-website Worker (OpenNext)
                                            app/ routes (thin)
                                              └─ features/
                                                   home, anchors, custodial-apps, how-it-works,
                                                   coverage-record, partners, trust, research,
                                                   roadmap, demo, company, insights, contact
                                                   └─ server/: orchestrator + sandbox (demo),
                                                              Resend (contact)
                                            components/layout: header, footer
                                            components/ui: shadcn, Kokonut, Vengeance
```

## Consequences

- The site speaks to the buyers and supports the SCF application with honest, sourced claims.
- Removed with the old app: gsap, @gsap/react, lenis, recharts, react-fast-marquee, @radix-ui/react-accordion, @radix-ui/react-tabs, tailwindcss 3, autoprefixer, the website's use of `@solva/brand`'s Tailwind preset. Added: tailwindcss 4 tooling, shadcn, motion, registry component dependencies, eslint-plugin-boundaries, knip, vitest.
- Large single pull request; reviewed page by page on a preview Worker.

## Verification

- `./scripts/preflight.sh` passes, including the website build, Worker smoke test and knip.
- Founder reviews every page on the preview, light and dark, desktop and phone.
- A search of the built output finds no banned claim and no app.joinsolva.xyz link.

## Amendments during the build (approved by the maintainer, 2026-11-02)

- `/research` and `/roadmap` are not built. Point-in-time market figures go stale, and none of the nine live proof-of-reserve product sites checked publishes a dated roadmap or a technology strip (`rebuild/research/POR-SITES.md`).
- The site does not present the team or name Jes Labs. Insights are bylined "The Solva team"; GitHub links keep the repository URL.
- No toast library: console actions show an inline note with a link to `/waitlist`.
- Header menus use the native Popover API instead of Radix navigation, sheet and accordion, so the menus need no client JavaScript.
- `experimental.inlineCss` is off. With it on, the full stylesheet was sent twice (style tag and RSC payload), 64 KB compressed on an empty page against 16 KB without.
- Images: a custom `next/image` loader serves prepared 400, 800 and 1600 px WebP files, because the Workers Free plan has no image optimisation.
- `cn` uses tables compiled at build time by `cn build` (3.4 KB compressed) instead of the runtime tailwind-merge configuration (28 KB compressed).
- Lighthouse checking is removed from the website at the maintainer's request: `lighthouserc.json` and `@lhci/cli` are deleted, and Directive 9 now requires every route to work at phone and desktop width, in light and dark mode, with a keyboard and AA contrast.
- Design overhaul after the maintainer's review, informed by a page-by-page study of the 26 reference sites and the Strimz site (`rebuild/research/SITE-STUDY-v2.md`):
  - Light and dark mode with a toggle in the header (next-themes, class strategy, system default).
  - Floating pill header with icon menus; rounded inset hero panels with the Seal tick rings, dot grid and grain; pill buttons with depth.
  - Product screens as the main pictures: a coverage record with a Seal gauge (the logo's tick ring filling to the coverage percentage), audience tabs with their own screens, a pinned step tour, an interactive covered/short/stale check and a drawn flow diagram.
  - Drawn isometric illustrations replace the archival etchings on product pages; archive pictures remain only as Insights covers.
  - Motion with GSAP, ScrollTrigger and Lenis, off under reduced motion; Phosphor icons (MIT). The motion, smooth-scroll and theme packages are added back for this.
  - Coverage is shown as a percentage everywhere (103.61%), cut to two decimals and never rounded up.

## Amendments after the second review (approved by the maintainer, 2026-11-03)

The maintainer rejected the 2026-11-02 design as a copy of the Strimz layout and asked for an original site built for Solva's own readers, with nothing in common with a competitor's site. The plan is `docs/plans/2026-11-03-website-v3-plan.md`.

- The site is a ruled ledger: two full-height hairline rails frame an 88 rem column, chapters carry a mono index in the gutter and a tick at each rail, and content is separated by hairlines. No cards with shadows, no rounded inset panels, no pills, no gradients, no dot grid, no grain, no isometric clipart. Square corners.
- Dark is the default theme; light remains available from the header and footer toggle. Labels, captions and buttons are Hanken sentence case; IBM Plex Mono is used only for machine values (ledger numbers, hashes, amounts, states). Bricolage runs at weight 400 and 500.
- The Seal's tick ring is the one instrument, read as a coverage meter, a calendar of days or a progress ring (`seal-instrument.tsx`). The coverage record is rendered as a ruled document (`record-document.tsx`). Every figure carries a provenance line; example figures are labelled "Example".
- Home is six chapters that make one daily record: the opening meter, the record as a document over a calendar of days, a pinned chapter where balances become one commitment, pass through the ring and are stamped, what it proves and what it does not, who reads it, the coverage check, questions and a two-card close.
- `/demo` runs the real Testnet pipeline again (the sandbox API routes and `use-sandbox` hook return) rather than a scripted walkthrough. The page says plainly when the backend is unreachable and never simulates a step. The reserve source is described as Solva's sandbox, never as a bank.
- The footer prints the Testnet verifier contract, the verified transaction at ledger 3,191,042, the measured fee and the network on every page (`config/evidence.ts`). `/trust` is written for a risk officer: what the proof establishes, what rests on a signature, what no record claims, who has to be honest, the verifier, status and the audit, and a versioned changelog. It states that the current prover does not yet run the formally hiding configuration.
- Real data where it exists: the home page and `/anchors` read the circulating supply and trustline count of real fiat tokens on Stellar mainnet (USDC and EURC from Circle, ARST from Latamex, ARS from Anclap, GYEN from GMO Trust, CLPX and AUDD from Novatti, each issuer key verified from the issuer's own stellar.toml) from Horizon when the page loads, with the ledger and close time as provenance (`config/assets.ts`, `lib/stellar-supply.ts`). The read has a four-second timeout and a five-minute in-memory memo; when Horizon cannot be read the page says so and shows no figure. Coverage records stay labelled examples until a reserve-side proof exists for a real asset.
- `is_covered(issuer, asset)` is shown as the planned registry interface; the deployed contract exposes `publish_proof`, `get_latest_proof`, `get_proof` and `verify_inclusion`, and the pages say so.
- The header is a full-width hairline bar; the mobile drawer stops Lenis while open (`lib/scroll-lock.ts`) and fits on a 390 px screen.
- Removed with everything they carried: page-hero, cta-band, eyebrow, section-heading, product-panel, seal-gauge, record-card, coverage-bar, the fx folder (tick rings, border beam, morph word, isometric art), the brand watermark, the shadcn table and tabs, the scripted demo machine, `lucide-react` and `tw-animate-css`.

## Amendments after the third review (approved by the maintainer, 2026-11-03)

- The column between the rails widens from 76 rem to 88 rem on every page, so tables and two-column chapters have room.
- Motion is one site-wide director (`hooks/use-motion-director.ts`): chapters and figures fade and rise as they enter, lists and table rows stagger in, every Seal ring draws tick by tick, and figures count up once. Lenis is tuned for a slower, smoother scroll. Everything stops under reduced motion, and the page stays fully readable with no JavaScript (the motion gate only hides marked elements once GSAP is running).
- The footer is rebuilt: the lockup and one-line description, four link columns, the verifier evidence strip, two Seal dot-art flanks, a wordmark watermark clipped at the bottom, and a bottom bar with the licence, terms, theme toggle and back-to-top.
- The hero badge is gone; the header lockup is larger. The hero meter loops through the last seven example days, the record chapter's year calendar fills and counts on scroll, and the pinned chapter is scrubbed to the scroll (`use-record-stage.ts`), with step buttons that glide to their place in it.
- The site stops describing how the proof is built. Hash functions, tree shapes, proof systems, byte sizes, host functions and circuit facts leave every page, figure and sandbox log line; the pages say what a record proves, what it hides and who checks it, and point to the documentation for the construction. The trust page keeps every disclosure in plain words.
- Every line of copy was reviewed and rewritten by hand for clarity and tone, under the standing content rules (anchors and custodial apps, coverage not solvency, no team, no sample-data badges, no em dashes).
- The Insights section is renamed Blog and served at `/blog`, the address the old site already used, so `/blog` and its post links keep working without a redirect. `/research` now redirects to `/blog`. The theme toggle leaves the footer and stays in the header.
- Two posts take slugs that match their rewritten titles: `why-no-balance-can-be-left-out` and `telling-a-supervisor-one-number`. The old slugs redirect permanently to the new ones.
