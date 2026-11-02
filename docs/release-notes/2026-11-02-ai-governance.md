---
date: 2026-11-02
branch: chore/governance
base: main
scenario-impact: none
---

# Rules and checks for everyone who changes Solva, including AI agents

Every contributor, human or AI agent, now starts from one rulebook (`AGENTS.md`), and local hooks plus a new CI job reject the common failures before they reach `main`. Non-trivial work starts with an ADR pair a maintainer approves.

## Changes

- Added `AGENTS.md` (twelve directives, lifecycle, pre-review audit) and `CLAUDE.md` pointing at it.
- Added `docs/engineering-standards.md` and `docs/architecture.md`, adopting the Tsion Market standards for TypeScript and React and keeping the Rust, Go and Noir rules.
- Added `docs/adr/`, `docs/plans/` and `docs/release-notes/` with templates.
- Added `.claude/settings.json` (no AI attribution) and the `solva-engineering-standards` skill pointer.
- Added lefthook hooks: Prettier and the comment checker on commit, commitlint with a `no-ai-attribution` rule on the message, the fast preflight on push.
- Added `scripts/preflight.sh`, `scripts/check-comments.mjs`, `scripts/check-format.mjs`, `scripts/check_release_notes.sh` and a root `prettier.config.mjs`.
- Added a `governance` job to CI, joined into the required `ci` check.
- Updated `CONTRIBUTING.md`, the PR template and `.gitignore` (`.worktrees/`, root `*.sh`).

## Removed

- Root `SKILL.md`. Its rules moved into `docs/engineering-standards.md` and `docs/architecture.md`.

## Verification

- `pnpm comments:check` rejects a comment with an em dash or a filler phrase and passes on this branch.
- `pnpm exec commitlint` rejects a message with a `Co-Authored-By: Claude` trailer and accepts a plain conventional message.
- `pnpm format:check` passes on the changed files.
- `./scripts/preflight.sh --fast` result is recorded in the pull request.
