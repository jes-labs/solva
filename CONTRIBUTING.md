# Contributing to Solva

This guide covers how we work in this repository. The rules every contributor follows, human or AI agent, are in [AGENTS.md](./AGENTS.md), [docs/engineering-standards.md](./docs/engineering-standards.md) and [docs/architecture.md](./docs/architecture.md). This document covers the mechanics: setup, branches, pull requests and checks.

## Prerequisites

Install the toolchain for the tiers you work on:

- Node 22 and pnpm 10 (web, docs, oracle, SDK)
- Go 1.25 (orchestrator, sandbox)
- Rust 1.91 with the `wasm32v1-none` target (prover, contract)
- Nargo, Noir 1.0.0-beta.9 and Barretenberg 0.87.0 (circuits)
- Stellar CLI 3.2 or newer
- Docker, Just, and Buf

## Local setup

```bash
pnpm install
just dev
```

`just dev` starts Postgres and Redis, compiles the circuits, and runs every service. Run `just --list` to see individual targets.

## Workflow

We use one issue, one branch, one pull request.

1. Pick an issue. Assign it to yourself so two people do not take the same one.
2. Create a worktree off `origin/main` (`git worktree add .worktrees/<branch> -b <branch> origin/main`). Name the branch `type/short-description`, for example `feat/merkle-sum-circuit` or `fix/ecdsa-verify-panic`.
3. Make atomic commits. One logical change per commit. Write a clear message that says what changed and why.
4. Keep the pull request scoped to the issue. If you find unrelated work, open a separate issue.
5. Open the pull request against `main` and link the issue with `Closes #N`.
6. Get the `ci` check green and resolve every review conversation.
7. Squash merge. The branch is deleted automatically on merge.

## Branch naming

| Prefix      | Use for                                 |
| ----------- | --------------------------------------- |
| `feat/`     | New functionality                       |
| `fix/`      | Bug fixes                               |
| `docs/`     | Documentation only                      |
| `chore/`    | Tooling, config, dependencies           |
| `refactor/` | Internal change with no behavior change |
| `test/`     | Tests only                              |

## Commit messages

Write the subject in the imperative mood. Keep it under 72 characters. Add a body when the change needs context.

```
feat(circuits): add Poseidon2 Merkle Sum Tree inclusion check

The solvency circuit needs an inclusion path that matches the
on-chain native Poseidon2 check. This adds the path verifier in
the merkle package and a passing test.
```

## Decisions, plans and release notes

- Non-trivial work (a new feature, dependency, folder convention, build or CI change, a change to a circuit, the contract or the proof format) starts with an ADR pair in `docs/adr/`, approved by a maintainer before any code. See [docs/adr/README.md](./docs/adr/README.md).
- Larger work gets a plan in `docs/plans/`.
- Every pull request that changes code under `apps/`, `services/`, `contracts/`, `crates/`, `circuits/`, `packages/` or `proto/` adds a release note in `docs/release-notes/`. CI fails without one.

## Git hooks

`pnpm install` installs the hooks through lefthook:

- **pre-commit:** Prettier on staged files and the comment checker.
- **commit-msg:** commitlint. Messages follow Conventional Commits, and any AI co-author, session or "generated with" line is rejected.
- **pre-push:** `./scripts/preflight.sh --fast`.

## Before you open a pull request

- Run `./scripts/preflight.sh`. It runs format, lint, comments, typecheck and tests in every tier, then the builds and the Worker smoke tests. Tiers whose toolchain you do not have are listed as not run; CI runs them.
- Verify your change works; do not assume it does.
- Update the docs if you changed behaviour they describe.

## Branch protection

`main` is protected. Direct pushes are blocked. Every change goes through a pull request with a green `ci` check, all conversations resolved, and a squash merge. Force pushes and branch deletion on `main` are not allowed.
