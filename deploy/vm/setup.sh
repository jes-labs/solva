#!/usr/bin/env bash
#
# One-shot Solva demo deploy for a single Ubuntu VM (AWS Lightsail / EC2).
# Runs Postgres, Redis, the prover, the orchestrator, and the sandbox in Docker.
# The website (Vercel) points at this box.
#
# Run from the repo root after cloning:
#   export SIGNER_SECRET=S...      # signor's Testnet secret (owns the registries)
#   export CONTRACT_A=C...         # Meridian registry (owned by signor)
#   export CONTRACT_B=C...         # Solstice registry (owned by signor)
#   bash deploy/vm/setup.sh
#
set -euo pipefail

: "${SIGNER_SECRET:?set SIGNER_SECRET to signor's Testnet secret seed}"
: "${CONTRACT_A:?set CONTRACT_A to Meridian's registry contract id}"
: "${CONTRACT_B:?set CONTRACT_B to Solstice's registry contract id}"

ROOT=$(pwd)
VMDIR="$ROOT/deploy/vm"
COMPOSE="$VMDIR/compose.yml"
DC="sudo docker compose -f $COMPOSE"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()  { printf '\033[1;32m    ok: %s\033[0m\n' "$*"; }

log "adding swap (Rust build needs headroom on a 4 GB box)"
if ! sudo swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
fi
ok "swap ready"

log "installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
ok "docker present"

log "generating the bank signing key and API tokens"
openssl ecparam -genkey -name prime256v1 -noout -out "$VMDIR/bank.key" 2>/dev/null
openssl pkcs8 -topk8 -nocrypt -in "$VMDIR/bank.key" -out "$VMDIR/bank.pkcs8.pem" 2>/dev/null
openssl ec -in "$VMDIR/bank.key" -pubout -out "$VMDIR/bank.pub.pem" 2>/dev/null
ORCH_API_TOKEN=$(openssl rand -hex 32)
PROVER_API_TOKEN=$(openssl rand -hex 32)
echo "$ORCH_API_TOKEN" > "$VMDIR/orch_api_token.txt"
ok "keys and tokens generated"

log "writing the compose file"
cat > "$COMPOSE" <<YAML
name: solva
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: solva
      POSTGRES_PASSWORD: solva
      POSTGRES_DB: solva
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U solva"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  prover:
    build:
      context: ../..
      dockerfile: services/prover/Dockerfile
    environment:
      PORT: "50051"
      PROVER_API_TOKEN: "$PROVER_API_TOKEN"
    restart: unless-stopped

  sandbox:
    build:
      context: ../..
      dockerfile: services/sandbox/Dockerfile
    environment:
      SANDBOX_HTTP_ADDR: ":8090"
      SANDBOX_SIGNING_KEY_PEM: |
$(sed 's/^/        /' "$VMDIR/bank.pkcs8.pem")
    ports:
      - "8090:8090"
    restart: unless-stopped

  orchestrator:
    build:
      context: ../..
      dockerfile: services/orchestrator/Dockerfile
    environment:
      ORCH_HTTP_ADDR: ":8080"
      ORCH_API_TOKEN: "$ORCH_API_TOKEN"
      ORCH_POSTGRES_URL: "postgres://solva:solva@postgres:5432/solva?sslmode=disable"
      ORCH_REDIS_URL: "redis://redis:6379/0"
      ORCH_PROVER_ADDR: "prover:50051"
      ORCH_PROVER_TLS: "false"
      ORCH_PROVER_TOKEN: "$PROVER_API_TOKEN"
      ORCH_BANK_BASE_URL: "http://sandbox:8090"
      ORCH_STELLAR_SIGNER_SECRET: "$SIGNER_SECRET"
      ORCH_STELLAR_RPC_URL: "https://soroban-testnet.stellar.org"
      ORCH_STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015"
      ORCH_SCHEDULER_ENABLED: "false"
      ORCH_BANK_PUBLIC_KEY_PEM: |
$(sed 's/^/        /' "$VMDIR/bank.pub.pem")
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      prover:
        condition: service_started
      sandbox:
        condition: service_started
    restart: unless-stopped

volumes:
  pgdata:
YAML
ok "compose written"

log "starting Postgres and Redis"
$DC up -d postgres redis

log "waiting for Postgres"
until $DC exec -T postgres pg_isready -U solva >/dev/null 2>&1; do sleep 2; done
ok "postgres ready"

log "applying migrations"
for f in $(ls "$ROOT"/services/orchestrator/migrations/*.sql | grep -v '\.down\.sql$' | sort); do
  $DC exec -T postgres psql -U solva -d solva -v ON_ERROR_STOP=1 < "$f" >/dev/null
done
ok "schema applied"

log "seeding the two demo institutions"
$DC exec -T postgres psql -U solva -d solva -v ON_ERROR_STOP=1 >/dev/null <<SQL
INSERT INTO tenants (id, name, plan, contract_id, network) VALUES
  ('11111111-1111-1111-1111-111111111111','Meridian Bank','growth','$CONTRACT_A','testnet'),
  ('22222222-2222-2222-2222-222222222222','Solstice Exchange','growth','$CONTRACT_B','testnet');
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
ok "seeded Meridian and Solstice"

log "building and starting the services (first prover build is slow)"
$DC up -d --build prover sandbox orchestrator
ok "services up"

IP=$(curl -fsS https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]')
log "done"
cat <<DONE

  Backend is live on this box.

  Set these in Vercel (Project Settings > Environment Variables) for apps/website:
    ORCHESTRATOR_URL              = http://$IP:8080
    SANDBOX_URL                   = http://$IP:8090
    ORCH_API_TOKEN                = $ORCH_API_TOKEN
    NEXT_PUBLIC_STELLAR_EXPLORER  = https://stellar.expert/explorer/testnet

  Check it locally on the box:
    curl -s http://localhost:8080/health
    sudo docker compose -f deploy/vm/compose.yml ps

DONE
