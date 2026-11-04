# Plan: reserves read on chain, shown in the demo

## 1. Scope

Implements [ADR-2026-11-04-onchain-reserve-demo](../adr/ADR-2026-11-04-onchain-reserve-demo.md), accepted on 2026-11-04. Two pull requests:

1. **Orchestrator:** per-institution reserve source and the on-chain adapter.
2. **Website demo:** Harbor Wallet, and reads from the contract on Stellar.

## 2. Orchestrator

| File                                                                | Change                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `internal/infrastructure/onchain/adapter.go`, `adapter_test.go`     | Taken from `wip/onchain-reserve-source` without its comments. `Holding` gains `Tenant`. `ParseHoldings` reads `TENANT_ID=ADDRESS\|CODE\|ISSUER`. `FetchSigned` returns only the calling tenant's holdings; a tenant with none is an error.        |
| `internal/infrastructure/reservesource/router.go`, `router_test.go` | New. `ParseSources("tenant=onchain,tenant=attested")` and a `Router` that implements `usecase.ReserveSource` by tenant, falling back to the attested source. Unknown source names and a tenant routed to `onchain` with no holdings fail at boot. |
| `internal/config/config.go`, `config_test.go`                       | `ReserveSources`, `OnChainHorizonURL` (default `https://horizon-testnet.stellar.org`), `OnChainHoldings`.                                                                                                                                         |
| `cmd/app/deps.go`                                                   | Builds the attested adapter as today, the on-chain adapter when any tenant uses it, and the router.                                                                                                                                               |
| `deploy/vm/setup.sh`, `deploy/vm/README.md`                         | The two settings, empty by default, and the Harbor Wallet runbook.                                                                                                                                                                                |

Settings on the VM after the change:

```
ORCH_RESERVE_SOURCES=33333333-3333-3333-3333-333333333333=onchain
ORCH_ONCHAIN_HOLDINGS=33333333-3333-3333-3333-333333333333=G…|USDC|GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Tests: router choice per tenant and default; unknown name; an `onchain` tenant without holdings; holdings parsing with tenant ids and its errors; the adapter's existing cases (native, credit asset, missing asset, 404, 5xx retry, stroop conversion) plus tenant filtering; config reads.

## 3. Demo institution (operations, after PR 1 merges)

1. Create the reserve account on Testnet with friendbot, add a USDC trustline to `GBBD47IF…LLFLA5`, fund it from Circle's faucet (faucet.circle.com, done by the maintainer).
2. Deploy a new proof-registry owned by the publisher key, with the current verifying key.
3. Insert tenant `33333333-3333-3333-3333-333333333333` "Harbor Wallet" with its contract, and three customers owing 4, 3 and 2 USDC (90,000,000 stroops), less than the 10 USDC holding.
4. Set the two settings on the VM and restart the orchestrator. Run one cycle; the first proof declares previous reserves equal to the holding.

A runbook in `deploy/vm/README.md` lists the exact commands.

## 4. Website demo (PR 2)

| File                                                    | Change                                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `features/product/lib/sandbox.ts`                       | Harbor Wallet in `INSTITUTIONS`, with `source: "onchain"` and its reserve account. Scenarios hidden for it. Step lines for its reserves say "read from Stellar Testnet, account G…". |
| `app/api/sandbox/reserves/route.ts`                     | For Harbor Wallet, read the account's USDC balance from Horizon instead of the sandbox.                                                                                              |
| `app/api/sandbox/status/route.ts`, `inclusion/route.ts` | Read `get_latest_proof` from the tenant's registry and run `verify_inclusion` on the contract through Soroban RPC simulation, with `@stellar/stellar-sdk`.                           |
| Step copy, docs pages that describe the demo            | Say what the demo reads, now from the contract.                                                                                                                                      |

The Worker size is measured before and after adding `@stellar/stellar-sdk`; if it grows past the limit, use `@stellar/stellar-base` and plain RPC calls.

## 5. Removal

The `wip/onchain-reserve-source` branch, after PR 1 merges. Nothing else is replaced.
