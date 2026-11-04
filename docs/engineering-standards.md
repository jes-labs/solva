# Engineering Standards

The coding bar for this repository. The TypeScript, React and web sections apply to every TypeScript workspace; the Rust, Go and Noir sections apply to their tiers. It binds every contributor, human or AI. Where a rule can be checked by a machine, it is, and the check is named next to the rule. The rest is enforced in review.

Contents: [Before you start](#before-you-start) · [Principles](#principles) · [TypeScript](#typescript) · [Components](#components) · [Hooks](#hooks) · [Custom hooks](#custom-hooks) · [Data and server code](#data-and-server-code) · [Styling and UI kit](#styling-and-ui-kit) · [Performance](#performance) · [Accessibility](#accessibility) · [Errors](#errors) · [Testing](#testing) · [Comments](#comments) · [Naming](#naming) · [Dependencies and cleanup](#dependencies-and-cleanup) · [Security](#security) · [Rust](#rust) · [Go](#go) · [Noir circuits](#noir-circuits) · [Documentation](#documentation)

---

## Before you start

Read before you write. Nobody, human or agent, changes code they have not read.

1. Read `AGENTS.md`, this file and [`docs/architecture.md`](architecture.md).
2. Read the code you will touch, the code that calls it, and its tests. Read `git log` for that area.
3. Search for an existing implementation before writing one (`rg`, the feature's `index.ts`, `src/hooks/`, `src/lib/`, `src/components/ui/`). Reuse it or extend it.
4. Read the current docs for every framework or library involved: `node_modules/next/dist/docs/` for Next.js, Context7 or the official site for anything else. Never code against a remembered API.
5. If the change is non-trivial, the ADR comes before the code (see `AGENTS.md`).

## Principles

- **Separation of concerns.** A module does one job. Rendering, state, data access and formatting live in different places: component, hook, server module, `lib` function.
- **DRY.** One source of truth for every piece of knowledge: one `cn`, one API client per upstream, one formatter per kind of value, one type per domain concept. The second time you write something, extract it. Duplication of _knowledge_ is the problem; two components that happen to look alike are not.
- **KISS.** The simplest code that is correct wins. No abstraction without two real callers. No configuration for a case nobody has.
- **YAGNI.** Build what the current issue needs. No speculative props, flags, layers or packages.
- **SOLID, applied to React.**
  - Single responsibility: a component renders, a hook manages state, a server module talks to an upstream.
  - Open/closed: extend through props, `children` and composition, not by editing a shared component for one caller.
  - Liskov: a variant component accepts everything its base accepts.
  - Interface segregation: props are the minimum a component needs. Pass `ratio`, not the whole `proof`.
  - Dependency inversion: features depend on interfaces they own (types in `types.ts`), not on an SDK's shapes.
- **Composition over configuration.** Prefer `children` and slots to boolean props. Three booleans on one component is a sign it should be two components.
- **Modularity.** A file past roughly 200 lines, or a component past roughly 150, is usually doing two jobs. Split it.
- **Correct over fast.** If a choice is between a shortcut and the correct fix, take the fix and say what it costs.

## TypeScript

- `strict` stays on. No `any` (lint: `@typescript-eslint/no-explicit-any`). At a third-party boundary, type the value as `unknown` and narrow it.
- No `@ts-ignore`, no `@ts-expect-error` (lint: `ban-ts-comment`). Fix the type.
- No non-null assertions to silence the compiler. Handle the `null`.
- Types describe the domain: `type InstitutionId = string & { readonly __brand: "InstitutionId" }` beats a bare `string` where mixing ids is a real risk.
- Use `import type` for types (lint: `consistent-type-imports`).
- Derive types from a single source (`z.infer`, `typeof`, `ReturnType`) instead of writing them twice.
- Money and token amounts are never `number`. Use base units in `bigint` and convert once, at the display edge.

## Components

- Server Components by default. `"use client"` goes on the smallest leaf that needs state, effects, event handlers or browser APIs.
- A component renders. Everything else (state machines, subscriptions, data access, formatting) lives in a hook, a server module or a `lib` function.
- Function declarations, named exports, one component per file. The file is named after the component in kebab case: `proof-card.tsx` exports `ProofCard`.
- No components defined inside other components (lint: `react-hooks/static-components`).
- Props are typed with an interface or type named `<Component>Props`. Extend native element props with `ComponentProps<"button">` instead of redeclaring them.
- In React 19, `ref` is a normal prop. Do not use `forwardRef`.
- Keys are stable ids, never array indexes for lists that change.
- No dead UI: no buttons that do nothing, links to `#`, or placeholder sections. Ship the real thing or nothing.

## Hooks

The React Compiler is on (`reactCompiler: true`). It memoizes components and hooks automatically, which changes which hooks you reach for. Pick the hook that matches the job. The wrong hook is a review comment even when the code works.

| The job                                                                             | Use                                                                                                     | Not                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| One independent piece of UI state                                                   | `useState`                                                                                              |                                                                  |
| Several related values, or the next state depends on an action                      | `useReducer` with a typed action union                                                                  | several `useState` calls updated together                        |
| A value computed from props or state                                                | compute it during render                                                                                | `useState` + `useEffect` (lint: `no-deriving-state-in-effects`)  |
| Expensive computation                                                               | compute during render; the compiler memoizes                                                            | manual `useMemo`, unless profiling shows the compiler bailed out |
| Stable callbacks for children                                                       | plain functions; the compiler memoizes                                                                  | manual `useCallback` by default                                  |
| Reading context                                                                     | `use(Context)`                                                                                          | `useContext` in new code (`use` also works conditionally)        |
| Reading a promise passed from a Server Component                                    | `use(promise)` inside `<Suspense>`                                                                      | `useEffect` + `useState` loading flags                           |
| Server data that must refresh in the browser (polling, focus refetch, pagination)   | a feature hook over TanStack Query (`useQuery`, `useSuspenseQuery`, `useInfiniteQuery`)                 | `useEffect` + `fetch`, `setInterval` refetching                  |
| A write that updates cached server data                                             | a feature hook over `useMutation` calling a Server Function, then `setQueryData` or `invalidateQueries` | refetching the page by hand                                      |
| Form submit that calls a Server Function                                            | `<form action>` + `useActionState`                                                                      | `onSubmit` + manual pending and error state                      |
| Pending state of the enclosing form                                                 | `useFormStatus` in a child of the form                                                                  | prop-drilling `isPending`                                        |
| Show the result before the server confirms                                          | `useOptimistic`                                                                                         | copying server data into local state                             |
| Keep the UI responsive during a slow update                                         | `useTransition` / `startTransition`                                                                     | debouncing state by hand                                         |
| A fast-changing input driving an expensive render (search, filters)                 | `useDeferredValue`                                                                                      | `setTimeout` debounce in an effect                               |
| Subscribe to something outside React (media query, online status, storage, a store) | `useSyncExternalStore`                                                                                  | `useEffect` + `useState` mirror                                  |
| Synchronise with an external system (socket, chart instance, observer)              | `useEffect` with a cleanup                                                                              | anything that is not an external system                          |
| Non-reactive logic read inside an effect (latest props in a handler)                | `useEffectEvent`                                                                                        | adding the value to deps, or a ref you update by hand            |
| Measure layout before paint                                                         | `useLayoutEffect`                                                                                       | `useEffect` + flicker                                            |
| A mutable value that must not re-render (timer id, DOM node, instance)              | `useRef`                                                                                                | `useState`                                                       |
| Accessible ids linking label, input and description                                 | `useId`                                                                                                 | hard-coded or random ids                                         |
| A parent calling methods on a child                                                 | `useImperativeHandle` with the `ref` prop, rarely                                                       | exposing internals by default                                    |
| Hide part of the tree but keep its state                                            | `<Activity mode="hidden">`                                                                              | unmounting and re-fetching                                       |
| Animated route or state change                                                      | `<ViewTransition>` where it fits                                                                        | a motion library for a simple cross-fade                         |
| Insert styles before layout (CSS-in-JS libraries only)                              | `useInsertionEffect`                                                                                    | application code                                                 |

Effects are a last resort, not a lifecycle. Before writing `useEffect`, check: is this derived data (compute it), an event response (put it in the handler), data fetching (do it on the server or with `use`), or an external subscription (`useSyncExternalStore`)? Only a real external system gets an effect. Setting state synchronously in an effect is a lint error (`react-hooks/set-state-in-effect`).

Rules of Hooks and exhaustive dependencies are lint errors, as are the compiler's purity, ref and immutability checks (`react-hooks/*`). Never silence them; restructure the code.

## Custom hooks

Custom hooks are how this codebase separates behaviour from rendering. They are required, not optional:

- **A component that needs more than one stateful hook, or any effect, moves that logic into a custom hook.** The component calls one hook and renders its result.
- **The same stateful logic in two places is extracted into one hook.** No copy-paste of `useState` + handler pairs.
- **Every subscription, timer, socket, observer or browser API access lives in a hook**, never inline in a component.
- **Data reads on the client go through a hook** named for the data (`useLatestProof`), never through `fetch` in a component (lint: `no-restricted-globals` in `components/`).

How to write one:

- Name it `use` + what it provides: `useOrderBook`, `useCountdown`, not `useData` or `useHelper`.
- One responsibility per hook. Compose small hooks rather than growing one.
- Return a stable, typed shape. Use an object for more than two values (`{ status, data, error }`), a tuple only for `useState`-like pairs.
- Model status explicitly: `"idle" | "loading" | "success" | "error"`, not a set of booleans.
- Clean up everything it starts.
- Keep it pure apart from its declared effects; it must work in Strict Mode, which runs effects twice in development.
- Add `useDebugValue` when the hook's state is not obvious in React DevTools.
- Location: `features/<name>/hooks/` if one feature uses it, `src/hooks/` once a second feature does.
- Test it with `renderHook` from Testing Library.

## Data and server code

- Read data on the server, in the feature's `server/` folder, and pass it to components as props. Stream slow parts with `<Suspense>`.
- Cache with `fetch` options (`cache: "force-cache"`, `next: { revalidate, tags }`) or `unstable_cache`, and invalidate with `revalidateTag` or `revalidatePath`. Cache Components (`"use cache"`, `cacheLife`) are off because they deadlock on Workers; see [Rendering and caching](architecture.md#rendering-and-caching). Never cache user-specific data in a shared entry.
- Write with Server Functions (`"use server"`) exposed through the feature's `server.ts`, called from `<form action>` or `startTransition`.
- Validate every upstream response at the server boundary and map it into the feature's types before it goes anywhere else. Validate every input to a Server Function or route handler: it is a public endpoint.
- One client per upstream service, in one place. No second client with its own base URL and error handling.
- Environment variables are read in one typed module, validated at startup, never with `process.env.X` scattered across files.
- Client-side server state uses **TanStack Query**. It is for data that must live and refresh in the browser: polling, refetch on focus, pagination, optimistic mutations, data shared by several client components. Everything else is read and cached on the server; never use both for the same data without a reason in the PR.
  - Queries are `queryOptions` factories in `features/<name>/queries.ts`, keys starting with the feature name.
  - Components reach them only through a named custom hook (`useLatestProof`), never `useQuery` inline.
  - `queryFn` calls our own route handlers; mutations call Server Functions through `useMutation` and update or invalidate the affected queries.
  - The provider lives in the layout of the route group that needs it, not the root layout.
  - Install `@tanstack/react-query` and `@tanstack/eslint-plugin-query` with the first feature that uses them.

## Styling and UI kit

- Tailwind CSS v4 only, configured in `src/app/globals.css`. No CSS-in-JS, no inline `style` except for values computed at runtime.
- Use theme tokens (`bg-background`, `text-muted-foreground`, `--color-*`), never raw hex values in components. Change the palette in `globals.css`, in one place.
- Merge classes with `cn` from `@/lib/utils`. Never concatenate class strings by hand.
- Variants use `cva`, defined once beside the component.
- UI primitives come from shadcn (`pnpm dlx shadcn@latest add <name>`) , [Kokonut UI](https://kokonutui.com) (`pnpm dlx shadcn@latest add @kokonutui/<name>`) and [Vengeance UI](https://www.vengenceui.com) (`pnpm dlx shadcn@latest add @vengeanceui/<name>`), run from the app folder. Add a component the day a feature uses it, not before. Generated components may be edited; record why in the PR.
- Motion: the registry components use `motion` (Framer Motion). Load it with `LazyMotion` and the `m` component so only the features used are shipped, and respect `prefers-reduced-motion` (`useReducedMotion`). Animate `transform` and `opacity` only.
- Dark mode uses the `.dark` class and the `.dark` token block. Every component works in both.

## Performance

- Server Components first. Client JavaScript is the main cost on a mid-range phone; ship as little as possible.
- No client component above a layout boundary unless the whole subtree needs it.
- Heavy client code (charts, editors, motion-heavy sections) loads with `next/dynamic` or after interaction.
- The system font stack is the default. A web font costs about 30 KB on the LCP path; add one only through `next/font`, with `display: "swap"`.
- Images through `next/image` with explicit `width`/`height` or `fill` plus `sizes`; `priority` only on the largest above-the-fold image. Decide the Cloudflare image strategy in an ADR before the first raster image.
- No layout shift: reserve space for anything that loads late, including Suspense fallbacks.
- Third-party scripts through `next/script` with `lazyOnload` or `afterInteractive`, and only after an ADR.
- No barrel files that re-export a whole library. A feature's `index.ts` exports only its public API.
- Measure before optimising. Use the Chrome DevTools MCP performance trace to prove a change.

## Accessibility

- Semantic HTML first: `button` for actions, `a` for navigation, one `h1` per page, headings in order, landmarks (`header`, `main`, `nav`, `footer`).
- Every interactive element works with a keyboard and has a visible focus style.
- Every input has a label; icons that act as buttons have an accessible name.
- Text contrast meets WCAG AA in light and dark themes.
- Respect `prefers-reduced-motion`.
- `jsx-a11y` lint rules stay on.

## Errors

- Handle an error where it happens: show the user a useful state, log it with context.
- No silent `catch`, no empty `catch`, no catch-and-return-a-default that hides a broken upstream.
- No dummy data or fallbacks standing in for a failed call.
- Every async UI has a loading state and an error state. Use `error.tsx` boundaries per route segment and `not-found.tsx` where a resource can be missing.
- Never delete or weaken a failing test or assertion to get a green build.

## Testing

- Vitest and Testing Library. Tests sit next to the code: `proof-card.tsx` and `proof-card.test.tsx`.
- Test behaviour through what the user sees (`getByRole`, `getByText`), not implementation details.
- A component test covers the success state, the empty state, the error state and the loading state where they exist.
- Bug fixes follow red-green: write a failing test that reproduces the bug, see it fail for the right reason, then fix.
- Anything touching amounts, balances or transaction building has exact tests with `bigint` values.
- Mocks only at the boundary (network, time, browser APIs). Never mock the module under test.

## Comments

Comments are for humans, written by humans. Code says what it does; a comment exists only for the _why_ a reader cannot get from the code.

- **AI agents do not write comments.** No code comments, no JSDoc, no commented-out code in anything an agent produces. If the agent believes a non-obvious reason needs recording, it says so in the pull request description, and a human decides whether to write it.
- **A human comment explains why, never what.** A workaround for a bug, a business rule, a constraint from an upstream. If the code needs a comment to explain what it does, rename or restructure the code instead.
- **KISS.** One to three short lines. No headers, banners, ASCII art, section dividers, or "Step 1" narration.
- **No AI tone.** No "robust", "seamless", "leverage", "comprehensive", "in order to", "this function". No em dashes or en dashes.
- **No commented-out code.** Git keeps history; delete it.
- **No stale comments.** A change that makes a comment wrong updates or deletes it.
- Tool directives (`eslint-disable-next-line rule -- reason`) are allowed only with a reason, and only after the code cannot be fixed.

`pnpm comments:check` (`scripts/check-comments.mjs`) runs on every commit and in CI. It rejects dashes, filler phrases, commented-out code and comments over three lines. It cannot tell who wrote a comment, so the first rule is enforced in review.

## Naming

- Files and folders: kebab case (`order-book.tsx`, `use-order-book.ts`).
- Components: PascalCase. Hooks: `useCamelCase`. Constants: `UPPER_SNAKE_CASE` only for true module-level constants.
- Names say what a thing is: `LatestProofCard`, `formatTokenAmount`, `useOrderBook`. Never `Card2`, `utils2`, `handleStuff`, `data`.
- Booleans read as questions: `isOpen`, `hasBalance`, `canTrade`.
- Event handler props are `onX`; the functions handling them are `handleX`.

## Dependencies and cleanup

The codebase holds only what it uses. Every package, file, export and config entry has a current caller.

- **Add a package only when the change that uses it lands.** No "we'll need it later" installs.
- Before adding a package, check whether the platform (React, Next.js, the browser, Node) or an existing dependency already does the job. Prefer small, maintained, typed packages. Record the reason in the PR.
- Pin exact versions. Dependabot proposes updates; one upgrade per PR.
- **When an implementation replaces another, the same change removes the old one completely:** its files, exports, styles, tests, assets, routes, environment variables, config entries, and every package that only it used. No parallel old and new paths, no "legacy" folder, no feature flag left on forever.
- When a feature is removed, everything it carried goes with it in the same change.
- `pnpm knip` must report nothing for the workspaces it covers. It runs on pre-push and in CI and fails on unused files, exports and dependencies.
- After removing packages, run `pnpm install` and commit the lockfile.

## Security

- No secrets in the repository. `.env*` and `.dev.vars` are git-ignored.
- Secrets live in Cloudflare (Worker secrets and build variables). A secret never gets a `NEXT_PUBLIC_` prefix.
- Validate all input on the server. Treat route handlers and Server Functions as public endpoints with authentication and authorisation checks.
- Never render user input as HTML. No `dangerouslySetInnerHTML` without a sanitiser and an ADR.
- Run `pnpm audit` before adding a dependency with a large install tree.

## Rust

Applies to the prover (`services/prover`), the Soroban contract (`contracts/`) and the verifier crate (`crates/`).

- `cargo fmt --all --check` and `cargo clippy --workspace -- -D warnings` stay clean. No `#[allow(...)]` to hide a warning the code can fix.
- Return errors with context. No `unwrap()` or `expect()` on a path that real input can reach; in the contract, return the typed `Error` enum.
- Contract amounts are integers (`i128`, `u64`). Never floats.
- Hashing that must match the circuit lives only here: the prover and the contract. Change it only with the circuit, in one PR, with parity tests on both sides.
- Contract changes keep the storage layout and the public interface stable unless an ADR says otherwise; a breaking change means a new deployment and a migration note.
- Tests cover the success path, each error code, and the authorisation checks.

## Go

Applies to the orchestrator and the sandbox (`services/orchestrator`, `services/sandbox`).

- Clean architecture: dependencies point inward. `entity` imports nothing; `usecase` defines interfaces; `infrastructure` and `repo` implement them. A domain type never imports a database driver.
- `gofmt` and `go vet ./...` stay clean.
- Handle every error where it happens and wrap it with context (`fmt.Errorf("...: %w", err)`). Never discard an error with `_`.
- The orchestrator never hashes for the circuit. That is the prover's job.
- Amounts are integers in minor units (`int64` or `big.Int`).
- Keep one shape per kind of component: every bank adapter, every publisher, every repository follows the same pattern.

## Noir circuits

Applies to `circuits/`.

- Use the pinned toolchain (Noir and Barretenberg versions in `circuits/README.md`). Do not bump a version inside an unrelated change.
- Every circuit change comes with tests for the true case, the false case, the growth (fraud) bound and the inclusion path, and with parity vectors in `test-vectors/` that the prover and the contract also check.
- A change to the circuit, the proof format or the verification key is non-trivial and needs an ADR.

## Documentation

- Write for a reader new to the codebase: correct, clear, short. Define a term the first time you use it.
- Code samples in docs must run.
- The README covers the stack, the scripts and where to read next. Deep material lives in `docs/`.
- If a document is wrong, fix it in the same pull request that found it.
- No em dashes in documentation either.
- Public text (website, docs, README, whitepaper) claims only what the code does today. Planned work is labelled as planned.
