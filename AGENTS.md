# AGENTS.md

Rules for every AI coding agent working in this repository: Claude Code, Codex, Gemini, Cursor, Copilot, Qwen and any custom harness. They are mandatory. Where this file and a tool's defaults disagree, this file wins.

The coding bar is [`docs/engineering-standards.md`](docs/engineering-standards.md). The code's shape is [`docs/architecture.md`](docs/architecture.md). The human workflow is [`CONTRIBUTING.md`](CONTRIBUTING.md). Read all three before your first change in a session.

Solva is a monorepo with several languages: Noir circuits, Rust (prover, Soroban contract, verifier crate), Go (orchestrator, sandbox) and TypeScript (Next.js apps, oracle, SDK, shared packages). Each tier keeps its own tooling; `scripts/preflight.sh` runs them all.

---

## Directive 0: Read before you act

No agent edits, creates or deletes anything before it has read the code it is about to change.

1. Read this file, the engineering standards and the architecture document.
2. Read every file you will change, the files that import it, and its tests.
3. Read the recent history of that area: `git log --oneline -20 -- <path>`.
4. Search for existing code that already does the job (`rg`, a feature's `index.ts`, `src/hooks/`, `src/lib/`, `src/components/ui/`, the crate or package that owns the concept). Extending what exists beats writing something new.
5. Read the current documentation for every framework and library involved: `node_modules/next/dist/docs/` for Next.js (resolved from the app's own folder), Context7 or the official docs for everything else.
6. State your understanding of the current behaviour and the planned change before the first edit. If you cannot explain how the code works today, you have not read enough.

## Directive 1: Protected branch and worktree isolation

- Never commit or push to `main`. The `main` ruleset enforces it.
- Do all work in an isolated worktree cut from `origin/main`:
  `git worktree add .worktrees/<branch> -b <branch> origin/main`
- Sync before you branch: `git fetch origin main`. Never trust a local `main`.
- Do not commit or push on a person's behalf unless they ask. When they want to commit themselves, prepare a `ship-<topic>.sh` at the repository root (ignored by git) that commits, pushes and opens the pull request, and hand it over.
- **AI tools never co-author a commit in this repository.** No `Co-Authored-By` line naming an AI, no `Claude-Session` or other session trailer, no "Generated with" footer, in commits or pull request descriptions. `.claude/settings.json` turns Claude Code's attribution off, and the `commit-msg` hook (commitlint rule `no-ai-attribution`) rejects any commit that carries one. The human who commits is the author.

## Directive 2: Human approval before non-trivial work

Non-trivial means: a new feature, a new dependency, a new layer or folder convention, a change to build, deploy, caching or CI, a data-model change, a change to a circuit, the contract or the proof format, or anything touching money movement.

Before writing code for it, write two Architectural Decision Records from the templates in `docs/adr/`:

1. `docs/adr/ADR-<YYYY-MM-DD>-<topic>.md`: the technical record (context, options, decision, consequences, diagram).
2. `docs/adr/ADR-<YYYY-MM-DD>-<topic>-for-dummies.md`: the same decision in plain English for non-technical readers.

Then stop. An agent never approves its own ADR or plan. Work starts only after a human explicitly approves both documents. Silence is not approval, and a question about the ADR is not approval.

## Directive 3: Red, then green

Every bug fix starts with a failing test that reproduces the bug. Run it and confirm it fails for the reason you identified. Then write the smallest fix that makes it pass, and run the whole suite for that tier.

## Directive 4: No symptom masking

Never make an error, a type error or a failing test go away without fixing its cause:

- no empty or silent `catch` blocks, no ignored Go errors, no `unwrap()` on a fallible path that real input can reach,
- no `@ts-ignore`, `@ts-expect-error`, `any` or non-null assertions to quiet the compiler,
- no `#[allow(...)]` or `//nolint` to hide a warning the code can fix,
- no dummy, empty or fallback data standing in for a broken upstream,
- no deleting, skipping or weakening a failing test or assertion,
- no raising a budget, timeout or threshold to make a gate pass,
- no `eslint-disable` without a reason, and none where the code can be fixed.

## Directive 5: Agents do not write comments

Code produced by an agent contains no comments: no inline comments, no JSDoc or doc comments, no commented-out code, no section banners. If a decision needs a recorded reason, put it in the pull request description and let a human decide whether it becomes a comment. Comments written by humans follow the rules in the standards ([Comments](docs/engineering-standards.md#comments)). `pnpm comments:check` runs on every commit for TypeScript, JavaScript and CSS.

## Directive 6: Replace means remove

When your change supersedes an existing implementation, the same change deletes the old one with everything it carried: files, exports, styles, tests, assets, routes, environment variables, config and every package only it used. No parallel paths, no `legacy/` folders, no dead flags. `pnpm knip` must report nothing for the workspaces it covers.

## Directive 7: Packages only when used

Add a dependency (npm, crate or Go module) in the same change that first uses it, never ahead of time. Check that the platform or an existing dependency cannot do the job first. Pin the exact version and give the reason in the PR. Remove a dependency the moment its last user goes.

## Directive 8: React the way the standards say

Use the hook that fits the job (see the [hook table](docs/engineering-standards.md#hooks)). Stateful logic, effects and subscriptions live in custom hooks, never inline in components (see [Custom hooks](docs/engineering-standards.md#custom-hooks)). Where the React Compiler is on, do not add `useMemo` or `useCallback` by reflex.

## Directive 9: Lighthouse 98 to 100

Every route of the public website (`apps/website`) scores between 98 and 100 in Performance, Accessibility, Best Practices and SEO on a mobile Lighthouse run. A change that drops any category below 98 is not done; aim for 100. Add new routes to the website's `lighthouserc.json`.

## Directive 10: Preflight before done

Before you open a pull request or call a task complete, run `./scripts/preflight.sh` and get a clean pass. Zero errors, zero warnings. A tier the script reports as skipped (toolchain not installed) is not a pass: say so in the PR, and CI runs it. Then run what you changed and use it yourself. Report anything you could not verify.

## Directive 11: Use the tools you have

Check which MCP servers and skills your environment provides and use them: Context7 for library docs, the Next.js bundled docs, the shadcn registry (plus `@kokonutui` and `@vengeanceui`) for UI primitives, Chrome DevTools or Playwright for Lighthouse and runtime debugging, the Stellar CLI for contract state. Do not guess at an API a tool can show you.

---

## Lifecycle

```
0 READ ─► 1 SYNC ─► 2 DECIDE ─► 3 PLAN ─► 4 ISOLATE ─► 5 BUILD ─► 6 VERIFY ─► 7 DOCUMENT ─► 8 DELIVER
```

| Phase       | What happens                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0. Read     | Directive 0. Understand the code and the docs before anything else.                                                                 |
| 1. Sync     | `git fetch origin main`.                                                                                                            |
| 2. Decide   | Non-trivial work: ADR pair in `docs/adr/`, then wait for human approval (Directive 2).                                              |
| 3. Plan     | `docs/plans/<YYYY-MM-DD>-<topic>-plan.md`: files to touch, interfaces, state, test strategy, UI sketch, what gets removed.          |
| 4. Isolate  | Worktree off `origin/main` (Directive 1).                                                                                           |
| 5. Build    | Test-first, within the layer rules, adding packages only as used, removing what you replace.                                        |
| 6. Verify   | `./scripts/preflight.sh`, then use the change: run the service, the app, the circuit test or the contract call.                     |
| 7. Document | Release note in `docs/release-notes/<YYYY-MM-DD>-<topic>.md` with its `scenario-impact` line. Update any doc the change made wrong. |
| 8. Deliver  | Pull request against `main`, using the template. CI must pass.                                                                      |

## Pre-review audit

Before asking for review, check the change against each item. The PR template repeats them.

1. **Read first.** You read the code and docs you changed (Directive 0).
2. **Boundaries.** Repository tiers keep their boundaries (circuit hashing only in the prover and the contract). In Next.js apps, imports point down, features are imported only through `index.ts` or `server.ts`, and no feature imports another.
3. **Server boundary.** Upstream data is validated and mapped to our types on the server. Components never call `fetch` or hold secrets.
4. **Hooks.** Right hook for each job; stateful logic in custom hooks; no effects for derived state or events.
5. **Tests.** Behaviour tests for the change, covering loading, empty and error states, and for circuits the true, false, fraud-bound and inclusion cases. Bug fixes were red before green.
6. **Money.** Amounts in integer base units (`bigint`, `u64`/`i128`, `int64`/`big.Int`), never floats.
7. **States.** Every async path has a loading state and an error state; nothing freezes.
8. **Accessibility and Lighthouse.** Keyboard, labels and contrast checked; every touched website route still scores 98 or more in every category.
9. **Comments.** None from an agent; human comments explain why in three lines or fewer.
10. **Cleanup.** Replaced code, assets, config and packages removed; `pnpm knip` clean.
11. **Claims.** Public text (website, docs, README) claims only what the code does today.
12. **Preflight.** `./scripts/preflight.sh` passed with zero warnings.

## Commands

| Command                            | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `./scripts/preflight.sh`           | Every gate in every tier, including builds and Worker smoke tests       |
| `./scripts/preflight.sh --fast`    | Everything except builds, smoke tests and Lighthouse (runs on pre-push) |
| `pnpm lint` / `typecheck` / `test` | TypeScript gates through Turborepo                                      |
| `pnpm comments:check`              | Comment rules on changed TypeScript, JavaScript and CSS files           |
| `pnpm knip`                        | Unused files, exports and dependencies                                  |
| `just lint-check` / `just --list`  | Rust and the other tiers                                                |
