# Hosting the Solva demo on free tiers

This deploys the full Solva stack so judges can open a URL and run the `/sandbox`
playground live: connect a mock bank, prove reserves cover liabilities, publish a
proof to Stellar Testnet, and verify it. Nothing here is local-only.

## What runs where

| Component | Host | Why |
|---|---|---|
| Postgres | **Neon** (free) | the orchestrator's data: tenants, liabilities, proofs |
| Redis | **Upstash** (free) | the per-tenant cycle lock + idempotency |
| Sandbox (Go) | **Fly.io** | the mock open-banking bank, public |
| Orchestrator (Go) | **Fly.io** | the cycle engine, public |
| Prover (Rust + bb) | **Fly.io** | proving; private, only the orchestrator calls it |
| Website (Next) | **Vercel** (free) | the marketing site + `/sandbox`, reaches the backend server-side |

The website's `/sandbox` API routes run server-side, so the browser only talks to
the website (no CORS). The website reaches the orchestrator and sandbox over their
public HTTPS URLs; the orchestrator reaches the prover over Fly's private network,
so the prover never needs a public address.

A note on "free": Neon, Upstash, and Vercel have real free tiers. The three
container services use Fly.io, which is pay-as-you-go with a small allowance; the
prover wants ~2 GB RAM for `bb`, so size that machine accordingly. Railway or
Render work too (Render's free web services sleep, which is fine for a demo).

## Prerequisites

- Accounts: Fly.io (`flyctl`), Neon, Upstash, Vercel.
- The `stellar` CLI with a funded Testnet identity that will **own** the demo
  contracts (this guide uses `signor`). Top it up any time:
  `curl "https://friendbot.stellar.org/?addr=$(stellar keys address signor)"`.
- `openssl` and `psql` locally for the one-time key and seed steps.

## 1. Postgres (Neon)

Create a project, copy the connection string, and apply the migrations once:

```bash
export PG="postgres://USER:PASS@HOST/db?sslmode=require"   # from Neon
for f in $(ls services/orchestrator/migrations/*.sql | grep -v '\.down\.sql$' | sort); do
  psql "$PG" -v ON_ERROR_STOP=1 -f "$f"
done
```

## 2. Redis (Upstash)

Create a database, copy the `rediss://…` URL. That is `ORCH_REDIS_URL`.

## 3. A fixed bank signing key

The sandbox signs balances; the orchestrator verifies them. Generate one P-256
key so the pair stays stable across restarts:

```bash
openssl ecparam -genkey -name prime256v1 -noout -out bank.key
openssl pkcs8 -topk8 -nocrypt -in bank.key -out bank.pkcs8.pem   # SANDBOX_SIGNING_KEY_PEM
openssl ec -in bank.key -pubout -out bank.pub.pem               # ORCH_BANK_PUBLIC_KEY_PEM
```

## 4. Deploy the prover (private)

`bb` ships a Linux binary for **amd64 only**, so the prover image is amd64 and
must be built on an amd64 host. Fly's remote builder is amd64, so `fly deploy`
builds it correctly even from an Apple Silicon machine (it does not build
locally). Do not try `docker build` for this image on Apple Silicon; amd64 `bb`
crashes under Rosetta.

```bash
fly launch --no-deploy --dockerfile services/prover/Dockerfile --name solva-prover
fly deploy --remote-only --dockerfile services/prover/Dockerfile -a solva-prover
fly scale memory 2048 -a solva-prover    # bb needs headroom
```
No public service needed; the orchestrator reaches it at `solva-prover.internal:50051`.

## 5. Deploy the sandbox (public)

```bash
fly launch --no-deploy --dockerfile services/sandbox/Dockerfile --name solva-sandbox
fly secrets set -a solva-sandbox \
  SANDBOX_HTTP_ADDR=":8090" \
  SANDBOX_SIGNING_KEY_PEM="$(cat bank.pkcs8.pem)"
fly deploy --dockerfile services/sandbox/Dockerfile -a solva-sandbox
```
Its public URL is `https://solva-sandbox.fly.dev`.

## 6. Deploy the orchestrator (public)

```bash
fly launch --no-deploy --dockerfile services/orchestrator/Dockerfile --name solva-orchestrator
fly secrets set -a solva-orchestrator \
  ORCH_HTTP_ADDR=":8080" \
  ORCH_POSTGRES_URL="$PG" \
  ORCH_REDIS_URL="rediss://…" \
  ORCH_PROVER_ADDR="solva-prover.internal:50051" \
  ORCH_BANK_BASE_URL="https://solva-sandbox.fly.dev" \
  ORCH_BANK_PUBLIC_KEY_PEM="$(cat bank.pub.pem)" \
  ORCH_STELLAR_SIGNER_SECRET="$(stellar keys show signor)" \
  ORCH_STELLAR_RPC_URL="https://soroban-testnet.stellar.org" \
  ORCH_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015" \
  ORCH_SCHEDULER_ENABLED=false
fly deploy --dockerfile services/orchestrator/Dockerfile -a solva-orchestrator
```
Its public URL is `https://solva-orchestrator.fly.dev`.

## 7. Provision the two demo institutions

Each institution gets its own contract, owned by `signor`, with the current
circuit's VK. Deploy two and record them in the hosted database:

```bash
stellar contract build
A=$(stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm \
      --source signor --network testnet -- --owner signor \
      --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin | tail -1)
B=$(stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm \
      --source signor --network testnet -- --owner signor \
      --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin | tail -1)

psql "$PG" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO tenants (id, name, plan, contract_id, network) VALUES
  ('11111111-1111-1111-1111-111111111111','Meridian Bank','growth','$A','testnet'),
  ('22222222-2222-2222-2222-222222222222','Solstice Exchange','growth','$B','testnet');
WITH ins AS (
  INSERT INTO customers (tenant_id, external_ref, id_hash)
  SELECT t.id, c.ref, c.h FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid),
    ('22222222-2222-2222-2222-222222222222'::uuid)) AS t(id)
  CROSS JOIN (VALUES
    ('cust-001','0000000000000000000000000000000000000000000000000000000000000001'),
    ('cust-002','0000000000000000000000000000000000000000000000000000000000000002'),
    ('cust-003','0000000000000000000000000000000000000000000000000000000000000003')
  ) AS c(ref,h)
  RETURNING id, tenant_id, external_ref
)
INSERT INTO liabilities (tenant_id, customer_id, balance)
SELECT ins.tenant_id, ins.id, v.bal FROM ins JOIN (VALUES
  ('cust-001',4000000::numeric),('cust-002',3000000::numeric),('cust-003',2000000::numeric)
) AS v(ref,bal) ON ins.external_ref = v.ref;
SQL
```

## 8. Deploy the website (Vercel)

Import the repo, set the root to `apps/website`, and set environment variables:

```
ORCHESTRATOR_URL = https://solva-orchestrator.fly.dev
SANDBOX_URL      = https://solva-sandbox.fly.dev
NEXT_PUBLIC_STELLAR_EXPLORER = https://stellar.expert/explorer/testnet
```

Deploy, then open `https://<your-site>/sandbox`.

## Operating notes for judging

- Each "Prove & publish" is a **real** Testnet publish: ~10s and a fraction of an
  XLM. Keep `signor` funded with friendbot; there is plenty of headroom.
- The orchestrator holds a **per-tenant cycle lock**, so two judges hitting the
  same institution don't collide: the second sees "another cycle is running" and
  retries. They can also run the two institutions in parallel.
- The animated explainer on `/sandbox` needs no backend, so the page is still
  compelling even if a service is briefly down.
- Logs: `fly logs -a solva-orchestrator` (and `-a solva-prover`, `-a solva-sandbox`).
