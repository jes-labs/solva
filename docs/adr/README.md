# Architectural Decision Records

An ADR records one significant decision: the context, the options, what was chosen and what it costs. Every non-trivial change needs a pair, approved by a maintainer before code is written.

## When an ADR is required

A new feature, a new dependency, a new folder or layer convention, a change to build, deploy, caching or CI, a data-model change, or anything that moves money.

## The pair

| File                                      | Audience      | Template                                             |
| ----------------------------------------- | ------------- | ---------------------------------------------------- |
| `ADR-<YYYY-MM-DD>-<topic>.md`             | Engineers     | [`template.md`](template.md)                         |
| `ADR-<YYYY-MM-DD>-<topic>-for-dummies.md` | Everyone else | [`template-for-dummies.md`](template-for-dummies.md) |

## Status

`Proposed` → `Accepted` or `Rejected`. Later, `Superseded by ADR-...` when a new decision replaces it. Only a human maintainer moves an ADR out of `Proposed`, and records their name and the date.

## Rules

- One decision per ADR.
- Never edit an accepted ADR's decision. Write a new ADR that supersedes it.
- Keep it short. If it needs more than two pages, it is probably two decisions.
