# Plan: website rebuild (2026-11-02)

ADRs: `docs/adr/ADR-2026-11-01-website-rebuild.md`, `docs/adr/ADR-2026-11-01-brand-system.md` (both accepted 2026-11-02 with two amendments: no "Testnet" or "sample data" badges; dashboard actions show a coming-soon toast or go to `/waitlist`).

Research inputs (session scratchpad `rebuild/`): `web/WEB-PATTERNS.md` (26-site study and blueprint), `research/AUDIENCE-IA.md`, `research/STYLE-GUIDE.md`, `brand/BRAND-PLAN-v3.md`, `brand/tokens.proposal.css`, `brand/logo-v3/seal-*`.

## Scope

Replace `apps/website` entirely. Same package name `@solva/website`, same Worker `solva-website`, same domain. Delete every current file except the four blog MDX posts (content reviewed against the claim rules) and team photos.

## Files, by layer

```
apps/website/
  next.config.ts  open-next.config.ts  wrangler.jsonc  components.json
  eslint.config.mjs  vitest.config.mts  vitest.setup.ts  knip.json
  content/insights/*.mdx
  public/brand/ (seal lockups, app icon, favicons, OG)
  src/
    app/                    thin routes, metadata, sitemap, robots, redirects in next.config
      (site)/layout.tsx     header + footer + toaster
      page.tsx, anchors/, custodial-apps/, how-it-works/, coverage-record/, partners/,
      trust/, research/, research/[slug]/, roadmap/, demo/, about/, insights/, insights/[slug]/,
      contact/, waitlist/, legal/, not-found.tsx, api/demo/* (route handlers for the demo)
    components/layout/      site-header, mobile-menu, site-footer, brand-lockup, page-header, cta-band
    components/ui/          shadcn + @kokonutui + @vengeanceui primitives, re-skinned
    features/
      brand/                seal (mark + tick ring + coverage arc), state-stamp
      coverage/             coverage-record card, coverage line, example records, formatters
      home/                 homepage sections
      solutions/            anchors and custodial-apps sections, inclusion-check explainer
      how-it-works/         steps, process path
      trust/                review path, what a result shows
      research/             report data and tables
      roadmap/              timeline data and view
      demo/                 guided demo runner, hooks, server/ (orchestrator + sandbox client)
      contact/              contact and waitlist forms, server/ (Resend), validation
      insights/             MDX loading and rendering
      company/              team, principles, fact sheet
    hooks/                  use-in-view, use-reduced-motion wrappers if two features need them
    lib/                    cn, format (amounts with bigint, ratios truncated), env
    config/                 site, routes, nav
```

## Interfaces

- `CoverageRecord { institution: string; asset: string; owed: bigint; held: bigint; decimals: number; state: "covered" | "short" | "stale"; provenAt: string }`.
- `coverageRatio(owed, held): string` truncates to two decimals, never rounds up.
- `<Seal size state animate />`: the approved mark plus tick ring; `state` drives the coverage arc.
- `<CoverageCard record />`: server component, final geometry in SVG, animation applied after hydration.
- Server Functions: `submitContact(prev, formData)`, `joinWaitlist(prev, formData)` returning `{ status: "idle" | "success" | "error"; errors? }`.
- Demo route handlers keep the current behaviour behind `features/demo/server`, inputs validated.

## Content rules

- Plain business language for anchors and custodial apps. No code on any page except one short block on Partners. No contract IDs on the homepage.
- Product described as the SCF interest form describes it. Example institutions in product UI: "Northway Custody", "Kestrel Anchor", "Arden Pay", assets like USDC, EURC, a peso or shilling token (never Naira). No badges.
- Aims written as targets ("Built to check every fiat-backed token on Stellar, every day"). No invented traction.
- Market figures from the research report, with source and date.
- Any dashboard action: toast "The Solva console opens to pilot partners soon" with a link to `/waitlist`.

## Homepage sections

1. Hero: headline, subhead, Talk to us, How it works link; the seal with a coverage record.
2. Outcomes for the institution (three, each with its proof).
3. The market gap (research figures, dated, source link).
4. For anchors (panel).
5. For custodial apps (panel with the inclusion check idea).
6. How it works, three steps on a drawn path.
7. What your stakeholders see: holders, partners, auditors, with the record states.
8. Why it can be trusted: built on Stellar, open source, independent review before launch, the judges' line.
9. Pilot programme and roadmap (Done / Now / Next).
10. Team.
11. Questions.
12. Closing action.

## Tests

- `coverageRatio` and amount formatting with `bigint` (exact, truncation, zero owed).
- Seal and state stamp render each state with an accessible label.
- Contact and waitlist actions: valid, invalid email, missing fields, honeypot, Resend failure surfaces an error state.
- Header: menus open by keyboard; mobile menu traps focus; no link to app.joinsolva.xyz (test over the nav config).
- Demo hooks: idle, running, success, error.

## Removal

Old app files, `vercel.json` leftovers if any, dependencies: gsap, @gsap/react, lenis, recharts, react-fast-marquee, @radix-ui/react-accordion, @radix-ui/react-tabs (replaced by shadcn's radix-ui), tailwindcss 3, autoprefixer, postcss config, prism-react-renderer, the website's use of `@solva/brand`.

## Screens

Every route reviewed at phone and desktop width, in light and dark mode. Motion is off under reduced motion; the seal SVG is server-rendered.

## Steps

1. Scaffold config and tooling; tokens and fonts; layout (header, footer, mobile menu); shared UI. Verify build, lint, smoke.
2. Brand and coverage features (seal, stamp, record card) with tests.
3. Homepage.
4. Solutions, how it works, coverage record, partners, trust.
5. Research, roadmap, about, insights, contact, waitlist, legal, demo.
6. Brand assets (favicons, OG, banners) and redirects.
7. Preflight, a browser review of every route, founder review on the local Worker preview.
