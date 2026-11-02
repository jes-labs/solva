#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.cargo/bin:$HOME/.nargo/bin:$HOME/.bb:$HOME/go/bin:/usr/local/go/bin:$PATH"

MODE="${1:-full}"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SKIPPED=()

step() {
  echo -e "\n${BLUE}[$1] $2${NC}"
}

has() {
  command -v "$1" >/dev/null 2>&1
}

skip() {
  echo -e "${YELLOW}skipped: $1${NC}"
  SKIPPED+=("$1")
}

step "1/8" "Format"
pnpm format:check
if has cargo; then cargo fmt --all --check; else skip "cargo fmt (cargo not installed)"; fi
if has gofmt; then
  CHANGED_GO=$(node -e 'import("./scripts/lib/changed-files.mjs").then((m) => console.log(m.changedFiles(/\.go$/).join("\n")))')
  UNFORMATTED=$([ -n "$CHANGED_GO" ] && gofmt -l $CHANGED_GO || true)
  if [ -n "$UNFORMATTED" ]; then
    echo "gofmt would change:"
    echo "$UNFORMATTED"
    exit 1
  fi
else
  skip "gofmt (Go not installed)"
fi

step "2/8" "Lint"
pnpm lint
if has cargo; then cargo clippy --workspace -- -D warnings; else skip "clippy (cargo not installed)"; fi
if has go; then (cd services/orchestrator && go vet ./...) && (cd services/sandbox && go vet ./...); else skip "go vet (Go not installed)"; fi

step "3/8" "Comments"
pnpm comments:check

step "4/8" "Typecheck"
pnpm typecheck

step "5/8" "Tests"
pnpm test
if has cargo; then cargo test --workspace; else skip "cargo test (cargo not installed)"; fi
if has go; then (cd services/orchestrator && go test ./...) && (cd services/sandbox && go test ./...); else skip "go test (Go not installed)"; fi
if has nargo; then
  for circuit in circuits/merkle circuits/solvency; do (cd "$circuit" && nargo test); done
else
  skip "nargo test (Noir not installed)"
fi

step "6/8" "Unused files, exports and dependencies"
pnpm knip

if [ "$MODE" = "--fast" ]; then
  echo -e "\n${GREEN}Fast preflight passed. Builds and Worker smoke tests run in CI and in a full preflight.${NC}"
else
  step "7/8" "Builds"
  pnpm build
  if has cargo; then cargo build -p proof-registry --release --target wasm32v1-none; else skip "contract wasm build (cargo not installed)"; fi

  step "8/8" "Worker builds and smoke tests (Workers runtime)"
  for app in website web docs; do
    pnpm --filter "@solva/$app" build:cloudflare
    scripts/worker-smoke.sh "$app"
  done
  echo -e "\n${GREEN}All preflight gates passed.${NC}"
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo -e "\n${YELLOW}Not run locally (CI runs them):${NC}"
  printf '  - %s\n' "${SKIPPED[@]}"
fi
