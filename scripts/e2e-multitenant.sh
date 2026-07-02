#!/usr/bin/env bash
#
# Multi-tenant end-to-end test (epic #124's final sub-task: "Multi-tenant
# end-to-end test"). Builds on scripts/e2e.sh's single-tenant loop but proves
# the thing that loop cannot: two institutions, each with its own deployed
# proof-registry contract, never see each other's proofs -- at the database
# layer (tenant_id scoping) AND on-chain (each contract's own LatestId
# counter, read directly via the Soroban RPC, not just through the API).
#
# Institution A (Meridian Bank)      L = 9,000,000   contract A
# Institution B (Cedar Credit Union) L = 3,000,000   contract B
# Both read the same sandbox reserve scenario (R = 16,000,000), so both are
# solvent; the point of this test is isolation, not the solvency math, which
# scripts/e2e.sh already covers per tenant.
#
# Assertions:
#   1. GET /v1/tenants/{id}/contract resolves each tenant to its OWN contract.
#   2. A's latest proof is tenant A's, with A's liabilities total. Same for B.
#   3. Both proofs are chain_proof_id = 1 -- each landed on a FRESH counter,
#      which only holds if the contracts are genuinely separate instances and
#      not a shared registry keyed by tenant.
#   4. Reading each contract directly on-chain (stellar contract invoke, not
#      through the orchestrator) returns the matching, distinct liabilities
#      total -- the isolation is a ledger fact, not just a Postgres row.
#
# ---------------------------------------------------------------------------
# Prerequisites (your machine):
#   - docker, psql, curl, jq, and the stellar CLI on PATH
#   - the Rust prover built with its circuit artifacts (see services/prover)
#   - a funded Testnet identity that OWNS both contracts (publish is
#     owner-gated; both must share one owner until the passkey smart wallet
#     lands, #128). Export its secret seed:
#         export E2E_STELLAR_SIGNER_SECRET=S...
#   - a deployed proof-registry per institution. Pass existing ones via
#     E2E_CONTRACT_ID_A / E2E_CONTRACT_ID_B (set E2E_DEPLOY_OWNER if the
#     funded identity is not named "signor" in your stellar CLI config), or
#     leave them unset and the script deploys two fresh ones itself (needs
#     nargo + cargo on PATH in that case, same as `just provision-tenant`).
#
# Usage:   just e2e-multitenant   (or: bash scripts/e2e-multitenant.sh)
# Env:     E2E_DOWN=1                also tear down docker on exit
#          E2E_SERVICES_RUNNING=1    reuse already-running services
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"

ORCH_URL="${E2E_ORCH_URL:-http://localhost:8080}"
SANDBOX_URL="${E2E_SANDBOX_URL:-http://localhost:8090}"
PROVER_HOSTPORT="${E2E_PROVER_HOSTPORT:-localhost:50051}"

TENANT_A="${E2E_TENANT_ID_A:-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa}"
TENANT_B="${E2E_TENANT_ID_B:-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb}"

CONTRACT_A="${E2E_CONTRACT_ID_A:-}"
CONTRACT_B="${E2E_CONTRACT_ID_B:-}"
[ -n "$CONTRACT_A" ] || CONTRACT_A=$(cat contracts/proof-registry/.contract_id_a 2>/dev/null || true)
[ -n "$CONTRACT_B" ] || CONTRACT_B=$(cat contracts/proof-registry/.contract_id_b 2>/dev/null || true)
DEPLOY_OWNER="${E2E_DEPLOY_OWNER:-signor}"

STELLAR_NETWORK="${E2E_STELLAR_NETWORK:-testnet}"

: "${E2E_STELLAR_SIGNER_SECRET:?set it to the secret seed of the account owning both contracts (publish is owner-gated)}"

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

kill_tree() {
  local pid="$1" child
  for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null || true
}

PIDS=()
cleanup() {
  log "tearing down"
  for pid in "${PIDS[@]:-}"; do kill_tree "$pid"; done
  if [ "${E2E_DOWN:-0}" = "1" ]; then
    docker compose -f infra/docker-compose.yml down || true
  fi
}
trap cleanup EXIT

# ---- 0. prerequisites ---------------------------------------------------------
log "checking prerequisites"
for t in docker psql curl jq stellar; do need "$t"; done

# Each institution gets its own dedicated registry; one is deployed for any
# side not supplied, so a bare run still proves real isolation rather than
# requiring manual setup. Set E2E_CONTRACT_ID_A / _B to reuse fixed contracts
# across runs (faster, and lets CI pin known-good ids).
deploy_registry() {
  need nargo; need cargo
  stellar contract deploy \
    --wasm target/wasm32v1-none/release/proof_registry.wasm \
    --source "$DEPLOY_OWNER" --network "$STELLAR_NETWORK" -- \
    --owner "$DEPLOY_OWNER" \
    --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin | tail -1
}

if [ -z "$CONTRACT_A" ] || [ -z "$CONTRACT_B" ]; then
  log "building the proof-registry contract"
  stellar contract build >/dev/null 2>&1
fi
if [ -z "$CONTRACT_A" ]; then
  log "deploying institution A's registry (set E2E_CONTRACT_ID_A to reuse)"
  CONTRACT_A=$(deploy_registry); [ -n "$CONTRACT_A" ] || fail "could not deploy institution A's registry"
  ok "institution A registry $CONTRACT_A"
fi
if [ -z "$CONTRACT_B" ]; then
  log "deploying institution B's registry (set E2E_CONTRACT_ID_B to reuse)"
  CONTRACT_B=$(deploy_registry); [ -n "$CONTRACT_B" ] || fail "could not deploy institution B's registry"
  ok "institution B registry $CONTRACT_B"
fi
[ "$CONTRACT_A" != "$CONTRACT_B" ] || fail "institution A and B resolved to the SAME contract id ($CONTRACT_A) -- they must be separate deployments, the entire point of this test"
ok "two distinct contracts: A=$CONTRACT_A B=$CONTRACT_B"

if [ "${E2E_SERVICES_RUNNING:-0}" != "1" ]; then
  for port in 8080 8090 50051; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      fail "port $port is already in use (stale service from a previous run). Kill it, then re-run."
    fi
  done
  ok "service ports free"
fi

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

# ---- 3. services ---------------------------------------------------------------
if [ "${E2E_SERVICES_RUNNING:-0}" != "1" ]; then
  log "starting sandbox"
  ( cd services/sandbox && go run ./cmd/app ) >/tmp/solva-e2e-mt-sandbox.log 2>&1 &
  PIDS+=($!)
  wait_http "$SANDBOX_URL/health" "sandbox"

  log "syncing sandbox signing key into the orchestrator"
  SANDBOX_PUBKEY_PEM=$(curl -fsS "$SANDBOX_URL/.well-known/solva-signing-key.pem")
  [ -n "$SANDBOX_PUBKEY_PEM" ] || fail "could not fetch sandbox public key"
  ok "fetched sandbox public key"

  log "starting prover (first build is slow)"
  ( cargo run -p solva-prover ) >/tmp/solva-e2e-mt-prover.log 2>&1 &
  PIDS+=($!)
  wait_tcp "${PROVER_HOSTPORT%:*}" "${PROVER_HOSTPORT#*:}" "prover"

  log "starting orchestrator"
  (
    export ORCH_BANK_PUBLIC_KEY_PEM="$SANDBOX_PUBKEY_PEM"
    export ORCH_STELLAR_SIGNER_SECRET="$E2E_STELLAR_SIGNER_SECRET"
    export ORCH_SCHEDULER_ENABLED=false
    # No ORCH_ADMIN_TOKEN: the provisioning calls below run with admin auth
    # disabled, matching the dev-mode default. A real deployment sets one.
    cd services/orchestrator && go run ./cmd/app
  ) >/tmp/solva-e2e-mt-orch.log 2>&1 &
  PIDS+=($!)
  wait_http "$ORCH_URL/health" "orchestrator"
else
  ok "reusing already-running services (E2E_SERVICES_RUNNING=1)"
fi

# ---- 4. seed both tenants -------------------------------------------------------
# Customers and liabilities are seeded directly (the orchestrator has no API
# for those yet); the tenant row and its contract go through the new
# control-plane endpoints (the tenant row mirrors what POST /v1/tenants would
# create, and PUT /v1/tenants/{id}/contract records the deployment), so this
# test also exercises epic #124's "tenant provisioning and control plane"
# sub-task, not just the on-chain isolation.
seed_tenant() { # tenant_id name
  local tid="$1" name="$2"
  psql_solva -c "INSERT INTO tenants (id, name, plan) VALUES ('${tid}', '${name}', 'growth');" >/dev/null
}

link_contract() { # tenant_id contract_id
  local tid="$1" cid="$2"
  local code
  code=$(curl -s -o /tmp/solva-e2e-mt-link.json -w '%{http_code}' \
    -X PUT "$ORCH_URL/v1/tenants/${tid}/contract" \
    -H 'Content-Type: application/json' \
    -d "{\"contract_id\":\"${cid}\",\"network\":\"${STELLAR_NETWORK}\"}")
  [ "$code" = "200" ] || fail "linking contract for tenant ${tid} returned HTTP ${code}: $(cat /tmp/solva-e2e-mt-link.json)"
}

log "seeding institution A (Meridian Bank, L=9,000,000)"
seed_tenant "$TENANT_A" "Meridian Bank"
psql_solva >/dev/null <<SQL
WITH c AS (
  INSERT INTO customers (tenant_id, external_ref, id_hash) VALUES
    ('${TENANT_A}', 'cust-a1', '000000000000000000000000000000000000000000000000000000000000a1'),
    ('${TENANT_A}', 'cust-a2', '000000000000000000000000000000000000000000000000000000000000a2')
  RETURNING id, external_ref
)
INSERT INTO liabilities (tenant_id, customer_id, balance)
SELECT '${TENANT_A}', c.id, v.bal
FROM c JOIN (VALUES ('cust-a1', 6000000::numeric), ('cust-a2', 3000000::numeric)) AS v(ref, bal)
  ON c.external_ref = v.ref;
SQL
link_contract "$TENANT_A" "$CONTRACT_A"
ok "institution A seeded and linked to $CONTRACT_A"

log "seeding institution B (Cedar Credit Union, L=3,000,000)"
seed_tenant "$TENANT_B" "Cedar Credit Union"
psql_solva >/dev/null <<SQL
WITH c AS (
  INSERT INTO customers (tenant_id, external_ref, id_hash) VALUES
    ('${TENANT_B}', 'cust-b1', '000000000000000000000000000000000000000000000000000000000000b1')
  RETURNING id, external_ref
)
INSERT INTO liabilities (tenant_id, customer_id, balance)
SELECT '${TENANT_B}', c.id, v.bal
FROM c JOIN (VALUES ('cust-b1', 3000000::numeric)) AS v(ref, bal)
  ON c.external_ref = v.ref;
SQL
link_contract "$TENANT_B" "$CONTRACT_B"
ok "institution B seeded and linked to $CONTRACT_B"

# ---- 5. assertion 1: each tenant resolves to its OWN contract ------------------
log "assertion 1: institution -> contract resolution is isolated"
resolved_a=$(curl -fsS "$ORCH_URL/v1/tenants/${TENANT_A}/contract" | jq -r '.contract_id')
resolved_b=$(curl -fsS "$ORCH_URL/v1/tenants/${TENANT_B}/contract" | jq -r '.contract_id')
[ "$resolved_a" = "$CONTRACT_A" ] || fail "tenant A resolved to $resolved_a, want $CONTRACT_A"
[ "$resolved_b" = "$CONTRACT_B" ] || fail "tenant B resolved to $resolved_b, want $CONTRACT_B"
ok "A -> $resolved_a, B -> $resolved_b (distinct, as seeded)"

# ---- 6. run a cycle for each tenant ---------------------------------------------
seed_scenario() { curl -fsS -X POST "$SANDBOX_URL/admin/scenarios/$1" >/dev/null; }
seed_scenario solvent  # R = 16,000,000 for the shared sandbox; both tenants read it

run_cycle() { # tenant_id idempotency-key
  curl -s -o /tmp/solva-e2e-mt-cycle.json -w '%{http_code}' \
    --max-time 300 \
    -X POST "$ORCH_URL/v1/cycles" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: $2" \
    -d "{\"tenant_id\":\"${1}\"}"
}

log "running a cycle for institution A"
code=$(run_cycle "$TENANT_A" "e2e-mt-a-$(date +%s)")
case "$code" in
  2*) ok "institution A cycle accepted [HTTP $code]" ;;
  *)  fail "institution A cycle returned HTTP $code; see /tmp/solva-e2e-mt-orch.log" ;;
esac

log "running a cycle for institution B"
code=$(run_cycle "$TENANT_B" "e2e-mt-b-$(date +%s)")
case "$code" in
  2*) ok "institution B cycle accepted [HTTP $code]" ;;
  *)  fail "institution B cycle returned HTTP $code; see /tmp/solva-e2e-mt-orch.log" ;;
esac

# ---- 7. assertion 2: each tenant's latest proof is its own --------------------
log "assertion 2: latest-proof reads stay within each tenant"
proof_a=$(curl -fsS "$ORCH_URL/v1/proofs/latest?tenant_id=${TENANT_A}")
proof_b=$(curl -fsS "$ORCH_URL/v1/proofs/latest?tenant_id=${TENANT_B}")

l_a=$(printf '%s' "$proof_a" | jq -r '.liabilities_total')
l_b=$(printf '%s' "$proof_b" | jq -r '.liabilities_total')
[ "$l_a" = "9000000" ] || fail "institution A latest proof has L=$l_a, want 9000000"
[ "$l_b" = "3000000" ] || fail "institution B latest proof has L=$l_b, want 3000000"
ok "A.L=$l_a B.L=$l_b -- no cross-tenant bleed in the orchestrator's proof reads"

# ---- 8. assertion 3: independent on-chain counters -----------------------------
log "assertion 3: each contract's chain_proof_id starts fresh at 1"
chain_id_a=$(printf '%s' "$proof_a" | jq -r '.chain_proof_id')
chain_id_b=$(printf '%s' "$proof_b" | jq -r '.chain_proof_id')
[ "$chain_id_a" = "1" ] || fail "institution A chain_proof_id=$chain_id_a, want 1 (fresh contract)"
[ "$chain_id_b" = "1" ] || fail "institution B chain_proof_id=$chain_id_b, want 1 (fresh contract)"
ok "both landed as proof #1 on their OWN contract -- not a shared counter"

# ---- 9. assertion 4: a direct on-chain read confirms isolation ----------------
# Bypass the orchestrator entirely: ask each contract directly which L it
# holds. If isolation were faked at the API layer this would catch it.
log "assertion 4: reading both contracts directly on $STELLAR_NETWORK"
stellar keys add e2e-mt-reader --secret-key <<<"$E2E_STELLAR_SIGNER_SECRET" >/dev/null 2>&1 || true
READER=$(stellar keys address e2e-mt-reader)

onchain_l() { # contract_id
  stellar contract invoke \
    --id "$1" \
    --source-account "$READER" \
    --network "$STELLAR_NETWORK" \
    --send=no \
    -- get_latest_proof 2>/dev/null | jq -r '.l // empty'
}
onchain_l_a=$(onchain_l "$CONTRACT_A")
onchain_l_b=$(onchain_l "$CONTRACT_B")
[ "$onchain_l_a" = "9000000" ] || fail "on-chain read of contract A has l=$onchain_l_a, want 9000000"
[ "$onchain_l_b" = "3000000" ] || fail "on-chain read of contract B has l=$onchain_l_b, want 3000000"
ok "on-chain: contract A holds L=$onchain_l_a, contract B holds L=$onchain_l_b -- isolation is a ledger fact"

log "MULTI-TENANT E2E PASSED: two institutions, two contracts, zero cross-tenant leakage"
