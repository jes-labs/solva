# Contributing to Solva

This guide covers how we work in this repository. Read [SKILL.md](./SKILL.md) for the engineering standards. This document covers the mechanics: branches, pull requests, and the local setup.

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
2. Branch off `main`. Name the branch `type/short-description`, for example `feat/merkle-sum-circuit` or `fix/ecdsa-verify-panic`.
3. Make atomic commits. One logical change per commit. Write a clear message that says what changed and why.
4. Keep the pull request scoped to the issue. If you find unrelated work, open a separate issue.
5. Open the pull request against `main` and link the issue with `Closes #N`.
6. Get one approval and resolve every review conversation.
7. Squash merge. The branch is deleted automatically on merge.

## Branch naming

| Prefix | Use for |
|--------|---------|
| `feat/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Tooling, config, dependencies |
| `refactor/` | Internal change with no behavior change |
| `test/` | Tests only |

## Commit messages

Write the subject in the imperative mood. Keep it under 72 characters. Add a body when the change needs context.

```
feat(circuits): add Poseidon2 Merkle Sum Tree inclusion check

The solvency circuit needs an inclusion path that matches the
on-chain native Poseidon2 check. This adds the path verifier in
the merkle package and a passing test.
```

## Before you open a pull request

- Run `just lint` and `just test`.
- Verify your change works, do not assume it does.
- Update docs in `apps/docs` if you changed behavior the docs describe.

## Branch protection

`main` is protected. Direct pushes are blocked. Every change goes through a pull request with one approval, all conversations resolved, and a squash merge. Force pushes and branch deletion on `main` are not allowed.
