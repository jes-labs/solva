# Plan: a global reserve source

## 1. Scope

Implements [ADR-2026-11-04-global-reserve-source](../adr/ADR-2026-11-04-global-reserve-source.md), Option B. The sandbox prices balances in `USD` and the word "bank" leaves every place where it names the reserve source.

Out of scope: `apps/website`. The website rebuild (`feat/website`) replaces that app entirely and already talks to the sandbox through `/v1/accounts/{id}/balance`, which this change keeps. The oracle tool name `get_solvency` and the circuit package name stay, as the ADR records.

## 2. Files

| Layer                        | Change                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox                      | `internal/bank` moves to `internal/reserves`. `Account.BankID` becomes `CustodianID` (`custodian-anchor`, `custodian-beacon`, `custodian-cedar`). `NGN` becomes `USD`. |
| Orchestrator adapter         | `internal/infrastructure/banks` moves to `internal/infrastructure/attested`.                                                                                           |
| Orchestrator port            | `usecase.BankAdapter` becomes `usecase.ReserveSource`; the cycle's field `banks` becomes `sources`, since `reserves` already names the reserve repository.             |
| Orchestrator config          | `Bank*` fields become `Reserve*`; `ORCH_BANK_*` becomes `ORCH_RESERVE_*`.                                                                                              |
| Migrations                   | `0005_attested_source_type.sql` and `.down.sql`.                                                                                                                       |
| SDK                          | `BankSourceConfig` becomes `ReserveSourceConfig`, `type: "attested" \| "onchain"`.                                                                                     |
| Console (`apps/web`)         | `SourceType` becomes `"attested" \| "onchain"`; copy says reserve source or custodian, not bank.                                                                       |
| Docs, README, infra, scripts | Same words; seed tenant "Kestrel Anchor"; key files `reserve-source.*`.                                                                                                |

## 3. Interfaces

```go
type ReserveSource interface {
	FetchSigned(ctx context.Context, tenantID string) (entity.ReserveSnapshot, error)
}
```

```ts
export interface ReserveSourceConfig {
  type: "attested" | "onchain";
}
```

The sandbox HTTP API and the signed payload are unchanged: `source_id`, `balance`, `currency`, `as_of`, `signature`.

## 4. State

No new state. One stored value changes: `reserve_sources.type` `openbanking` becomes `attested`.

## 5. Tests

- Red first: the sandbox registry test expects `USD` and fails against `NGN`.
- The orchestrator adapter tests move with the package and keep their cases.
- The config test reads the `ORCH_RESERVE_*` names.
- The migration is run up, down and up again on a throwaway Postgres; a row with `openbanking` reads back as `attested`, then back.
- SDK and console tests pass with the new type.

## 6. UI

The console's connect-source dialog and sources panel keep their layout; only labels and the stored type change.

## 7. Removal

The `bank` and `banks` packages, the `ORCH_BANK_*` names, `BankSourceConfig`, `openbanking` in code and docs, the "Meridian Bank" seed, and the `bank.*` key file names. No packages are added or removed.

## 8. Lighthouse

No website route changes in this branch.
