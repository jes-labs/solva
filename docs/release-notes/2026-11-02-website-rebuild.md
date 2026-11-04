---
date: 2026-11-02
branch: feat/website
base: main
scenario-impact: needs_automation
---

# A new joinsolva.xyz for anchors and custodial apps

The public website is rebuilt from zero to sell Solva to anchors that issue fiat tokens on Stellar and to custodial apps that hold customer money. It explains what Solva is and does in plain business language, shows the coverage record as real interface fragments, and carries the refined brand (chartreuse kept as a signal, the Seal ticks logo). Nothing links to the console; console actions point to a waitlist.

## Changes

- New routes: `/`, `/anchors`, `/custodial-apps`, `/partners`, `/how-it-works`, `/coverage-record`, `/demo`, `/about`, `/trust`, `/blog` and four posts, `/contact`, `/waitlist`, `/legal`, a 404 page, sitemap and robots.
- Interactive parts: the homepage pinned chapter (balances to tree to proof to record), the coverage check (covered, short or stale), the custodial-app holder check, the partners collateral rule, the year of records on the coverage record page, and `/demo`, which runs the real Testnet pipeline through the sandbox API routes.
- Live data: the home page and `/anchors` read the circulating supply of real fiat tokens on Stellar mainnet (seven tokens from Circle, Latamex, Anclap, GMO Trust, CLPX and Novatti) from Horizon at request time, with ledger and close time shown; these two routes render on request.
- Design: a ruled ledger on near-black by default with a light theme, Hanken sentence-case labels, mono only for machine values, the Seal's tick ring as the one instrument, and the Testnet verifier evidence printed in every footer (see the ADR amendments of 2026-11-03). The page column is 88rem wide between the rails.
- Motion: a site-wide director reveals chapters, staggers rows and table lines, draws every Seal ring tick by tick and counts figures up when they scroll into view; the home chapter that makes a record is pinned and steps on scroll; Lenis smooth scroll. The hero meter steps through the last seven example days on a loop, the year calendar on the record chapter fills day by day while it counts proofs and missed days, and the pinned chapter is scrubbed to the scroll so each step draws in continuously. Every figure, record document and list on every page reveals as it scrolls in, figures count up where they carry a number, and the How it works figures act out their step (balances fill, the commitment draws, the proof fills, the record is stamped). Numbers inside a ring size themselves to that ring. Theme changes, accordions and page changes cross-fade. All of it stops under reduced motion, and loops pause off screen.
- Copy: the site describes what Solva does and what a record proves, at the level a reader of the record needs. How the proof is built (hash, tree, proof system, sizes) lives in the documentation, not on the site. Every page was rewritten by hand for clarity and tone.
- Contact and waitlist forms send through Resend with server-side validation; they need `RESEND_API_KEY` as a Worker secret. `/demo` reads `ORCHESTRATOR_URL`, `SANDBOX_URL` and `ORCH_API_TOKEN` as before. The reserves step reads `/v1/accounts/{id}/balance`, the sandbox's real route, and a failed read now stops the step with an error instead of reporting R = 0; the log no longer prints the sandbox's currency code.
- Permanent redirects from the old routes (`/solutions`, `/pricing`, `/request-a-demo`, `/status`, `/sandbox`, `/developers`, `/solvency-oracle`, `/security`, `/research`).
- Next.js 16.4.3, Tailwind CSS 4, React Compiler, feature architecture with `eslint-plugin-boundaries`, Vitest and knip in the workspace. GSAP, Lenis, next-themes and Phosphor icons for motion, theming and icons.
- Archival pictures from public collections, public domain or CC0, credited on `/legal#picture-credits`.

## Removed

- The previous website app in full: every page, component, the sandbox API routes, GSAP, Lenis, Recharts, react-fast-marquee, the Radix accordion and tabs, Tailwind 3, PostCSS config, `prism-react-renderer`, the old brand assets and team photos.

## Verification

- `./scripts/preflight.sh` passed in every tier, including Worker builds and smoke tests for website, web and docs.
- 153 website tests (amounts and ratios in `bigint`, the form actions, every interactive hook, the sandbox log helpers).
- Every route reviewed in Chrome at 1440 px and 390 px, in light and dark mode, with a slow scroll through every chapter to watch the reveals, with no sideways scroll on phones.
- Lighthouse checking removed from the website (see the ADR amendment).
- Scenario: the contact and waitlist submissions are covered by unit tests only; an end-to-end check against Resend is not automated.
