---
date: 2026-11-04
branch: feat/demo-onchain
base: main
scenario-impact: updated
---

# The demo reads the contract on Stellar, and shows reserves read from Stellar

The demo has a third institution, Harbor Wallet, whose reserves are real Testnet USDC held in a Stellar account and read live on every run. For every institution, the record step now reads `get_latest_proof` from the institution's registry on Stellar, and the holder step runs `verify_inclusion` on the contract.

## Changes

- `src/lib/demo-institutions.ts`: the three demo institutions and their reserve source (Harbor Wallet: account `GCPBHMM7…AR4R`, Circle's Testnet USDC), the Horizon balance reader and USDC formatting.
- `src/lib/onchain-record.ts`: on-chain reads through `@solva/sdk-ts` (`getOnChainLatestProof`, `verifyInclusion`).
- Routes: `/api/sandbox/record` (new) reads the record from the contract; `/api/sandbox/inclusion` confirms the holder on the contract; `/api/sandbox/reserves` reads Harbor Wallet's account from Horizon; `/api/sandbox/run` skips the sandbox scenario for Harbor Wallet.
- Demo page: Harbor Wallet in the institution list, its reserve account linked to the explorer in place of the scenario list, amounts in USDC, step notes and page copy describing what each step reads.
- Docs: on-chain reserves marked available, with the orchestrator settings in Connect a reserve source; demo descriptions updated.

## Packages

- `@solva/sdk-ts` (workspace) and `@stellar/stellar-sdk` 16.0.1, the version already in the lockfile, for the on-chain reads. The website Worker grows from 1,912 KiB to 2,040 KiB gzipped.

## Verification

- Red, then green: tests for the institutions, the Horizon balance, USDC formatting, and every changed step line.
- All six steps run in the browser for Harbor Wallet against the live backend: R = 20 USDC and L = 9 USDC read from the registry on Stellar, and `verify_inclusion` true for `cust-001` in proof 2.
- The same routes answer on the Workers runtime (`wrangler dev`).
