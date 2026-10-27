#!/usr/bin/env bash
#
# Move an app's production env vars from Vercel to its Cloudflare Worker.
#
# Usage:   scripts/cloudflare/migrate-env.sh <website|web|docs> [filled.env]
#
# Without a file it pulls the Vercel project's production vars. With a file it
# uses that instead (for values Vercel would not return). Server-only values are
# uploaded as Worker secrets; NEXT_PUBLIC_* values are printed for you to paste
# into the Worker's build variables. Nothing is written into the repo.
#
# Prerequisites: `vercel login` and `pnpm wrangler login`.
# Env:     VERCEL_SCOPE   Vercel team slug (default: emmanuels-projects-18d0cf4f)
set -euo pipefail

app="${1:-}"
filled="${2:-}"
scope="${VERCEL_SCOPE:-emmanuels-projects-18d0cf4f}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
dir="$root/apps/$app"

case "$app" in
  website) project="solva-website" ;;
  web) project="solva-app" ;;
  docs) project="solva-docs" ;;
  *)
    echo "usage: $0 <website|web|docs> [filled.env]" >&2
    exit 2
    ;;
esac
worker="$project"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
chmod 700 "$tmp"

if [ -n "$filled" ]; then
  cp "$filled" "$tmp/vars.env"
else
  (cd "$tmp" && vercel link --yes --project "$project" --scope "$scope" >/dev/null \
    && vercel env pull vars.env --environment=production --yes --scope "$scope" >/dev/null)
fi

# Only the names the code actually reads.
grep -rhoE 'process\.env\.[A-Z0-9_]+' "$dir/src" "$dir"/next.config.* 2>/dev/null \
  | sed 's/process\.env\.//' | sort -u >"$tmp/names"

node "$root/scripts/cloudflare/env-parse.mjs" "$tmp/vars.env" "$tmp/names" >"$tmp/result.json"

field() { node -e 'const r=require(process.argv[1]); const v=r[process.argv[2]]; console.log(Array.isArray(v) ? v.join(" ") : Object.keys(v).join(" "))' "$tmp/result.json" "$1"; }

missing="$(field missing)"
unset_vars="$(field unset)"

if [ -n "$unset_vars" ]; then
  echo "Read by the code but not set on Vercel (the code default applies): $unset_vars"
fi

if [ -n "$missing" ]; then
  out="$HOME/$worker-production.env"
  node -e '
    const r = require(process.argv[1]);
    const lines = [];
    for (const [k, v] of Object.entries({ ...r.build, ...r.secrets })) lines.push(`${k}=${JSON.stringify(v)}`);
    for (const k of r.missing) lines.push(`${k}=`);
    require("fs").writeFileSync(process.argv[2], lines.join("\n") + "\n", { mode: 0o600 });
  ' "$tmp/result.json" "$out"
  chmod 600 "$out"
  echo "Missing values (Sensitive on Vercel): $missing"
  echo "Fill them in $out, then rerun: $0 $app $out"
  echo "Nothing was uploaded."
  exit 1
fi

count="$(node -e 'console.log(Object.keys(require(process.argv[1]).secrets).length)' "$tmp/result.json")"
if [ "$count" -gt 64 ]; then
  echo "$count secrets is over the Workers Free limit of 64. Nothing was uploaded." >&2
  exit 1
fi

if [ "$count" -gt 0 ]; then
  node -e 'require("fs").writeFileSync(process.argv[2], JSON.stringify(require(process.argv[1]).secrets))' \
    "$tmp/result.json" "$tmp/secrets.json"
  (cd "$dir" && pnpm exec wrangler secret bulk "$tmp/secrets.json")
  echo "Uploaded $count secrets to $worker: $(field secrets)"
else
  echo "No runtime secrets for $worker."
fi

pnpm_version="$(node -p 'require(process.argv[1]).packageManager.split("@")[1]' "$root/package.json")"
echo
echo "Build variables for $worker (Settings > Build > Variables and secrets):"
node -e 'for (const [k, v] of Object.entries(require(process.argv[1]).build)) console.log(`  ${k}=${v}`)' "$tmp/result.json"
echo "  PNPM_VERSION=$pnpm_version"
