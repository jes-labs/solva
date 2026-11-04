## Summary

What this changes and why. Link the issue: Closes #

## Type

- [ ] feat
- [ ] fix
- [ ] perf
- [ ] refactor
- [ ] docs, build, ci or chore

## Tier

- [ ] Circuits (Noir)
- [ ] Prover (Rust)
- [ ] Contract or verifier (Soroban)
- [ ] Orchestrator or sandbox (Go)
- [ ] Website, console or docs (TypeScript)
- [ ] Oracle, SDK or shared packages (TypeScript)
- [ ] Tooling or CI

## Decision and plan

- ADR pair: `docs/adr/...` (approved by: ) or **not required** because:
- Plan: `docs/plans/...` or **not required** because:

## Pre-review audit

- [ ] **Read first:** I read the code, callers, tests and docs for everything I changed.
- [ ] **Boundaries:** tier boundaries kept (circuit hashing only in the prover and the contract); in Next.js apps, imports point down and features are imported only through `index.ts` / `server.ts`.
- [ ] **Server boundary:** upstream data validated and mapped on the server; no `fetch` or secrets in components.
- [ ] **Hooks:** the right hook for each job; stateful logic and effects in custom hooks.
- [ ] **Tests:** behaviour tests for success, empty, loading and error states (circuits: true, false, fraud bound, inclusion); bug fixes were red before green.
- [ ] **Money:** amounts in integer base units, never floats.
- [ ] **States:** every async path has loading and error states.
- [ ] **Accessibility:** keyboard, labels, contrast, reduced motion.
- [ ] **Comments:** no agent-written comments; human comments explain why in three lines or fewer.
- [ ] **Cleanup:** replaced code, assets, config and packages removed; `pnpm knip` is clean.
- [ ] **Dependencies:** any new package is used in this PR, pinned, and justified below.
- [ ] **Claims:** public text claims only what the code does today.
- [ ] **Preflight:** `./scripts/preflight.sh` passed with zero warnings. Tiers not run locally:
- [ ] **Release note:** `docs/release-notes/<date>-<topic>.md` with `scenario-impact` set.

## Removed

Code, files, config and packages this PR deletes.

## How this was verified

What you ran and what you clicked or called. For website changes: light and dark mode, on a phone-sized screen.
