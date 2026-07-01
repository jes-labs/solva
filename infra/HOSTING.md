# Hosting the Solva demo on free tiers

This deploys the full Solva stack so judges can open a URL and run the `/sandbox`
playground live: connect a mock bank, prove reserves cover liabilities, publish a
proof to Stellar Testnet, and verify it. Nothing here is local-only, and nothing
here costs money.

## What runs where

| Component | Host | Why it is free |
|---|---|---|
| Postgres | **Neon** | free plan: 0.5 GB, 100 CU-hours/month, no card |
| Redis | **Upstash** | free plan: 256 MB, 500k commands/month |
| Prover (Rust + bb) | **Google Cloud Run** | always-free tier, scales to zero, amd64, gRPC |
| Orchestrator (Go) | **Google Cloud Run** | same always-free tier |
| Sandbox (Go) | **Google Cloud Run** | same always-free tier |
| Website / docs / web (Next) | **Vercel** | your existing free projects |

Why Cloud Run and not Fly.io or AWS: Fly.io removed its free tier for new orgs in
2024 (pay-as-you-go only now). AWS's revamped free tier is time-boxed credits
(about $100-200 for 6 months, then it expires), and its only always-free VM is
1 GB, too small for the prover. Cloud Run has a genuine always-free monthly
allowance, scales to zero so an idle demo costs nothing, runs amd64 images, and
supports gRPC. That combination is the only free home for the amd64,
memory-hungry, on-demand prover. Oracle Cloud's always-free box is generous but
ARM, and the prover's `bb` has no ARM Linux build, so it cannot run there.

## How it fits together

The website's `/sandbox` API routes run server-side, so the browser only talks to
the website (no CORS). The website reaches the orchestrator and sandbox over their
public Cloud Run HTTPS URLs. The orchestrator reaches the prover over gRPC on the
prover's Cloud Run URL (HTTP/2, TLS on port 443).

A note on "free": Neon, Upstash, and Vercel need no card. Google Cloud requires a
billing account (a card) to use Cloud Run as of 2026, but you are not charged
while you stay inside the always-free allowance, and a scale-to-zero demo does.
New Google Cloud accounts also get a $300 / 90-day trial credit as a buffer. Set
a $1 budget alert (below) so there are no surprises.

## Prerequisites

- Accounts: Google Cloud (`gcloud`), Neon, Upstash, Vercel.
- The `stellar` CLI with a funded Testnet identity that will **own** the demo
  contracts (this guide uses `signor`). Top it up any time:
  `curl "https://friendbot.stellar.org/?addr=$(stellar keys address signor)"`.
- `openssl` and `psql` locally for the one-time key and seed steps.

## 0. Google Cloud project and Artifact Registry

Use a free-tier region (`us-central1`, `us-east1`, or `us-west1`). This guide
uses `us-central1`.

```bash
export PROJECT="solva-demo"            # your project id
export REGION="us-central1"
export REPO="$REGION-docker.pkg.dev/$PROJECT/solva"

gcloud projects create "$PROJECT"      # or use an existing one
gcloud config set project "$PROJECT"
gcloud config set run/region "$REGION"

# Link billing (required for Cloud Run), then guard it with a tiny budget alert.
gcloud billing projects link "$PROJECT" --billing-account "$(gcloud billing accounts list --format='value(name)' | head -1)"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud artifacts repositories create solva \
  --repository-format=docker --location="$REGION"
```

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

## 4. Build the three images (on Google's amd64 builders)

The prover image is amd64-only, so it must build on an amd64 host. Cloud Build is
amd64, so building there works from any machine, including Apple Silicon. The
reusable `infra/cloudbuild.yaml` builds one image from a given Dockerfile with the
repo root as context. Run all three from the repo root:

```bash
gcloud builds submit --config infra/cloudbuild.yaml \
  --substitutions=_DOCKERFILE=services/prover/Dockerfile,_IMAGE=$REPO/prover .

gcloud builds submit --config infra/cloudbuild.yaml \
  --substitutions=_DOCKERFILE=services/sandbox/Dockerfile,_IMAGE=$REPO/sandbox .

gcloud builds submit --config infra/cloudbuild.yaml \
  --substitutions=_DOCKERFILE=services/orchestrator/Dockerfile,_IMAGE=$REPO/orchestrator .
```

## 5. Deploy the prover

The container reads `PORT` (Cloud Run injects it) and serves gRPC over HTTP/2.
`--concurrency 1` keeps one proof per instance so `bb`'s memory is predictable;
`--min-instances 0` keeps it free when idle (first call after idle cold-starts in
a few seconds since the CRS is baked into the image).

```bash
gcloud run deploy solva-prover \
  --image "$REPO/prover" --region "$REGION" \
  --use-http2 --port 8080 \
  --memory 2Gi --cpu 1 --concurrency 1 --timeout 300 \
  --min-instances 0 --max-instances 1 \
  --allow-unauthenticated

# The gRPC dial target for the orchestrator is the host without scheme, on :443.
export PROVER_HOST="$(gcloud run services describe solva-prover --region "$REGION" --format='value(status.url)' | sed 's#https://##')"
echo "prover gRPC target: $PROVER_HOST:443"
```

`--allow-unauthenticated` keeps the deploy simple for a hackathon: the URL is
unguessable, the only RPC needs a well-formed witness, and it is testnet. To
harden it later, deploy with `--no-allow-unauthenticated` and have the
orchestrator attach an ID token (audience = the prover URL) on each call.

## 6. Deploy the sandbox

```bash
cat > sandbox.env.yaml <<YAML
SANDBOX_HTTP_ADDR: ":8080"
SANDBOX_SIGNING_KEY_PEM: |
$(sed 's/^/  /' bank.pkcs8.pem)
YAML

gcloud run deploy solva-sandbox \
  --image "$REPO/sandbox" --region "$REGION" \
  --port 8080 --memory 512Mi \
  --env-vars-file sandbox.env.yaml \
  --allow-unauthenticated

export SANDBOX_URL="$(gcloud run services describe solva-sandbox --region "$REGION" --format='value(status.url)')"
```

## 7. Deploy the orchestrator

`ORCH_PROVER_TLS=true` dials the prover over TLS (Cloud Run terminates TLS at
:443); `ORCH_PROVER_ADDR` is the host:port from step 5.

```bash
cat > orchestrator.env.yaml <<YAML
ORCH_HTTP_ADDR: ":8080"
ORCH_POSTGRES_URL: "$PG"
ORCH_REDIS_URL: "rediss://…"
ORCH_PROVER_ADDR: "$PROVER_HOST:443"
ORCH_PROVER_TLS: "true"
ORCH_BANK_BASE_URL: "$SANDBOX_URL"
ORCH_STELLAR_SIGNER_SECRET: "$(stellar keys show signor)"
ORCH_STELLAR_RPC_URL: "https://soroban-testnet.stellar.org"
ORCH_STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015"
ORCH_SCHEDULER_ENABLED: "false"
ORCH_BANK_PUBLIC_KEY_PEM: |
$(sed 's/^/  /' bank.pub.pem)
YAML

gcloud run deploy solva-orchestrator \
  --image "$REPO/orchestrator" --region "$REGION" \
  --port 8080 --memory 512Mi \
  --env-vars-file orchestrator.env.yaml \
  --allow-unauthenticated

export ORCHESTRATOR_URL="$(gcloud run services describe solva-orchestrator --region "$REGION" --format='value(status.url)')"
```

## 8. Provision the two demo institutions

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

## 9. Deploy the website (Vercel)

Import the repo, set the root to `apps/website`, and set environment variables to
the Cloud Run URLs printed above:

```
ORCHESTRATOR_URL = <value of $ORCHESTRATOR_URL>
SANDBOX_URL      = <value of $SANDBOX_URL>
NEXT_PUBLIC_STELLAR_EXPLORER = https://stellar.expert/explorer/testnet
```

Deploy, then open `https://<your-site>/sandbox`.

## Operating notes for judging

- Each "Prove & publish" is a **real** Testnet publish: about 10s and a fraction
  of an XLM. Keep `signor` funded with friendbot; there is plenty of headroom.
- The orchestrator holds a **per-tenant cycle lock**, so two judges hitting the
  same institution do not collide: the second sees "another cycle is running" and
  retries. They can also run the two institutions in parallel.
- The animated explainer on `/sandbox` needs no backend, so the page is still
  compelling even if a service is briefly cold-starting.
- Free-tier math: Cloud Run's always-free tier is per billing account and resets
  monthly. A scale-to-zero demo that proves occasionally stays well inside it.
- Logs: `gcloud run services logs read solva-orchestrator --region "$REGION"`
  (and `solva-prover`, `solva-sandbox`).
