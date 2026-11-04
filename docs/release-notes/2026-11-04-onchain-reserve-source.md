---
date: 2026-11-04
branch: feat/onchain-demo
base: main
scenario-impact: needs_automation
---

# The orchestrator can read an institution's reserves straight from Stellar

Each institution now has its own reserve source. Most stay on the attested source (a custodian's signed balance; the sandbox in the demo). An institution routed to `onchain` has its reserves read from its Stellar accounts through Horizon on every cycle. The demo's third institution, Harbor Wallet, uses this with Circle's Testnet USDC.

## Changes

- `internal/infrastructure/onchain`: reads account balances from Horizon and returns them as reserve figures in stroops. Each holding names its tenant; a cycle reads only its own tenant's holdings.
- `internal/infrastructure/reservesource`: a router that sends each tenant to its source. Unknown source names, and a tenant routed to `onchain` with no holdings, stop the orchestrator at boot.
- Settings: `ORCH_RESERVE_SOURCES` (`TENANT_ID=attested|onchain`), `ORCH_ONCHAIN_HOLDINGS` (`TENANT_ID=ADDRESS|CODE|ISSUER`), `ORCH_ONCHAIN_HORIZON_URL` (default Horizon Testnet). Empty by default, so existing deployments are unchanged.
- Harbor Wallet: registry `CBOA5AJEMTQ5CSMHE6WFWWBIYYMNSUQGKWE6FCFB2KKNJSJPHBWSCSJK` and reserve account `GCPBHMM7KSE74LO757SPKBE3PHWYRTKKKVBCVZURBFM6B2GSOPAJAR4R` on Testnet; the setup runbook is in `deploy/vm/README.md`.

## Removed

- Supersedes the parked `wip/onchain-reserve-source` branch.

## Verification

- Tests for tenant filtering, holdings parsing with tenant ids, the router's choice and its boot errors, and the config; the adapter's existing cases carried over.
- After the runbook: one cycle for Harbor Wallet publishes a proof whose reserves equal the account's USDC balance in stroops. An end-to-end script for this path is not automated yet.
