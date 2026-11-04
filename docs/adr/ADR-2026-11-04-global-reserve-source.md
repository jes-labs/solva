# ADR-2026-11-04: A global reserve source, with no bank and no naira

- **Status:** Accepted
- **Approved by:** signor1, 2026-11-04
- **Companion:** [ADR-2026-11-04-global-reserve-source-for-dummies.md](ADR-2026-11-04-global-reserve-source-for-dummies.md)

## Context

Solva is a global product for anchors that issue fiat tokens on Stellar and for custodial apps that hold customer money on Stellar. It is not built for commercial banks, and nothing public may tie it to one country.

The backend still describes the place reserves come from as a bank, and the sandbox prices every balance in Nigerian naira:

- `services/sandbox/internal/bank/registry.go` sets `Currency: "NGN"` on every mock account, and its tests assert it. The sandbox package is named `bank`.
- The orchestrator reads that source through `internal/infrastructure/banks` and four settings: `ORCH_BANK_BASE_URL`, `ORCH_BANK_CLIENT_ID`, `ORCH_BANK_ACCOUNTS` and `ORCH_BANK_PUBLIC_KEY_PEM`.
- A reserve source is stored with `type = 'openbanking'` (`migrations/0001_init.sql`), and the private SDK exports `BankSourceConfig` with `type: "openbanking" | "onchain"`.
- The demo VM is seeded with an institution named "Meridian Bank" (`scripts/demo-up.sh`, `deploy/vm/setup.sh`), and the VM setup generates a "bank signing key" (`bank.key`, `bank.pub.pem`).
- The console app (`apps/web`), the docs site (`apps/docs/content/docs/sandbox.mdx`), the README, `infra/HOSTING.md`, the e2e scripts and two comments in `proto/prover.proto` and `packages/shared-types` say "bank".

The website already hides the currency code since the demo fix of 2026-11-03, but the source data is still naira and the vocabulary is still bank. Every reserve figure on the public demo passes through this code.

The backend runs on one AWS Lightsail VM (`solva-demo`, Frankfurt) with Docker Compose. `deploy/vm/setup.sh` generates `deploy/vm/compose.yml` on the box; a redeploy is a `git pull` and a rebuild of the affected containers.

Separate, uncommitted work in the main checkout adds `ORCH_RESERVE_SOURCE` (`"bank"` or `"onchain"`) and an on-chain reserve source under `internal/infrastructure/onchain`. It touches `config.go`, `deps.go` and `main.go`, the same files this change renames.

## Options considered

### Option A: change the currency only

Set the sandbox currency to `USD` and update its tests. Redeploy the sandbox container.

Small and quick. Leaves "bank" in the package, the settings, the stored type, the SDK, the seed data and every doc, so the product still describes itself as bank infrastructure to anyone who reads the code, the docs or the console.

### Option B: one vocabulary, clean cut

Replace "bank" with "reserve source" everywhere it names the concept, and price the sandbox in `USD`:

| Today                                                              | After                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| sandbox package `internal/bank`                                    | `internal/reserves`                                                   |
| orchestrator `internal/infrastructure/banks`                       | `internal/infrastructure/attested`                                    |
| `ORCH_BANK_BASE_URL`, `_CLIENT_ID`, `_ACCOUNTS`, `_PUBLIC_KEY_PEM` | `ORCH_RESERVE_BASE_URL`, `_CLIENT_ID`, `_ACCOUNTS`, `_PUBLIC_KEY_PEM` |
| source type `openbanking`                                          | `attested`                                                            |
| SDK `BankSourceConfig`                                             | `ReserveSourceConfig`                                                 |
| seed tenant "Meridian Bank"                                        | "Kestrel Anchor" (matches the website's example)                      |
| seed tenant "Solstice Exchange"                                    | "Solstice" (unchanged in meaning)                                     |
| `bank.key`, `bank.pub.pem`                                         | `reserve-source.key`, `reserve-source.pub.pem`                        |
| `Currency: "NGN"`                                                  | `Currency: "USD"`                                                     |

`attested` matches what the website's trust page already says: the reserve balance is attested by a signature, not proven. A migration rewrites stored `openbanking` rows to `attested`. The old setting names and the old type are removed, not kept as aliases, so there is one path (Directive 6). The VM runbook below renames the settings in the generated `compose.yml` and updates the seed rows, so no fallback code is needed.

Costs one reviewed PR across the sandbox, orchestrator, SDK, console, docs and scripts, and a five-minute redeploy.

### Option C: Option B with fallbacks

As B, but the orchestrator also reads the old `ORCH_BANK_*` names and accepts `openbanking` for one release.

Safer for deployments we do not control. We control the only deployment, so the extra path buys nothing and must be removed later.

## Decision

Option B. The currency becomes `USD`, the dominant reserve currency of fiat tokens on Stellar, and "bank" leaves every place it names the reserve source. The on-chain work in the main checkout lands first, or is rebased onto this change, so its new `ORCH_RESERVE_SOURCE` switch uses `"attested"` and `"onchain"` from the start rather than `"bank"`.

Out of scope, recorded for later: the oracle's MCP tool name `get_solvency` and the `solva_solvency` circuit package name. They are names in the proof and agent interfaces and deserve their own decision.

## Diagram

```
 reserve accounts (custodian, signed API)          Stellar ledger
          │  signed balance, USD                       │ balances
          ▼                                            ▼
 sandbox: internal/reserves        orchestrator: infrastructure/onchain
          │  /v1/accounts/{id}/balance                 │
          ▼                                            │
 orchestrator: infrastructure/attested ◄───────────────┘
          │  ReserveSource{type: "attested" | "onchain"}
          ▼
 prover ─► proof ─► registry contract on Stellar ─► coverage record
```

## Consequences

- The backend, console, docs and SDK use the same words as the website: reserve source, attested, on chain. No naira, no bank.
- The demo log, the console and the docs show reserve balances in USD.
- One migration (`0005_attested_source_type.sql`, with its `.down.sql`) rewrites `reserve_sources.type` from `openbanking` to `attested`; the down file reverses it. Both are safe to run twice.
- The VM's generated `compose.yml` must have four settings renamed during the redeploy (runbook below). Until then the new orchestrator will not start, so the redeploy is done in one sitting.
- Removed: the `bank` and `banks` packages, the `ORCH_BANK_*` names, the `openbanking` type, `BankSourceConfig`, the bank seed names and key file names.
- Packages added or removed: none.

## Redeploy runbook (Lightsail VM)

Run on the VM after the PR merges. The commands rename settings in place and keep the existing keys and API tokens, so the website's settings do not change.

```bash
cd ~/solva && git pull
sed -i 's/ORCH_BANK_/ORCH_RESERVE_/g' deploy/vm/compose.yml
for f in key pkcs8.pem pub.pem; do mv "deploy/vm/bank.$f" "deploy/vm/reserve-source.$f"; done
sudo docker compose -f deploy/vm/compose.yml up -d --build sandbox orchestrator
DC="sudo docker compose -f deploy/vm/compose.yml"
$DC exec -T postgres psql -U solva -d solva -v ON_ERROR_STOP=1 \
  < services/orchestrator/migrations/0005_attested_source_type.sql
$DC exec -T postgres psql -U solva -d solva -v ON_ERROR_STOP=1 \
  -c "UPDATE tenants SET name = 'Kestrel Anchor' WHERE name = 'Meridian Bank';"
$DC ps
curl -s localhost:8090/health && curl -s localhost:8080/health
```

Migrations are applied the way `setup.sh` applies them, by piping the SQL file through `psql` as user `solva` on database `solva`; the orchestrator does not migrate on start.

## Implementation notes

Recorded while building the approved decision, on 2026-11-04:

- The port is `usecase.ReserveSource`. The cycle's field is `sources`, because `reserves` already names the reserve repository.
- The sandbox's internal `BankID` becomes `CustodianID`, with ids `custodian-anchor`, `custodian-beacon` and `custodian-cedar`. The HTTP API and the signed payload do not change.
- The seed tenant "Solstice Exchange" keeps its name. An exchange is a custodial app, and keeping it means the runbook renames one row, not two.
- `apps/website` on `main` is left alone. The website rebuild replaces that app and already reads the sandbox through the unchanged `/v1/accounts/{id}/balance`.
- `0001_init.sql` keeps its comment naming `openbanking`, because applied migrations are history; `0005` records the change.
- The runbook also renames the VM's key files so they match the new names in `deploy/vm/.gitignore`. The keys themselves do not change.
- The console stores the institution type in the browser. A record saved with a type that no longer exists (`bank`, `fintech`, `stablecoin`) is ignored, so that operator fills in the mock onboarding form once more.

## Verification

- Go tests for the sandbox and orchestrator, the SDK and console tests, and `./scripts/preflight.sh`, all clean.
- A test asserts every sandbox account reports `USD`.
- A migration test: a row with `openbanking` reads back as `attested`.
- `rg -i "\bbank|openbanking|NGN"` over the repository returns only this ADR, its companion, its plan and release note, the migrations that name the old value, and the config test that proves the old names are ignored.
- After the redeploy, the live `/demo` runs all six steps, the reserves step shows balances that add up to R, and the sandbox's balance response reports `USD`.
