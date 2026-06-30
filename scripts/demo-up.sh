#!/usr/bin/env bash
#
# Bring up the Solva demo stack for the /sandbox playground and keep it running.
#
# Unlike scripts/e2e.sh (which runs the scenarios once and tears down), this
# seeds two demo institutions, starts sandbox + prover + orchestrator, and then
# blocks so the website can drive them. Ctrl-C tears the services back down.
#
# Prerequisites (your machine):
#   - docker, psql, curl, jq, and the stellar CLI on PATH
#   - the pinned nargo + bb on PATH (the prover shells out to them)
#   - a funded Testnet identity that OWNS the demo contracts (publish is
#     owner-gated). Export its secret seed:
#         export ORCH_STELLAR_SIGNER_SECRET=S...
#
# Each institution publishes to its own proof-registry contract. Provide them:
#   export DEMO_CONTRACT_A=C...   # Meridian Bank   (defaults to the shared demo)
#   export DEMO_CONTRACT_B=C...   # Solstice Exchange
# Both must be owned by ORCH_STELLAR_SIGNER_SECRET. Deploy one with
# `just provision-tenant <tenant-id>` if you do not have a second yet.
#
# Usage:  just demo   (or: bash scripts/demo-up.sh)
# -------------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"
export PATH="$HOME/.bb:$HOME/.nargo/bin:$PATH"

SANDBOX_URL="http://localhost:8090"
ORCH_URL="http://localhost:8080"
TENANT_A="11111111-1111-1111-1111-111111111111" # Meridian Bank
TENANT_B="22222222-2222-2222-2222-222222222222" # Solstice Exchange
CONTRACT_A="${DEMO_CONTRACT_A:-}"
CONTRACT_B="${DEMO_CONTRACT_B:-}"
DEPLOY_OWNER="${DEMO_DEPLOY_OWNER:-signor}"

: "${ORCH_STELLAR_SIGNER_SECRET:?set it to the contract owner Testnet secret seed (publish is owner-gated)}"

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ok: %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m    FAIL: %s\033[0m\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || fail "missing required tool: $1"; }
psql_solva() { PGPASSWORD=solva psql -h localhost -U solva -d solva -v ON_ERROR_STOP=1 -qtA "$@"; }

wait_http() {
  local url="$1" name="$2" i
  for i in $(seq 1 60); do
    curl -fsS "$url" >/dev/null 2>&1 && { ok "$name ready"; return 0; }
    sleep 1
  done
  fail "$name not ready at $url"
}

wait_tcp() {
  local host="$1" port="$2" name="$3" i
  for i in $(seq 1 120); do
    (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null && { exec 3>&- 3<&-; ok "$name listening"; return 0; }
    sleep 1
  done
  fail "$name not listening on $host:$port"
}

# kill_tree kills a pid and its descendants. go run / cargo run exec a child that
# holds the port; killing only the parent leaves it running.
kill_tree() {
  local pid="$1" child
  for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null || true
}

PIDS=()
cleanup() {
  log "stopping services"
  for pid in "${PIDS[@]:-}"; do kill_tree "$pid"; done
}
trap cleanup EXIT

# ---- prerequisites ------------------------------------------------------------
log "checking prerequisites"
for t in docker psql curl jq stellar nargo bb cargo go; do need "$t"; done
for port in 8080 8090 50051; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "port $port is in use (stale service?). Kill it, then re-run."
  fi
done
ok "tools present and ports free"

# Each institution gets its own dedicated registry. A fresh one is deployed for
# any that is not supplied, so the two are genuinely distinct and clean. Set
# DEMO_CONTRACT_A / DEMO_CONTRACT_B to reuse them across runs.
deploy_registry() {
  stellar contract deploy \
    --wasm target/wasm32v1-none/release/proof_registry.wasm \
    --source "$DEPLOY_OWNER" --network testnet -- \
    --owner "$DEPLOY_OWNER" \
    --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin | tail -1
}

if [ -z "$CONTRACT_A" ] || [ -z "$CONTRACT_B" ]; then
  log "building the proof-registry contract"
  stellar contract build >/dev/null 2>&1
fi
if [ -z "$CONTRACT_A" ]; then
  log "deploying Meridian Bank's registry (set DEMO_CONTRACT_A to reuse)"
  CONTRACT_A=$(deploy_registry); [ -n "$CONTRACT_A" ] || fail "could not deploy Meridian's registry"
  ok "Meridian registry $CONTRACT_A"
fi
if [ -z "$CONTRACT_B" ]; then
  log "deploying Solstice Exchange's registry (set DEMO_CONTRACT_B to reuse)"
  CONTRACT_B=$(deploy_registry); [ -n "$CONTRACT_B" ] || fail "could not deploy Solstice's registry"
  ok "Solstice registry $CONTRACT_B"
fi
[ "$CONTRACT_A" != "$CONTRACT_B" ] || fail "the two institutions must have distinct contracts"

# ---- infrastructure -----------------------------------------------------------
log "starting Postgres + Redis"
docker compose -f infra/docker-compose.yml up -d postgres redis
for i in $(seq 1 30); do
  docker exec solva-postgres pg_isready -U solva >/dev/null 2>&1 && break
  sleep 1
done
ok "postgres ready"

log "resetting schema + applying migrations"
psql_solva -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null
for f in $(ls services/orchestrator/migrations/*.sql | grep -v '\.down\.sql$' | sort); do
  psql_solva -f "$f" >/dev/null
done
ok "schema applied"

# ---- seed two institutions ----------------------------------------------------
# seed_tenant ID NAME CONTRACT: a tenant on its own contract, three customers,
# and 9,000,000 in liabilities (4M + 3M + 2M).
seed_tenant() {
  local id="$1" name="$2" contract="$3"
  psql_solva >/dev/null <<SQL
INSERT INTO tenants (id, name, plan, contract_id, network)
VALUES ('${id}', '${name}', 'growth', '${contract}', 'testnet');
WITH c AS (
  INSERT INTO customers (tenant_id, external_ref, id_hash) VALUES
    ('${id}', 'cust-001', '0000000000000000000000000000000000000000000000000000000000000001'),
    ('${id}', 'cust-002', '0000000000000000000000000000000000000000000000000000000000000002'),
    ('${id}', 'cust-003', '0000000000000000000000000000000000000000000000000000000000000003')
  RETURNING id, external_ref
)
INSERT INTO liabilities (tenant_id, customer_id, balance)
SELECT '${id}', c.id, v.bal
FROM c JOIN (VALUES
  ('cust-001', 4000000::numeric),
  ('cust-002', 3000000::numeric),
  ('cust-003', 2000000::numeric)
) AS v(ref, bal) ON c.external_ref = v.ref;
SQL
  ok "seeded ${name} -> ${contract}"
}

log "seeding demo institutions"
seed_tenant "$TENANT_A" "Meridian Bank" "$CONTRACT_A"
seed_tenant "$TENANT_B" "Solstice Exchange" "$CONTRACT_B"

# ---- services -----------------------------------------------------------------
log "starting sandbox"
( cd services/sandbox && go run ./cmd/app ) >/tmp/solva-demo-sandbox.log 2>&1 &
PIDS+=($!)
wait_http "$SANDBOX_URL/health" "sandbox"

log "syncing sandbox signing key into the orchestrator"
SANDBOX_PUBKEY_PEM=$(curl -fsS "$SANDBOX_URL/.well-known/solva-signing-key.pem")
[ -n "$SANDBOX_PUBKEY_PEM" ] || fail "could not fetch sandbox public key"
ok "fetched sandbox public key"

log "starting prover (first build is slow)"
( cargo run -p solva-prover ) >/tmp/solva-demo-prover.log 2>&1 &
PIDS+=($!)
wait_tcp "localhost" "50051" "prover"

log "starting orchestrator"
(
  export ORCH_BANK_PUBLIC_KEY_PEM="$SANDBOX_PUBKEY_PEM"
  export ORCH_STELLAR_SIGNER_SECRET="$ORCH_STELLAR_SIGNER_SECRET"
  export ORCH_SCHEDULER_ENABLED=false
  cd services/orchestrator && go run ./cmd/app
) >/tmp/solva-demo-orch.log 2>&1 &
PIDS+=($!)
wait_http "$ORCH_URL/health" "orchestrator"

log "demo stack is up"
cat <<'NOTE'
    Now start the website against this stack, in another terminal:

      ORCHESTRATOR_URL=http://localhost:8080 \
      SANDBOX_URL=http://localhost:8090 \
        pnpm --filter @solva/website dev

    Then open http://localhost:3000/sandbox

    Logs: /tmp/solva-demo-{sandbox,prover,orch}.log
    Press Ctrl-C here to stop the services.
NOTE

wait
