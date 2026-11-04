# Solva demo on a single VM

Runs the whole backend (Postgres, Redis, prover, orchestrator, sandbox) on one
Ubuntu box with Docker. The website (Vercel) points at it. Meant for a temporary
demo, not production.

## Prerequisites

- An Ubuntu 24.04 VM (AWS Lightsail 4 GB or similar), TCP ports 8080 and 8090 open.
- Two proof-registry contracts deployed on Testnet, owned by your signer, plus
  the signer's secret seed. Deploy them from a machine with the Stellar CLI:
  ```bash
  cargo build -p proof-registry --release --target wasm32v1-none
  A=$(stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm \
    --source signor --network testnet -- --owner signor \
    --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin 2>/dev/null)
  B=$(stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm \
    --source signor --network testnet -- --owner signor \
    --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin 2>/dev/null)
  echo "$A"; echo "$B"; stellar keys show signor
  ```

## Deploy on the VM

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/jes-labs/solva
cd solva
export SIGNER_SECRET=S...     # from `stellar keys show signor`
export CONTRACT_A=C...        # Kestrel registry
export CONTRACT_B=C...        # Solstice registry
bash deploy/vm/setup.sh
```

The script installs Docker, generates the reserve-source signing key and API tokens, brings
up the stack, applies migrations, and seeds the two demo institutions. The first
prover build takes several minutes. It prints the exact Vercel variables at the end.

## Point the website at the box (Vercel)

Set these environment variables on the `apps/website` project, using the values
the script printed:

```
ORCHESTRATOR_URL              = http://<STATIC_IP>:8080
SANDBOX_URL                   = http://<STATIC_IP>:8090
ORCH_API_TOKEN                = <printed by the script>
NEXT_PUBLIC_STELLAR_EXPLORER  = https://stellar.expert/explorer/testnet
```

Redeploy the website, then open `https://<your-site>/sandbox`.

## Add the on-chain demo institution (Harbor Wallet)

Harbor Wallet is the demo institution whose reserves are read from Stellar instead of the sandbox. Its reserve account holds Circle's Testnet USDC. One-time setup:

| Item            | Value                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Tenant          | `33333333-3333-3333-3333-333333333333`                                                  |
| Registry        | `CBOA5AJEMTQ5CSMHE6WFWWBIYYMNSUQGKWE6FCFB2KKNJSJPHBWSCSJK` (owned by `signor`)          |
| Reserve account | `GCPBHMM7KSE74LO757SPKBE3PHWYRTKKKVBCVZURBFM6B2GSOPAJAR4R` (local key `harbor-reserve`) |
| Asset           | `USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`                         |
| Customers       | three, owing 4, 3 and 2 USDC (90,000,000 stroops)                                       |

1. Fund the reserve account with 10 Testnet USDC at faucet.circle.com (network: Stellar Testnet). Top it up later in steps of less than 10%: the registry refuses a proof whose reserves grow by more than 10%.
2. On the VM, seed the tenant and its customers:

   ```bash
   cd ~/solva && git pull
   DC="sudo docker compose -f deploy/vm/compose.yml"
   $DC exec -T postgres psql -U solva -d solva -v ON_ERROR_STOP=1 <<'SQL'
   INSERT INTO tenants (id, name, plan, contract_id, network) VALUES
     ('33333333-3333-3333-3333-333333333333','Harbor Wallet','growth','CBOA5AJEMTQ5CSMHE6WFWWBIYYMNSUQGKWE6FCFB2KKNJSJPHBWSCSJK','testnet');
   WITH ins AS (
     INSERT INTO customers (tenant_id, external_ref, id_hash)
     SELECT '33333333-3333-3333-3333-333333333333'::uuid, c.ref, c.h FROM (VALUES
       ('cust-001','0000000000000000000000000000000000000000000000000000000000000001'),
       ('cust-002','0000000000000000000000000000000000000000000000000000000000000002'),
       ('cust-003','0000000000000000000000000000000000000000000000000000000000000003')
     ) AS c(ref,h)
     RETURNING id, tenant_id, external_ref
   )
   INSERT INTO liabilities (tenant_id, customer_id, balance)
   SELECT ins.tenant_id, ins.id, v.bal FROM ins JOIN (VALUES
     ('cust-001',40000000::numeric),('cust-002',30000000::numeric),('cust-003',20000000::numeric)
   ) AS v(ref,bal) ON ins.external_ref = v.ref;
   SQL
   ```

3. Route Harbor Wallet to the on-chain source and restart the orchestrator:

   ```bash
   sed -i '/ORCH_SCHEDULER_ENABLED:/a\      ORCH_RESERVE_SOURCES: "33333333-3333-3333-3333-333333333333=onchain"\n      ORCH_ONCHAIN_HOLDINGS: "33333333-3333-3333-3333-333333333333=GCPBHMM7KSE74LO757SPKBE3PHWYRTKKKVBCVZURBFM6B2GSOPAJAR4R|USDC|GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"' deploy/vm/compose.yml
   grep -n "ORCH_RESERVE_SOURCES\|ORCH_ONCHAIN_HOLDINGS" deploy/vm/compose.yml
   $DC up -d --build orchestrator
   ```

4. Run one cycle for Harbor Wallet and check the published reserves match the account:

   ```bash
   curl -s -X POST localhost:8080/v1/cycles -H "Authorization: Bearer $(cat deploy/vm/orch_api_token.txt)" \
     -H 'content-type: application/json' -d '{"tenant_id":"33333333-3333-3333-3333-333333333333"}'
   curl -s "localhost:8080/v1/proofs/latest?tenant_id=33333333-3333-3333-3333-333333333333"
   ```

   `reserves_total` is the account's USDC balance in stroops (10 USDC is `100000000`).

## Operate

```bash
sudo docker compose -f deploy/vm/compose.yml ps        # status
sudo docker compose -f deploy/vm/compose.yml logs -f    # logs
sudo docker compose -f deploy/vm/compose.yml down       # stop
```

Stop the VM from the Lightsail console when you are not demoing to save credits.
The static IP keeps the address stable across stop/start.
