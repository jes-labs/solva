#!/usr/bin/env bash
#
# Smoke test an app on the real Workers runtime (workerd), not `next start`.
# A build can pass every Next check and still 500 on Workers, so run this after
# every `build:cloudflare`.
#
# Usage:   scripts/worker-smoke.sh <website|web|docs>
#          (run `pnpm --filter @solva/<app> build:cloudflare` first)
# Env:     SMOKE_PORT   port for wrangler dev (default 8799)
set -euo pipefail

app="${1:-}"
port="${SMOKE_PORT:-8799}"
root="$(cd "$(dirname "$0")/.." && pwd)"
dir="$root/apps/$app"

# "path expected-status" per app. Routes that call the orchestrator or sandbox
# are left out: they need live backends and secrets.
case "$app" in
  website)
    routes=(
      "/ 200" "/about 200" "/blog 200" "/blog/merkle-sum-tree-in-noir 200"
      "/blog/no-such-post 404" "/pricing 200" "/security 200" "/legal 200"
      "/robots.txt 200" "/sitemap.xml 200"
    )
    ;;
  web)
    routes=("/ 200" "/verify 200" "/inclusion 200" "/auth 200")
    ;;
  docs)
    routes=(
      "/ 200" "/docs 200" "/docs/architecture 200" "/docs/architecture.md 200"
      "/docs.md 200" "/api/search?query=proof 200" "/robots.txt 200" "/sitemap.xml 200"
    )
    ;;
  *)
    echo "usage: $0 <website|web|docs>" >&2
    exit 2
    ;;
esac

if [ ! -f "$dir/.open-next/worker.js" ]; then
  echo "no build at $dir/.open-next; run build:cloudflare first" >&2
  exit 2
fi

log="$(mktemp)"
cd "$dir"
# Copy prerendered pages into the asset cache, as `deploy` does remotely.
pnpm exec opennextjs-cloudflare populateCache local >/dev/null
WRANGLER_SEND_METRICS=false pnpm exec wrangler dev --port "$port" --ip 127.0.0.1 >"$log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; rm -f "$log"' EXIT

base="http://127.0.0.1:$port"
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "$base/"; then break; fi
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "wrangler dev exited early" >&2
    cat "$log" >&2
    exit 1
  fi
  sleep 1
done

failed=0
for entry in "${routes[@]}"; do
  path="${entry% *}"
  want="${entry##* }"
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$base$path" || echo 000)"
  if [ "$got" = "$want" ]; then
    echo "ok   $got $path"
  else
    echo "FAIL $got $path (want $want)"
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "--- wrangler log ---" >&2
  cat "$log" >&2
  exit 1
fi
echo "smoke passed: $app"
