# ADR-2026-11-04: Rebuild the docs on Fumadocs, in the website's design

- **Status:** Accepted
- **Approved by:** signor1, 2026-11-04
- **Companion:** [ADR-2026-11-04-docs-rebuild-for-dummies.md](ADR-2026-11-04-docs-rebuild-for-dummies.md)

## Context

`docs.joinsolva.xyz` is `apps/docs`: Next.js 16 with Fumadocs 16.10.4 (`fumadocs-core`, `fumadocs-ui`) and `fumadocs-mdx` 15.0.12, built with OpenNext and served as the Cloudflare Worker `solva-docs`. It has eight pages, about 4,700 words, written for the hackathon, plus a marketing landing page.

The live site already has a light and dark toggle, full-text search (`/api/search`, the Fumadocs Orama server) and a hand-written "Copy as Markdown" and "View as Markdown" control backed by a rewrite to `/api/docs-md`. It has no `llms.txt`.

The website was rebuilt for anchors and custodial apps (PR #198), and the backend now speaks of reserve sources, not banks (PR #199). The docs still describe the old product in the old design.

On 2026-11-04 the maintainer compared Mintlify with free tools that deploy to Cloudflare and chose to stay on Fumadocs. Fumadocs is free, already deploys to our Cloudflare account, and shares the website's stack (Next.js, React, Tailwind 4), so the website's tokens and brand components can be reused. Fumadocs ships the features we need: `MarkdownCopyButton` and `ViewOptionsPopover` (copy as Markdown, open in ChatGPT, Claude and others), an `llms.txt` and per-page Markdown integration, a theme toggle, and search that can run from a static index. Fumadocs publishes no official MCP server or agent skill, so agents use the Fumadocs docs through Context7 and `fumadocs.dev/llms.txt`.

## Options considered

### Option A: rewrite the content only

Keep the current app and layout and replace the pages. Fast, but the docs keep the hackathon look and the hand-written components, and still do not match the website.

### Option B: rebuild content and design on Fumadocs, keep the Worker deploy

Rewrite every page and restyle the Fumadocs UI with the website's brand v3 tokens, type and Seal mark. Replace hand-written parts with the Fumadocs built-ins. Keep OpenNext on the `solva-docs` Worker.

### Option C: as B, served as a static site

As B, but build with Next.js static export and serve the files from the same Worker as static assets, with search from a prebuilt index in the browser. No server code runs per request, and the OpenNext and Wrangler server setup goes. Two things must be proven first: per-page Markdown at a stable URL without a Next.js rewrite, and the 404 page.

## Decision

Option B now, and Option C if a short spike proves both points; the plan records the result.

- **Content.** Rewritten from zero for three readers: anchor and custodial-app operators with their compliance and risk people, integrating developers, and partners who read a record. Plain language first, then the detail. The docs explain the construction that the website leaves out on purpose. Every claim says what the code does today. Planned items, such as `is_covered` and selective disclosure, are labelled as planned. Standards claims cite the SEP evidence gathered on 2026-11-04. Wording follows the website: reserve coverage, never "proof of solvency", never "replaces audits", no banks, no em dashes.
- **Design.** The docs look like the website: brand v3 colours mapped onto the Fumadocs theme variables in light and dark, the website's fonts, the Seal ticks logo, ruled tables and monospace labels. Dark by default, with a light theme that follows the same tokens.
- **Required features.**
  - Light and dark mode on every page.
  - Copy as Markdown, plus open in ChatGPT and Claude, on every page through the Fumadocs built-ins.
  - Full-text search.
  - `llms.txt`, `llms-full.txt` and a Markdown URL for every page.
- **Code.** Replace the hand-written page actions, Markdown route and logo with Fumadocs built-ins or the shared brand code, and remove what they replace. The landing page goes; the docs home page becomes the start of the docs. Comments in the app follow the repository rules.
- **Research first.** Before the plan: a study of strong documentation sites, and a claim-by-claim audit of the current docs against the code. Both feed the page map.

## Diagram

```
 apps/docs (MDX pages + Fumadocs UI in brand v3) ── PR ──► CI: lint, typecheck, build, Worker smoke
                                                                      │
                                                            merge to main
                                                                      │
                                           Cloudflare Workers Builds ─► Worker solva-docs
                                                                      │
                     docs.joinsolva.xyz: pages · search · Copy as Markdown · llms.txt · .md per page
```

## Consequences

- Better: accurate docs for today's product, one visual language across the website and docs, AI-ready output, and less custom code.
- Worse or costs more: a full rewrite and restyle takes time; Fumadocs upgrades stay our job.
- Removed: the landing page, the hand-written page actions, the custom Markdown route and rewrite (if the built-in covers it), and any package only they used. Old page paths get redirects.
- Deploy: unchanged under B (`solva-docs` Worker, `docs.joinsolva.xyz`). Under C the Worker serves static assets only; no DNS change in either case.
- Packages: none added or removed by the decision itself; the plan lists any change with its reason, pinned.

## Verification

- `./scripts/preflight.sh` passes, including the docs Worker build and smoke test, extended to cover search, Copy as Markdown, `llms.txt` and a `.md` page URL.
- Every page reviewed in a real browser at 390 px and desktop width, in light and dark mode, with a keyboard, with AA contrast.
- Every technical claim checked against its source file during review.
