---
date: 2026-11-04
branch: fix/global-reserve-source
base: main
scenario-impact: updated
---

# The demo's reserves are in US dollars, and the backend no longer says "bank"

The sandbox now reports every reserve balance in `USD`. The backend, the console, the docs site, the SDK and the scripts call the place reserves come from a reserve source: "attested" when a custodian signs the balance, "onchain" when it is read from Stellar. The demo institution is now "Kestrel Anchor", the same example the website uses.

## Changes

- Sandbox: package `internal/bank` is now `internal/reserves`; mock custodians replace mock banks; balances are `USD`.
- Orchestrator: package `internal/infrastructure/banks` is now `internal/infrastructure/attested`; the port `BankAdapter` is now `ReserveSource`; settings `ORCH_BANK_*` are now `ORCH_RESERVE_*`.
- Migration `0005_attested_source_type` rewrites stored source type `openbanking` to `attested`, with a down file.
- SDK: `BankSourceConfig` is now `ReserveSourceConfig`, with `type: "attested" | "onchain"`.
- Console: institution types are anchor, custodial app, exchange and custodian; the connect-source flow offers a custodian account or an on-chain wallet.
- Docs site, README, `infra/HOSTING.md`, `deploy/vm` and the e2e and demo scripts use the same words and the "Kestrel Anchor" seed. Key files are named `reserve-source.*`.

## Removed

- The `bank` and `banks` packages, the `ORCH_BANK_*` settings, the `openbanking` type, `BankSourceConfig`, the "Meridian Bank" seed and the `bank.*` key file names. No packages added or removed.

## Verification

- Red, then green: the sandbox registry test expected `USD` and failed against `NGN`; it passes after the fix.
- New config test: `ORCH_RESERVE_*` settings load, and the removed `ORCH_BANK_BASE_URL` is ignored.
- Migration `0005` run up, down and up again on a throwaway Postgres 16; `openbanking` reads back as `attested`, and `onchain` is untouched.
- Orchestrator repository tests run against that database and pass.
- No website route changes, so Lighthouse is unaffected.
- Redeploy: follow the runbook in the ADR on the Lightsail VM after merge.
