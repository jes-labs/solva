# ADR-2026-11-01: AI governance for the Solva monorepo

- **Status:** Accepted
- **Approved by:** Emmanuel Omemgboji, 2026-11-02
- **Companion:** [ADR-2026-11-01-ai-governance-for-dummies.md](ADR-2026-11-01-ai-governance-for-dummies.md)

## Context

AI coding agents now write a large share of Solva's code, docs and copy. The rules they follow live in a root `SKILL.md` that agents read only if they happen to open it. Nothing stops an agent from committing to `main`, adding a dependency, writing AI-sounding comments, or skipping tests. The only machine gate is the `ci` job in `.github/workflows/ci.yml`, which the `main` ruleset requires.

The Tsion Market frontend (`wsws/new-market-frontend`) runs a stricter version of the same idea: a rulebook in `AGENTS.md`, ADR pairs approved by a human before non-trivial work, worktree isolation, local hooks, a comment checker, a commit-message check that rejects AI attribution, and a preflight script that mirrors CI. The founders want that system here.

Solva differs from that repo in three ways that shape the adaptation:

1. It is a polyglot monorepo: Noir circuits, Rust (prover, Soroban contract, verifier crate), Go (orchestrator, sandbox), TypeScript (three Next.js apps, oracle, SDK, shared packages).
2. It has one long-lived branch, `main`. There is no `dev` or `staging`.
3. The `main` ruleset already requires a status check named `ci`. Renaming it would break protection.

## Options considered

### Option A: copy the Tsion Market files verbatim

Fastest. Wrong for this repo: it assumes a single Next.js app at the root, `dev` and `staging` branches, and pnpm-only gates. Rust, Go and Noir would have no rules or gates.

### Option B: rulebook only, no enforcement

Add `AGENTS.md` and templates, skip hooks and CI changes. Cheap, but the rules then depend on agents remembering them, which is the problem we have today.

### Option C: adapt the full system to the monorepo

Same directives and lifecycle as Tsion Market, with gates that call each tier's own tooling, one branch (`main`), and the existing `ci` check kept as the single required check.

## Decision

Option C.

1. **Rulebook.** `AGENTS.md` at the root carries the twelve Tsion Market directives, adapted: 0 read before you act, 1 worktree isolation off `origin/main` and no AI co-authors, 2 two ADRs and human approval for non-trivial work, 3 red then green, 4 no symptom masking, 5 agents write no comments, 6 replace means remove, 7 packages only when used, 8 React the way the standards say, 9 Lighthouse 98 to 100 on the public website, 10 preflight before done, 11 use the tools available. It also carries the lifecycle (read, sync, decide, plan, isolate, build, verify, document, deliver) and the pre-review audit. `CLAUDE.md` is one line: `@AGENTS.md`.
2. **Standards.** `docs/engineering-standards.md` adopts the Tsion Market standards in full for all TypeScript and React code: principles, TypeScript, components, the hook table, custom hooks, data and server code, styling and UI kit, performance and Lighthouse, accessibility, errors, testing, comments, naming, dependencies and cleanup, security, documentation. It adds the Rust, Go and Noir rules from the current `SKILL.md` (clean architecture in the orchestrator, errors returned with context, circuit tests covering true, false, fraud bound and inclusion, `cargo clippy -D warnings`).
3. **Architecture.** `docs/architecture.md` has two levels. Repository level: the tiers (circuits, prover, contract and verifier crate, orchestrator, sandbox, oracle, SDK, apps, packages) and their boundaries, including the hard rule that circuit hashing lives only in the Rust prover and the contract. App level: every Next.js app uses the Tsion Market feature architecture (`app`, `components/layout`, `features/<name>` with `index.ts` and `server.ts`, `components/ui`, `hooks`, `lib`, `config`), one-way imports, default-deny `eslint-plugin-boundaries`, and its rendering and caching rules for Workers (Cache Components off). Existing apps move to it when they are next rebuilt; new apps start on it.
4. **Skill pointer.** The root `SKILL.md` is deleted. `.claude/skills/solva-engineering-standards/SKILL.md` tells agents to read `AGENTS.md`, the standards and the architecture before any change, and lists the non-negotiables.
5. **Agent settings.** `.claude/settings.json` turns off Claude Code commit and PR attribution.
6. **Records.** `docs/adr/` (templates, README), `docs/plans/`, `docs/release-notes/`.
7. **Hooks (lefthook).** Pre-commit: Prettier, ESLint on staged TS files, and the comment checker on staged files (ported from Tsion Market: rejects dashes, AI filler phrases, commented-out code and comments over three lines). Commit-msg: commitlint with conventional commits and a `no-ai-attribution` rule. Pre-push: `./scripts/preflight.sh --fast`.
8. **Preflight.** `scripts/preflight.sh` runs, in order: format (Prettier, `cargo fmt --check`, `gofmt -l`), lint (turbo lint, clippy `-D warnings`, `go vet`), comment check, typecheck, tests (turbo, `cargo test`, `go test`), `knip` in every workspace that defines a `knip` script, and in full mode the builds, Worker smoke tests and, once the new website lands, Lighthouse. Tiers whose toolchain is missing locally are reported as skipped, never as passed; CI runs all of them.
9. **CI.** Existing jobs stay. One job is added and joined into the existing `ci` aggregate: `governance` (commitlint over the PR's commits, format and comment checks over changed files, release-note gate). The required check name stays `ci`.
10. **Scope of the format and comment gates.** Prettier, `gofmt` and the comment checker check only the files a commit or pull request changes. 119 files on `main` are not Prettier-formatted today; they get formatted as they are touched, not in one sweep that would bury real changes. A root `prettier.config.mjs` now points Prettier at the shared `packages/config` preset, which the root never used before.
11. **knip per workspace.** knip runs through `pnpm -r --if-present knip`, so it covers a workspace once that workspace adds a `knip` script and config. It crashes on the current Fumadocs docs app, and adding it with nothing to cover would break the packages-only-when-used rule. The rebuilt website is the first workspace to add it.

## Diagram

```
agent or human
   │ reads AGENTS.md ─► docs/engineering-standards.md, docs/architecture.md
   │
   ├─ non-trivial? ─► docs/adr/ADR-*.md + -for-dummies.md ─► human approves
   │
   ▼
.worktrees/<branch>  (cut from origin/main)
   │ git commit ─► lefthook pre-commit: prettier, eslint, comments
   │            └► commit-msg: commitlint (no AI attribution)
   │ git push   ─► pre-push: preflight --fast
   ▼
pull request ─► CI: ts, workers, go, rust, circuits, proto, governance ─► ci (required)
```

## Consequences

- Every agent session starts from the same rules, and the machine rejects the common failures (AI trailers, em dashes and AI phrases in comments, missing release notes).
- Non-trivial work waits for a human approval step. That is slower by design.
- Pre-push takes longer, roughly the time of lint, typecheck and tests across tiers that are installed locally.
- New dev dependencies at the root: `lefthook`, `@commitlint/cli`, `@commitlint/config-conventional` (exact versions pinned). `typescript` is already present for the comment checker.
- Removed: root `SKILL.md` (content moved). `CONTRIBUTING.md` and the PR template are updated to point at the new rules.

## Verification

- `./scripts/preflight.sh` passes on a clean checkout of this branch.
- A commit with a `Co-Authored-By: Claude` trailer is rejected by the commit-msg hook.
- A staged file with an em dash in a comment is rejected by the pre-commit hook.
- A PR that changes `apps/` without a release note fails the `governance` job in CI, and `ci` goes red.
