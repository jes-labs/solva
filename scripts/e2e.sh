#!/usr/bin/env bash
#
# End-to-end test (#32): sandbox -> orchestrator -> prover -> contract on Testnet.
#
# Proves the full Solva loop across the three demo scenarios. Liabilities are
# seeded once at L = 9,000,000; each scenario only changes the sandbox reserves:
#
#   scenario     reserves (R)   vs L=9,000,000   expected
#   solvent      16,000,000     R > L            proof generated + published
#   near-breach   9,500,000     R > L (thin)     proof generated + published
#   insolvent     4,500,000     R < L            cycle FAILS to prove (expected)
#
# Phase A covers proof generation + Testnet publication. The inclusion check
# (verify_inclusion) lands in Phase B once the serialized tree is exposed.
#
# ---------------------------------------------------------------------------
# Prerequisites (your machine):
#   - docker, psql, curl, jq, and the stellar CLI on PATH
#   - the Rust prover built with its circuit artifacts (see services/prover);
#     this script starts it, but the first build is slow
#   - a funded Testnet identity that OWNS the deployed contract (publish is
#     owner-gated). Export its secret seed:
#         export E2E_STELLAR_SIGNER_SECRET=S...
#
# Usage:   just e2e            (or: bash scripts/e2e.sh)
# Env:     E2E_DOWN=1          also tear down docker on exit
#          E2E_SERVICES_RUNNING=1   reuse already-running services, don't start them
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"

ORCH_URL="${E2E_ORCH_URL:-http://localhost:8080}"
SANDBOX_URL="${E2E_SANDBOX_URL:-http://localhost:8090}"
PROVER_HOSTPORT="${E2E_PROVER_HOSTPORT:-localhost:50051}"
TENANT_ID="${E2E_TENANT_ID:-11111111-1111-1111-1111-111111111111}"
CONTRACT_ID="${E2E_CONTRACT_ID:-}"
[ -n "$CONTRACT_ID" ] || CONTRACT_ID=$(cat contracts/proof-registry/.contract_id)

: "${E2E_STELLAR_SIGNER_SECRET:?set it to the contract owner Testnet secret seed (publish is owner-gated)}"

# ---- output helpers -----------------------------------------------------------
log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ok: %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m    FAIL: %s\033[0m\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || fail "missing required tool: $1"; }

psql_solva() { PGPASSWORD=solva psql -h localhost -U solva -d solva -v ON_ERROR_STOP=1 -qtA "$@"; }

wait_http() { # url name
  local url="$1" name="$2" i
  for i in $(seq 1 60); do
    curl -fsS "$url" >/dev/null 2>&1 && { ok "$name ready"; return 0; }
    sleep 1
  done
  fail "$name not ready at $url"
}

wait_tcp() { # host port name
  local host="$1" port="$2" name="$3" i
  for i in $(seq 1 120); do
    (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null && { exec 3>&- 3<&-; ok "$name listening"; return 0; }
    sleep 1
  done
  fail "$name not listening on $host:$port"
}

PIDS=()
cleanup() {
  log "tearing down"
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  if [ "${E2E_DOWN:-0}" = "1" ]; then
    docker compose -f infra/docker-compose.yml down || true
  fi
}
trap cleanup EXIT

# ---- 0. prerequisites ---------------------------------------------------------
log "checking prerequisites"
for t in docker psql curl jq stellar; do need "$t"; done
ok "all tools present"

# ---- 1. infrastructure --------------------------------------------------------
log "starting Postgres + Redis"
docker compose -f infra/docker-compose.yml up -d postgres redis
for i in $(seq 1 30); do
  docker exec solva-postgres pg_isready -U solva >/dev/null 2>&1 && break
  sleep 1
done
ok "postgres ready"

# ---- 2. migrations (clean slate so the run is repeatable) ---------------------
log "resetting + applying schema"
psql_solva -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null
for f in $(ls services/orchestrator/migrations/*.sql | grep -v '\.down\.sql$' | sort); do
  psql_solva -f "$f" >/dev/null
done
ok "schema applied (clean slate)"

# ---- 3. seed tenant + liabilities (L = 9,000,000) -----------------------------
log "seeding tenant + liabilities"
psql_solva >/dev/null <<SQL
TRUNCATE tenants CASCADE;
INSERT INTO tenants (id, name, plan) VALUES ('${TENANT_ID}', 'Meridian Bank', 'growth');
WITH c AS (
  INSERT INTO customers (tenant_id, external_ref, id_hash) VALUES
    ('${TENANT_ID}', 'cust-001', '0000000000000000000000000000000000000000000000000000000000000001'),
    ('${TENANT_ID}', 'cust-002', '0000000000000000000000000000000000000000000000000000000000000002'),
    ('${TENANT_ID}', 'cust-003', '0000000000000000000000000000000000000000000000000000000000000003')
  RETURNING id, external_ref
)
INSERT INTO liabilities (tenant_id, customer_id, balance)
SELECT '${TENANT_ID}', c.id, v.bal
FROM c JOIN (VALUES
  ('cust-001', 4000000::numeric),
  ('cust-002', 3000000::numeric),
  ('cust-003', 2000000::numeric)
) AS v(ref, bal) ON c.external_ref = v.ref;

-- Prior proof so the fraud bound (10*R <= 11*R_prev) has a non-zero baseline.
-- Without it the first cycle's R_prev is 0 and any positive R is rejected.
-- R_prev = 15,000,000 admits solvent (16M) and near-breach (9.5M); insolvent
-- (4.5M) still fails on R < L, not on the fraud bound.
INSERT INTO proofs (tenant_id, chain_proof_id, root_h, r, l, proof_blob)
VALUES ('${TENANT_ID}', 0, 'genesis-baseline', 15000000, 9000000, decode('00','hex'));
SQL
seeded_l=$(psql_solva -c "SELECT COALESCE(SUM(balance),0) FROM liabilities WHERE tenant_id='${TENANT_ID}';")
[ "$seeded_l" = "9000000" ] || fail "seeded liabilities = $seeded_l, want 9000000"
ok "liabilities total = $seeded_l"

# ---- 4. services --------------------------------------------------------------
if [ "${E2E_SERVICES_RUNNING:-0}" != "1" ]; then
  log "starting sandbox"
  ( cd services/sandbox && go run ./cmd/app ) >/tmp/solva-e2e-sandbox.log 2>&1 &
  PIDS+=($!)
  wait_http "$SANDBOX_URL/health" "sandbox"

  # Sync the sandbox's signing key into the orchestrator so signature
  # verification matches. The sandbox mints an ephemeral key at boot.
  log "syncing sandbox signing key into the orchestrator"
  SANDBOX_PUBKEY_PEM=$(curl -fsS "$SANDBOX_URL/.well-known/solva-signing-key.pem")
  [ -n "$SANDBOX_PUBKEY_PEM" ] || fail "could not fetch sandbox public key"
  ok "fetched sandbox public key"

  log "starting prover (first build is slow)"
  ( cargo run -p solva-prover ) >/tmp/solva-e2e-prover.log 2>&1 &
  PIDS+=($!)
  wait_tcp "${PROVER_HOSTPORT%:*}" "${PROVER_HOSTPORT#*:}" "prover"

  log "starting orchestrator"
  (
    export ORCH_BANK_PUBLIC_KEY_PEM="$SANDBOX_PUBKEY_PEM"
    export ORCH_STELLAR_SIGNER_SECRET="$E2E_STELLAR_SIGNER_SECRET"
    export ORCH_STELLAR_CONTRACT_ID="$CONTRACT_ID"
    export ORCH_SCHEDULER_ENABLED=false
    cd services/orchestrator && go run ./cmd/app
  ) >/tmp/solva-e2e-orch.log 2>&1 &
  PIDS+=($!)
  wait_http "$ORCH_URL/health" "orchestrator"
else
  ok "reusing already-running services (E2E_SERVICES_RUNNING=1)"
fi

# ---- 5. scenario runner -------------------------------------------------------
# seed_scenario NAME: point the sandbox at a named scenario.
seed_scenario() { curl -fsS -X POST "$SANDBOX_URL/admin/scenarios/$1" >/dev/null; }

# run_cycle: trigger one cycle, return the HTTP status code.
run_cycle() { # idempotency-key
  curl -s -o /tmp/solva-e2e-cycle.json -w '%{http_code}' \
    --max-time 300 \
    -X POST "$ORCH_URL/v1/cycles" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: $1" \
    -d "{\"tenant_id\":\"${TENANT_ID}\"}"
}

assert_solvent() { # scenario-name
  local name="$1"
  log "scenario: $name -- expect a published proof"
  seed_scenario "$name"

  local key code
  key="e2e-${name}-$(date +%s)"
  code=$(run_cycle "$key")
  case "$code" in
    2*) ok "$name cycle accepted [HTTP $code]" ;;
    *)  fail "$name cycle returned HTTP $code, want 2xx; see /tmp/solva-e2e-orch.log" ;;
  esac

  local proof r l
  proof=$(curl -fsS "$ORCH_URL/v1/proofs/latest?tenant_id=${TENANT_ID}")
  r=$(printf '%s' "$proof" | jq -r '.reservesTotal // .r // .R')
  l=$(printf '%s' "$proof" | jq -r '.liabilitiesTotal // .l // .L')
  [ -n "$r" ] && [ "$r" != "null" ] || fail "no proof persisted for $name"
  ok "$name proof: R=$r L=$l, published + verified on Testnet"
}

assert_insolvent() { # scenario-name
  local name="$1"
  log "scenario: $name -- expect the cycle to FAIL to prove"
  seed_scenario "$name"

  local key code
  key="e2e-${name}-$(date +%s)"
  code=$(run_cycle "$key")
  case "$code" in
    2*) fail "$name cycle returned HTTP $code, want a failure: R below L must not prove" ;;
    *)  ok "$name cycle correctly rejected [HTTP $code]" ;;
  esac
}

# ---- 6. run the scenarios -----------------------------------------------------
assert_solvent solvent
assert_solvent near-breach
assert_insolvent insolvent

log "E2E PASSED: solvent + near-breach published; insolvent rejected"
