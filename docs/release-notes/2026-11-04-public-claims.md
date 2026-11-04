---
date: 2026-11-04
branch: fix/public-claims
base: main
scenario-impact: none
---

# The website, docs, blog and README say what Solva does today, and what is coming

A review of every public page found 87 places where the text ran ahead of the code. Each now describes the full product, with "Coming soon" or "In development" on what is not live yet, and states today's behaviour plainly.

## Changes

- Website: a "Coming soon" / "In development" tag (`components/ui/status-tag.tsx`) in the site's stamp style. Statuses covered, short and stale belong to public record pages (coming soon); a short cycle is refused, so no proof is made that day. Daily publishing is the design and the site says it is coming soon. Liabilities are a stored list today; anchor supply read from Stellar in the proof is coming soon. Privacy lines say no customer is named and the inclusion path shows unnamed subtotals. The trust page (version 2) says Solva runs the prover today and the orchestrator holds a scoped publishing key the passkey can revoke. Example records carry "Example" again.
- Demo: the record step reads the orchestrator's copy of the published record and says so; the holder step says anyone can check the path on Stellar with `verify_inclusion`.
- Blog: the Stellar post's snippet uses the contract's real functions; the supervisor post now addresses auditors and risk teams.
- Docs: statuses, schedule, balance upload, larger proofs, hiding mode, reviewed KYB and early-warning signals are marked or described as they are today; the 404 `/registry` example is gone.
- README and the SDK description: no "roadmap", no "Proof of Solvency".

## Removed

- Nothing.

## Verification

- `./scripts/preflight.sh` passed in every tier; 168 website tests and 149 docs content checks pass.
- Changed pages reviewed in a browser at 390 px and desktop width, light and dark.
