# Deploying the web apps to Cloudflare Workers

The three Next.js apps run on Cloudflare Workers through OpenNext
(`@opennextjs/cloudflare`). Each app is its own Worker, built by Workers Builds
from this repo.

| App            | Workspace        | Worker          | Domain                               |
| -------------- | ---------------- | --------------- | ------------------------------------ |
| `apps/website` | `@solva/website` | `solva-website` | `joinsolva.xyz`, `www.joinsolva.xyz` |
| `apps/web`     | `@solva/web`     | `solva-app`     | `app.joinsolva.xyz`                  |
| `apps/docs`    | `@solva/docs`    | `solva-docs`    | `docs.joinsolva.xyz`                 |

The Worker name in the Cloudflare dashboard must equal `name` in the app's
`wrangler.jsonc`, or deploys go to the wrong Worker. There is no staging Worker.

## Build and check locally

From the repo root. `build:cloudflare` on `web` also builds its workspace
packages (`sdk-ts`, `shared-types`, `contract-bindings`).

```bash
pnpm install
pnpm --filter @solva/website build:cloudflare
scripts/worker-smoke.sh website                # also: web, docs
```

`next build` passing proves nothing about the Workers runtime. The smoke test
serves the build on workerd (`wrangler dev`) and requests the main routes. Run it
after any change to rendering, caching or `next.config`. CI runs it for all three
apps.

## Caching

- `website` and `docs` use the read-only static-assets incremental cache:
  prerendered pages are served from Workers Static Assets. There is no ISR or
  revalidation. Pages that read the filesystem (the blog) only work because they
  are prerendered; `blog/[slug]` sets `dynamicParams = false` so unknown slugs
  404 instead of rendering.
- `web` has no incremental cache. `unstable_cache`, `revalidate` and `fetch`
  caching would not persist between requests. Adding R2 is a separate decision.
- `next/image` optimization is off on the website (`images.unoptimized`); the
  free plan has no Images binding.

## Limits (Workers Free)

- 3 MiB compressed per Worker. Measured Oct 2026: website 1.45 MiB, web
  1.25 MiB, docs 1.63 MiB (`wrangler deploy --dry-run --outdir <tmp>`).
- 10 ms CPU per request and 100,000 requests per day across the account.
- Server-side `fetch` cannot target a bare IP address. `ORCHESTRATOR_URL`,
  `SANDBOX_URL` and `NEXT_PUBLIC_ORCHESTRATOR_URL` must use a hostname. They
  use `3.77.49.18.sslip.io` (public DNS that resolves to the Lightsail IP).
  Custom ports work because the host is not proxied by Cloudflare.

## Environment variables

`scripts/cloudflare/migrate-env.sh <website|web|docs> [filled.env]` uploads an
app's server-only values as Worker secrets and prints the `NEXT_PUBLIC_*` build
variables to paste into the dashboard. Vercel never returns Sensitive values (it
writes `[SENSITIVE]`), so the script refuses to upload until every value is
known and writes a fill-in file to `~/<worker>-production.env`.

`NEXT_PUBLIC_*` values are inlined at build time, so they are Workers Builds
build variables, not runtime secrets.

## Manual deploy

```bash
git checkout main && git pull && pnpm install
cd apps/<app> && pnpm build:cloudflare && pnpm opennextjs-cloudflare deploy
```
