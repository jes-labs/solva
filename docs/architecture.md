# Architecture

This is the shape of the codebase and the rules that keep it that way. It has two levels: the repository tiers and their boundaries, and the layer rules inside each Next.js app. ESLint enforces the app-level import rules, so a violation fails lint and CI.

## Repository tiers

```
 reserve sources          customer balances
 (custodian, chain)       (institution ledger)
        │                        │
        ▼                        ▼
 ┌───────────────────────────────────────┐
 │ services/orchestrator (Go)            │  fetches reserves, checks signatures,
 │ clean architecture, Postgres, Redis   │  builds the cycle, calls the prover,
 └──────────────┬────────────────────────┘  publishes, keeps the audit log
                │ gRPC (proto/)
                ▼
 ┌───────────────────────────────────────┐
 │ services/prover (Rust)                │  Merkle sum tree, Poseidon2, witness,
 │ circuits/ (Noir), bb (UltraHonk)      │  proof generation
 └──────────────┬────────────────────────┘
                │ proof + public inputs
                ▼
 ┌───────────────────────────────────────┐
 │ contracts/proof-registry (Soroban)    │  verifies the proof on-chain with the
 │ crates/ultrahonk-soroban-verifier     │  BN254 and Poseidon2 host functions,
 └──────────────┬────────────────────────┘  stores results, checks inclusion
                │ reads
                ▼
 packages/contract-bindings, packages/sdk-ts, services/oracle (TypeScript)
                │
                ▼
 apps/website (public site), apps/web (console), apps/docs (documentation)
```

| Tier                  | Path                                                                        | Language       | Owns                                                     | Must not                                           |
| --------------------- | --------------------------------------------------------------------------- | -------------- | -------------------------------------------------------- | -------------------------------------------------- |
| Circuits              | `circuits/`                                                                 | Noir           | the solvency and Merkle constraints                      | change without parity vectors and an ADR           |
| Prover                | `services/prover`                                                           | Rust           | circuit-matching hashing, witness, proof                 | expose customer data beyond the proof              |
| Contract              | `contracts/proof-registry`, `crates/ultrahonk-soroban-verifier`             | Rust (Soroban) | on-chain verification, storage, inclusion check          | depend on off-chain state                          |
| Orchestrator          | `services/orchestrator`                                                     | Go             | cycles, reserve sources, publishing, audit log, HTTP API | hash for the circuit                               |
| Sandbox               | `services/sandbox`                                                          | Go             | a mock signed-balance custodian for demos and tests      | be presented as a real custodian                   |
| Contracts API         | `proto/`                                                                    | Protobuf       | the orchestrator to prover contract                      | change without regenerating stubs (`buf generate`) |
| Oracle, SDK, bindings | `services/oracle`, `packages/sdk-ts`, `packages/contract-bindings`          | TypeScript     | read access for integrators                              | write to the contract on a user's behalf           |
| Shared packages       | `packages/config`, `packages/shared-types`, `packages/ui`, `packages/brand` | TypeScript     | lint presets, shared types, shared UI, tokens            | import from an app                                 |
| Apps                  | `apps/website`, `apps/web`, `apps/docs`                                     | TypeScript     | user interfaces                                          | import another app                                 |

Hard rules:

1. **Circuit hashing lives only in the Rust prover and the Soroban contract.** The orchestrator and every TypeScript package treat hashes as opaque bytes. This prevents Poseidon parameter drift.
2. **Dependencies point down the diagram.** Apps may use packages; packages never import apps; services talk to each other only through `proto/` or HTTP APIs.
3. **One source of truth per interface:** `proto/` for gRPC, `services/orchestrator/api/openapi.yaml` for the HTTP API, the contract's generated bindings for on-chain calls.

## Inside a Next.js app

### Model

Every new Next.js app starts on this model. Existing apps move to it when they are next rebuilt; until then their current structure stands, and new code in them follows the rules below where the folders exist.

The project uses a **feature-based architecture with one-way layers**, the structure popularised by [Bulletproof React](https://github.com/alan2207/bulletproof-react) and used by most large Next.js codebases. Code is grouped by what it does for the product (a feature), not by its technical kind. Every import points down the layer diagram, and features never import each other.

Two rules on top of that model:

1. **Features have a public entry point.** Outside code imports a feature only through `index.ts` (client-safe) or `server.ts` (server-only). Everything else in the folder is private and free to change.
2. **The lint policy is default-deny.** An import is allowed only if a policy names it. A new folder under `src/` that fits no layer fails lint until the architecture says where it belongs.

### Layers

```
            ┌────────────────────────────┐
            │  app/   routes, layouts,   │
            │         route handlers     │
            └─────────────┬──────────────┘
                          │
            ┌─────────────▼──────────────┐
            │  components/layout/        │
            │  app shell                 │
            └─────────────┬──────────────┘
                          │  (features via index.ts / server.ts only)
            ┌─────────────▼──────────────┐
            │  features/<name>/          │
            │  one folder per product    │
            │  area, never cross-import  │
            └─────────────┬──────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  │
┌──────────────┐   ┌──────────────┐          │
│ components/  │──▶│   hooks/     │          │
│ ui/          │   │ cross-cutting│          │
└──────┬───────┘   └──────┬───────┘          │
       └────────┬─────────┘                  │
                ▼                            ▼
         ┌──────────────┐            ┌──────────────┐
         │    lib/      │───────────▶│   config/    │
         │ pure utils   │            │ static config│
         └──────────────┘            └──────────────┘
```

| Layer                | Holds                                                                                  | May import                                                         |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `app/`               | Routes, layouts, metadata files, route handlers. Composes features, owns no logic.     | everything below; features through their entry files only          |
| `components/layout/` | The app shell: header, navigation, footer.                                             | `ui`, `hooks`, `lib`, `config`; features through their entry files |
| `features/<name>/`   | Everything one product area needs: components, hooks, server code, types.              | its own files, `ui`, `hooks`, `lib`, `config`                      |
| `components/ui/`     | Design system primitives from shadcn and Vengeance UI. Know nothing about any feature. | `ui`, `hooks`, `lib`                                               |
| `hooks/`             | Hooks needed by two or more features.                                                  | `hooks`, `lib`, `config`                                           |
| `lib/`               | Framework-free code needed by two or more features.                                    | `lib`, `config`                                                    |
| `config/`            | Static configuration: site name, URLs, constants.                                      | `config`                                                           |

### Inside a feature

Create only the folders a feature needs. An empty folder is noise.

```
src/features/<name>/
├── components/      UI for this feature only
├── hooks/           stateful logic for this feature (custom hooks)
├── server/          data access, Server Functions, upstream clients (server-only)
├── lib/             pure logic and mappers for this feature, with tests
├── types.ts         the feature's domain types
├── index.ts         public API for client and server components
└── server.ts        public API for server-only code (route handlers, Server Functions)
```

- `index.ts` exports what the rest of the app may render or call from the client. It never re-exports anything under `server/`.
- `server.ts` starts with `import "server-only"` (add the `server-only` package with the first server module) and exports what route handlers and Server Components need.
- Tests sit next to the file they cover: `price.ts` and `price.test.ts`.

### Where does this go?

| You are adding                                   | Put it in                                                |
| ------------------------------------------------ | -------------------------------------------------------- |
| A page or a route handler                        | `src/app/`, as thin as possible, delegating to a feature |
| UI used by one feature                           | that feature's `components/`, even if it looks generic   |
| A primitive that knows nothing about any feature | `src/components/ui/`, via `pnpm dlx shadcn add`          |
| Stateful logic used by one feature               | that feature's `hooks/`                                  |
| A hook two or more features need                 | `src/hooks/`                                             |
| A pure function two or more features need        | `src/lib/`                                               |
| A call to an upstream API                        | the feature's `server/`, exposed through `server.ts`     |
| A constant shared across the app                 | `src/config/`                                            |

When two features keep needing each other, they are one feature. Merge them; do not open a path between them. When one feature must show another's UI, the route composes them and passes a slot (`children`, a render prop, or a callback).

### Server and client

- Components are Server Components by default. Add `"use client"` only to the smallest component that needs state, effects, event handlers or browser APIs.
- Data is fetched on the server, in a feature's `server/` module, and passed down as props. Components never call `fetch`; lint enforces it for `components/` folders.
- Secrets never reach the client. If a value would need a `NEXT_PUBLIC_` prefix to work, the design is wrong: put the call behind a route handler or a Server Function.
- Upstream responses are validated at the server boundary and mapped to the feature's types. Components only see our types.

### Rendering and caching

**Cache Components are off.** On Cloudflare Workers they deadlock with Next.js 16.3 and later: the page render hangs until the runtime cancels it (HTTP 500). OpenNext's own test suite is pinned to Next 16.2 for this reason. Do not turn on `cacheComponents` or `partialPrefetching`, and do not use `"use cache"` or `cacheLife`, until OpenNext supports them on our Next version; turning them back on is an ADR, and `scripts/worker-smoke.sh <app>` must pass.

The app uses the caching model Next.js documents as the previous model. Read `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` before writing data code.

- Pages with no request-time data are prerendered at build time and served as static files.
- `fetch` is uncached by default. Opt in per request with `cache: "force-cache"` or `next: { revalidate, tags }`; use `unstable_cache` for non-`fetch` work; invalidate with `revalidateTag` or `revalidatePath` from a Server Function.
- **On the Worker those caches do not persist between requests.** The apps run on the Workers Free plan without a writable incremental cache store (see each `open-next.config.ts`; the website and docs serve prerendered pages from the read-only static-assets cache), so cached data and time-based revalidation live only as long as one request. Persistent server caching needs R2, KV or Durable Objects, and adding one is an ADR.
- Stream slow, request-time data inside `<Suspense>` with a fallback that keeps layout stable.
- Every change to rendering or caching config must pass `scripts/worker-smoke.sh <app>`, which runs the built Worker in the Workers runtime and requires a 200 on every route.

### Deployment

Each app runs on Cloudflare Workers through [OpenNext](https://opennext.js.org/cloudflare), one production Worker per app, built by Workers Builds from `main`: `solva-website` (joinsolva.xyz), `solva-app` (app.joinsolva.xyz) and `solva-docs` (docs.joinsolva.xyz). There is no staging Worker. `pnpm build:cloudflare` in the app folder produces the Worker; `scripts/worker-smoke.sh <app>` runs it in the Workers runtime and checks every route. See `infra/CLOUDFLARE.md`.
