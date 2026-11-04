# ADR-2026-11-04: Read reserves on chain, and show it in the demo

- **Status:** Accepted
- **Approved by:** signor1, 2026-11-04
- **Companion:** [ADR-2026-11-04-onchain-reserve-demo-for-dummies.md](ADR-2026-11-04-onchain-reserve-demo-for-dummies.md)

## Context

The hackathon review of June 2026 asked Solva to "wire in one real reserve source (an on-chain holding is the simplest honest path)". Today every reserve figure in the demo comes from the sandbox, a mock custodian that signs synthetic balances.

Uncommitted work parked on `wip/onchain-reserve-source` adds `internal/infrastructure/onchain`: an adapter that reads account balances from Horizon and returns them as reserve figures in stroops, with tests. It is selected by one global setting, `ORCH_RESERVE_SOURCE=onchain`, so every institution on the orchestrator would switch at once.

Two facts shape the design:

- The two demo institutions, Kestrel Anchor (`CAFUK25F…LRTPN`) and Solstice Exchange (`CDSQ35U2…KEUQW`), already hold records of 16,000,000 sandbox units. Their registries require the next proof's previous reserves to equal the last record, and reserves may grow at most 10% per proof. Real holdings in a different unit would be refused on both registries.
- The attested adapter ignores the tenant: every institution on one orchestrator reads the same reserve accounts. An on-chain demo next to the sandbox demo needs the source chosen per institution.

Circle's Testnet USDC (`USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`, 136,571 holder accounts on 2026-11-04) is a real fiat-token asset on Testnet, available from Circle's faucet.

## Options considered

### Option A: switch the whole demo to on-chain reserves

One setting. Breaks both existing registries (previous-reserves and growth checks), and drops the sandbox scenarios that show a refused proof.

### Option B: choose the reserve source per institution, and add a third demo institution on chain

Keep Kestrel Anchor and Solstice Exchange on the attested source with their scenarios. Add a third fictional institution, **Harbor Wallet** (a custodial app), with its own new registry. Its reserves are Testnet USDC held in a Stellar account the Solva team controls, read live from Horizon on every cycle. Its liabilities are eight example customer balances in the same unit, totalling less than the holding. The orchestrator picks each institution's source from one setting that maps a tenant id to a source.

### Option C: read real Mainnet holdings of a real company

Real numbers, but the account would belong to a company that has not agreed, so the demo would make claims about it. Not acceptable.

## Decision

Option B.

- **Per-institution source.** `ORCH_RESERVE_SOURCES` maps tenant ids to `attested` or `onchain`. A tenant not listed uses `attested`, so today's deployment keeps working with no new setting. An unknown source name fails at boot. The single `ORCH_RESERVE_SOURCE` switch from the parked branch is not introduced.
- **On-chain holdings per institution.** `ORCH_ONCHAIN_HOLDINGS` entries carry the tenant id: `TENANT_ID=ADDRESS|CODE|ISSUER`. The adapter returns only the calling tenant's holdings, and a tenant with none fails the cycle with a clear error.
- **Demo institution.** Harbor Wallet, tenant `33333333-3333-3333-3333-333333333333`, a new registry owned by the publisher key, eight seeded customers in USDC stroops. The reserve account holds Testnet USDC from Circle's faucet. The website demo offers Harbor Wallet as a third institution and labels its reserves "Read from Stellar Testnet, account G…", linked to the explorer. Scenarios do not apply to it: its reserves are whatever the account holds.
- **Stability.** The holding is only topped up deliberately and never by more than 10% between proofs, so the growth bound is respected.
- **Honesty.** Kestrel Anchor and Solstice Exchange stay labelled as using a mock custodian. Harbor Wallet's liabilities stay labelled as example customers.
- **The demo reads Stellar itself.** The demo's "check the published record" step reads `get_latest_proof` from the institution's registry, and the holder step calls `verify_inclusion` on the contract, both from the website's server routes through Soroban RPC. Today both read the orchestrator's copy. This adds `@stellar/stellar-sdk` to `apps/website`, pinned to the version `packages/sdk-ts` already uses; the plan measures the Worker size before and after, and falls back to `@stellar/stellar-base` with plain RPC calls if the Worker grows past its limit.

## Diagram

```
 Kestrel Anchor, Solstice Exchange ── attested ─► sandbox (mock custodian, signed USD)
                                                      │
 Harbor Wallet ── onchain ─► Horizon Testnet ─► account G… balance of USDC (Circle)
                                                      │
                      orchestrator: ReserveSource chosen per tenant (ORCH_RESERVE_SOURCES)
                                                      │
                              prover ─► proof ─► the tenant's own registry on Stellar
```

## Consequences

- Better: the demo shows one institution whose reserves are real on-chain money, read from Stellar on every cycle, which is the reviewer's request. The shared-source bug is fixed for the source choice.
- Costs: one new registry deployment, a funded Testnet account with a USDC trustline, three new settings on the VM, one tenant row and eight customer rows. The runbook in the plan covers them.
- Removed: the parked `wip/onchain-reserve-source` branch is superseded; its adapter and tests move into this change.
- Packages: `@stellar/stellar-sdk` added to `apps/website` for the on-chain reads, at the version already in the lockfile. None added to the orchestrator. The adapter uses `github.com/stellar/go/strkey`, already in the orchestrator's module graph through the Stellar publisher. The plan confirms this before code.

## Verification

- Unit tests for the per-tenant source choice, holdings parsing with tenant ids, and the adapter (from the parked branch, extended).
- A cycle for Harbor Wallet against Testnet publishes a proof whose `r` equals the account's USDC balance in stroops, checked on the explorer.
- Kestrel Anchor and Solstice Exchange still run all six demo steps.
- `./scripts/preflight.sh` passes.
