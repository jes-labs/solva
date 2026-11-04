---
date: 2026-11-04
branch: fix/cycle-auth
base: main
scenario-impact: none
---

# Only the website and the console can start a proof cycle again

`POST /v1/cycles` requires the bearer token set in `ORCH_API_TOKEN` again. PR #164 added this gate for the whole `/v1` API; PR #183 dropped it while adding the control-plane routes, so anyone could start a cycle on the public backend and spend the publisher's fees.

## Changes

- `ORCH_API_TOKEN` is read again. When set, `POST /v1/cycles` returns 401 without `Authorization: Bearer <token>`. When empty, the orchestrator logs a warning and the route stays open for local and e2e runs.
- Reads (`/v1/proofs/*`, `/v1/tenants/{id}/contract`) stay public: they return data that is already public on Stellar, and the SDK and oracle read them without a token. The control-plane routes keep the admin token.

## Removed

- Nothing.

## Verification

- Red, then green: new router tests fail without the gate and pass with it (no token, wrong token, right token, unset token, public reads).
- New config test for `ORCH_API_TOKEN`.
- Orchestrator test suite passes.
