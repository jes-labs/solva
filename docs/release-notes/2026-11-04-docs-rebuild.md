---
date: 2026-11-04
branch: docs/rebuild
base: main
scenario-impact: none
---

# The docs are rewritten for anchors, custodial apps and the people who rely on them

docs.joinsolva.xyz has new content and the website's design. 37 pages in four sections explain what Solva is, what it does, how it works and who it is for (Overview), how an institution runs it (Operate), how a partner or holder checks a record (Verify), and how a developer builds on it (Build). Every page works in light and dark mode, can be copied as Markdown or opened in ChatGPT or Claude, and is searchable.

## Changes

- New content: Overview (13 pages), Operate (7), Verify (6), Build (10), and a home page split by reader. Every technical claim was checked against the code; unreleased features carry a Coming soon badge in the page and the sidebar. Standards are cited where they apply (SEP-1, SEP-41, SEP-40, SEP-10 and SEP-45, SEP-23, SEP-53).
- Design: brand v3 colours, the website's fonts, the Seal ticks logo, ruled tables and mono labels. Code blocks use GitHub's light and dark themes, with the copy button at the top right.
- Built-in Fumadocs page actions replace the hand-written ones. Every page has a `.md` version with its title, plus `llms.txt` and `llms-full.txt`.
- A content check (`apps/docs/test/content.test.mjs`, run by `pnpm test`) fails the build on comments inside code snippets, em dashes, off-message terms, filler words, broken internal links and badges inside headings.
- Redirects: `/` to `/docs`, and each old page to its new home.
- The Worker smoke test covers the new routes.

## Removed

- The eight hackathon pages, the landing page, the hand-written page actions and `docs.md` route, the old logo, favicons, social image and `manifest.json`, the "Launch app" link, and the `@solva/brand` and `lucide-react` dependencies of `@solva/docs`. `zod` 4.6.7 is added for the `status` frontmatter field.

## Verification

- `node --test apps/docs/test/content.test.mjs`: 149 checks pass.
- `pnpm build` and `pnpm build:cloudflare` for `@solva/docs`; `scripts/worker-smoke.sh docs` passes on workerd.
- Pages reviewed in a browser at 390 px and desktop width, in light and dark mode.
