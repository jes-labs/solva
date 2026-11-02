---
name: solva-engineering-standards
description: Engineering standards for the Solva monorepo. Load before reading, writing, reviewing or deleting any code, circuit, contract, comment, config or document in this repository.
---

# Solva engineering standards

The rules live in the repository, not in this skill, so every agent and every human reads the same text.

Before any change, read these in full:

1. `AGENTS.md`: the directives, the lifecycle and the pre-review audit.
2. `docs/engineering-standards.md`: principles, TypeScript, React and hooks, data, styling, Lighthouse, accessibility, Rust, Go, Noir, testing, comments, cleanup, security, documentation.
3. `docs/architecture.md`: the repository tiers, their boundaries, and the layer rules inside each Next.js app.

Then read the code you will change, its callers and its tests, and the current docs for the APIs involved.

Non-negotiables to keep in view while working:

- You do not commit or push to `main`, and you never add AI attribution to a commit or PR.
- You do not approve your own ADR or plan.
- You do not write code comments.
- Circuit hashing lives only in the Rust prover and the Soroban contract.
- A replaced implementation is deleted in the same change, with its packages.
- No package is added before the code that uses it.
- Public text claims only what the code does today.
- Every website route scores 98 to 100 in every Lighthouse category on mobile.
- `./scripts/preflight.sh` passes before you call anything done.
