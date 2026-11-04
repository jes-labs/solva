# Plan: rebuild the docs

## 1. Scope

Approved by signor1, 2026-11-04.

Implements [ADR-2026-11-04-docs-rebuild](../adr/ADR-2026-11-04-docs-rebuild.md), accepted on 2026-11-04. `apps/docs` stays on Fumadocs and the `solva-docs` Worker. Every page is rewritten, and the UI takes the website's design.

Inputs gathered before this plan:

- An audit of the current docs, claim by claim, against the code (kept outside the repository; it records a security finding).
- A study of 22 documentation sites, including the Fumadocs sites of Better Auth, Hiro, Documenso and Prisma, plus Stripe, Circle, Chainlink Proof of Reserve, Plaid, Supabase, Resend and the Claude docs.
- The Strimz and Whisk docs, both on Fumadocs.
- The SEP evidence gathered on 2026-11-04.

## 2. What the docs must do

| Requirement                                                                                       | How                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explain Solva in full: what it is, what it does, how it works, who it is for, the value it brings | An Overview section written for non-developers. Features not yet released are described as part of the product with a Coming soon label. No roadmap page.                                             |
| Read like a technical writer wrote it                                                             | The style rules in section 6, enforced by a content check where a machine can check them.                                                                                                             |
| Light and dark mode                                                                               | The Fumadocs theme toggle (light, dark, system), with brand v3 tokens for both. Dark by default, like the website.                                                                                    |
| Copy any page as Markdown                                                                         | `MarkdownCopyButton` and `ViewOptionsPopover` from `fumadocs-ui`, under every page title: Copy Markdown; open as Markdown, in ChatGPT, in Claude.                                                     |
| Search                                                                                            | Fumadocs search from a prebuilt index.                                                                                                                                                                |
| Code snippets                                                                                     | GitHub themes (`github-light` in light mode, `github-dark-default` in dark). No comments inside any snippet. Copy button at the top right of every block. File-name titles where a snippet is a file. |
| Standards                                                                                         | A "Stellar standards" page, plus inline references where a page touches one (section 5).                                                                                                              |
| AI readers                                                                                        | `llms.txt`, `llms-full.txt` and a `.md` URL for every page, from the Fumadocs LLM integration. No hidden instructions for AI inside the visible page text.                                            |

## 3. Information architecture

The sidebar uses Fumadocs separators, as Strimz and Whisk do. Four sections sit under a home page split by reader, as Documenso does.

**Home** (`/docs`): the Seal, one sentence on what Solva is, and three cards: "I run an anchor or custodial app", "I build on Solva", "I rely on a record". Below the cards, one line for token holders: "Check that your balance was counted."

**Overview** (everyone, non-developers first)

| Page                            | Purpose                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is Solva                   | The problem: holders and partners cannot see whether a token's backing covers what is owed. What Solva is, in one page.                                        |
| What Solva does                 | The daily coverage record, the holder check, and the reads partners and contracts make, including features marked Coming soon.                                 |
| How Solva works                 | Reserves, what is owed, the commitment, the proof and the record, in plain steps, with one diagram.                                                            |
| Who Solva is for                | Anchors, custodial apps, and the partners, auditors and holders who rely on their records.                                                                     |
| Why it matters                  | The value Solva brings: continuous evidence between audits, privacy for customers, a public record anyone can check, and one way to state coverage on Stellar. |
| About Solva                     | The principles Solva is built on: open, verifiable, private by default, neutral. No team section.                                                              |
| What a record shows             | The fields of a record and the statuses covered, short and stale. What a record proves and what it does not.                                                   |
| Where reserve figures come from | The reserve source trust model: attested (custodian-signed) today, read on chain Coming soon. Plain risk wording, after Chainlink's split by source.           |
| Coverage and audits             | How a daily record relates to audits and attestations. It never replaces them.                                                                                 |
| Privacy                         | What the public sees (totals and the commitment root) and what stays private. Selective disclosure is Coming soon.                                             |
| Security                        | The trust boundaries, what is verified on chain, the owner-gated publish, the passkey wallet, and the fact that the system is not yet audited.                 |
| Glossary                        | Every term used in the docs, one line each.                                                                                                                    |

**Operate** (anchor and custodial-app operators)

| Page                     | Purpose                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Before you start         | What an institution needs: a Stellar account, a reserve source, a liabilities export, a passkey.                                |
| Set up your institution  | Tenant, registry contract and passkey wallet, as the console and the provisioning step work today.                              |
| Connect a reserve source | The attested source: signed balances, the signature scheme, how a custodian is connected today (configuration, not self-serve). |
| Load what is owed        | The liabilities export, customer id hashing, limits (8 customers and 4 reserve figures per proof today).                        |
| Run and schedule cycles  | Manual and scheduled cycles, cadence by plan, idempotency, what a refused cycle means.                                          |
| When coverage drops      | What happens when reserves fall below what is owed, and what to tell holders and partners.                                      |
| Publish your record      | Linking the record from `stellar.toml` with SEP-1 `attestation_of_reserve`, and from your site.                                 |

**Verify** (partners, auditors, holders)

| Page                        | Purpose                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Find a record               | From an institution to its registry contract, and the record's fields.             |
| Check a record on Stellar   | Read the latest proof from the contract yourself, with the Stellar CLI or the SDK. |
| Check a balance was counted | The inclusion check for a holder, step by step.                                    |
| For exchanges and wallets   | Listing and treasury checks.                                                       |
| For lenders and risk teams  | Using coverage as a collateral input. `is_covered` is Coming soon.                 |
| For auditors                | What the record gives an auditor, and its limits.                                  |

**Build** (developers)

| Page               | Purpose                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quickstart         | Run the whole pipeline locally and end on the expected output, as Circle's quickstarts do.                                                                           |
| Architecture       | The tiers, where each check runs, and the crypto boundary.                                                                                                           |
| Proof format       | Public inputs, tree shape, hashing, the growth bound and limits, with sources.                                                                                       |
| Passkey wallet     | Kept from the current page and corrected.                                                                                                                            |
| Contract reference | Functions, types, errors 1 to 6, the event, storage lifetime, addresses and fees.                                                                                    |
| REST API reference | Every route with request, response, statuses and idempotency, in Stripe's order.                                                                                     |
| SDK reference      | Only what works today; the rest is held until the SDK is fixed (section 8).                                                                                          |
| Sandbox            | Accounts, scenarios, the admin seeding route, and USD minor units.                                                                                                   |
| AI tools           | `llms.txt`, Markdown pages and the oracle tools `get_solvency` and `get_anomalies`. The tools are documented under their API names, and the page text says coverage. |
| Changelog          | Dated entries, starting with this rebuild.                                                                                                                           |

Old paths redirect to the new ones: `/docs/end-to-end-flow`, `/docs/quickstart`, `/docs/sdk-reference`, `/docs/sandbox`, `/docs/contract-address`, `/docs/architecture` and `/docs/passkey-wallet`.

## 4. Design

| Element     | Choice                                                                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colours     | Brand v3 tokens from `packages/brand/tokens.css` mapped onto the `--color-fd-*` theme variables in light and dark. One accent: the chartreuse signal, used for links, focus, the active sidebar item and the Seal. Neutral reading surfaces. |
| Type        | The website's fonts. Body in the sans; labels, sidebar separators and table headers in the mono, uppercase, tracked, as Better Auth and Hiro do.                                                                                             |
| Logo        | Seal ticks mark plus a "Solva / docs" wordmark, both themes. The old logo component goes.                                                                                                                                                    |
| Home        | The only page with a brand flourish: the Seal instrument. Reading pages stay quiet.                                                                                                                                                          |
| Tables      | Ruled, like the website's ledger tables.                                                                                                                                                                                                     |
| Code blocks | GitHub themes per mode, a quiet bordered frame matched to the page, the copy button at the top right, a file-name title where one applies. Whisk's forced dark frame and traffic-light dots are not used.                                    |
| Callouts    | Fumadocs callouts restyled in brand tokens: Note, Warning, and a Coming soon badge for unreleased features.                                                                                                                                  |
| Diagrams    | Drawn in the website's figure style, as SVG, one per concept page at most.                                                                                                                                                                   |

Every page is reviewed at 390 px and at desktop width, in light and dark mode, with a keyboard, with AA contrast.

## 5. Stellar standards to cite

Each reference states plainly whether Solva uses the standard today or relates to it.

| Standard               | Where                                         | What the page says                                                                                                                                                                             |
| ---------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEP-1 `stellar.toml`   | Publish your record; Stellar standards        | `attestation_of_reserve` is a URL field for proof of reserves. An anchor can point it at its Solva record today. The collateral fields prove control of reserve addresses, not their balances. |
| SEP-41 token interface | Proof format; Stellar standards               | Soroban tokens expose balances but no total supply call, so supply for Soroban-native tokens is rebuilt from events (Coming soon).                                                             |
| SEP-40 oracles         | Stellar standards; For lenders and risk teams | Price feeds only; `is_covered` follows its read-only pattern (Coming soon).                                                                                                                    |
| SEP-10 and SEP-45      | Security; Stellar standards                   | Web authentication for accounts and for contract accounts. The passkey wallet's relation to SEP-45 is stated only after it is checked in code.                                                 |
| SEP-23 and SEP-53      | Contract reference                            | Address encoding and signed-message format, where the docs show addresses or signatures.                                                                                                       |

No page claims that a SEP for reserve coverage exists, and no page discusses proposing one.

## 6. Writing rules

- Write as a technical writer: short sentences, active voice, present tense, second person in tasks, plain words before terms, every term defined on first use and in the glossary.
- Each concept page opens with what the reader can do or decide after reading it, then the explanation.
- Each task page uses numbered steps and ends with the expected result and the next page.
- No filler or AI tells: no "seamless", "robust", "leverage", "delve", "unlock", "empower", "it is important to note", "in today's world", no rhetorical questions as openers, no triple adjective lists.
- No em dashes. No exclamation marks.
- Wording: reserve coverage or coverage; never "proof of solvency", never "replaces audits"; the audience is anchors and custodial apps, never banks, fintechs or regulators. Scenario ids `solvent`, `near-breach` and `insolvent` appear only as API values.
- Every technical claim is checked against its source file. Features not yet released carry the Coming soon label.

A content check in `apps/docs` (a Vitest test over the MDX files) fails the build on:

- comments inside code fences (`//`, `/*`, `#` in shell and TOML, `--` in SQL),
- em dashes,
- the banned words and off-message terms above, outside code.

It runs in `pnpm test`, so preflight and CI enforce it.

## 7. Code changes in `apps/docs`

| Area                    | Change                                                                                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page actions            | `MarkdownCopyButton` and `ViewOptionsPopover` replace `components/docs/page-actions.tsx` and its silent `catch`.                                                                                                                                               |
| Markdown and LLM output | The Fumadocs LLM integration (`includeProcessedMarkdown`, `llms.txt`, `llms-full.txt`, per-page `.md`) replaces the hand-written `docs.md` and `docs-md` routes and the rewrite in `next.config.mjs`, so titles are kept and `[#anchor]` text no longer leaks. |
| Code theme              | `rehypeCodeOptions.themes` set to `github-light` and `github-dark-default` in `source.config.ts`.                                                                                                                                                              |
| Theme                   | Brand tokens on the `--color-fd-*` variables in `global.css`; hard-coded colours go.                                                                                                                                                                           |
| Layout                  | Separators in `meta.json`, the new logo, the home page; the marketing landing page goes.                                                                                                                                                                       |
| Redirects               | The old paths in section 3.                                                                                                                                                                                                                                    |
| Static build spike      | Deferred. OpenNext on the Worker passes the build and the Worker smoke test; a static build needs the `.md` rewrites, redirects and search rebuilt without server features, so it is its own change.                                                           |
| Comments                | Existing comments that break the repository rules are removed or cut to three lines.                                                                                                                                                                           |
| Packages                | `lucide-react` is removed (unused). Nothing is added.                                                                                                                                                                                                          |

## 8. Decisions needed before writing the affected pages

1. **The cycle trigger has no authentication.** `POST /v1/cycles` is open on the live backend, and `requireToken` in `auth.go` is never used. Recommended: fix it test-first in its own pull request before the Security page is written.
2. **The SDK.** `connectSource`, `runProofCycle`, `getLatestProof` and `getProof` do not match the orchestrator. Either fix the SDK, or document only `getOnChainLatestProof` and `verifyInclusion` and mark the rest Preview.
3. **The contract the docs point at.** The current docs list `CAYWB…ZX3Z`, an older build without error 6. Either point the docs at the build the website shows (`CA3KQ…XWXN3`), or redeploy the reference registry and regenerate the bindings.

Pages not touched by these decisions are written first.

## 9. Tests and checks

- The content check (section 6).
- Existing docs tests, typecheck, lint, `pnpm knip`.
- The Worker build and smoke test, extended to cover a page, search, a `.md` URL, `llms.txt`, a redirect and the 404.
- A manual review of every page at both widths, in both themes, with a keyboard.

## 10. Order of work

1. Theme, layout, page actions, code theme, LLM output, redirects and the content check, with today's pages still in place.
2. The static build spike.
3. Overview pages.
4. Verify pages.
5. Operate pages.
6. Build pages, after the decisions in section 8.
7. Home page, glossary, changelog, release note, preflight, and a review in the browser.
