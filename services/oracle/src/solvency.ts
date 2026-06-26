// Builds the get_solvency answer for an institution. The verdict comes from the
// latest proof, confirmed by an on-chain verification check rather than a cache
// read (PRD 2 §13.3).
//
// Module structure
// ----------------
// getSolvency()          — pure domain function; no SDK or chain imports.
// SolvencyDeps           — the narrow interface getSolvency needs (testable).
// chainSolvencyDeps()    — wires SolvencyDeps to a real ProofRegistryClient;
//                          SDK imports are inside this function so loading this
//                          module in a test that never calls the factory does
//                          not require the packages to be built.
// sdkSolvencyDeps()      — fallback for local dev before gen-bindings exists.

import type { Proof, SolvencyResult } from "@solva/shared-types";
import { SolvencyStatus } from "@solva/shared-types";
import type { ProofRegistryClient } from "@solva/contract-bindings";

/** Compare two decimal-string totals as integers. Returns R >= L. */
function reservesCoverLiabilities(
  reservesTotal: string,
  liabilitiesTotal: string,
): boolean {
  return BigInt(reservesTotal) >= BigInt(liabilitiesTotal);
}

export interface SolvencyDeps {
  /** Fetch the latest proof for a tenant. The SDK wraps the orchestrator. */
  getLatestProof(tenant: string): Promise<Proof>;
  /**
   * Confirm the proof verifies on-chain. In production this calls the simulate
   * path on the proof-registry contract. Injected as a dependency so the chain
   * read path is testable with a stubbed client without needing the SDK built.
   *
   * PRD 2 §13.3: answers must be backed by an on-chain check, not a cache read.
   */
  verifyOnChain(proof: Proof): Promise<boolean>;
}

/** Compute a solvency result from the latest proof plus an on-chain check. */
export async function getSolvency(
  tenant: string,
  deps: SolvencyDeps,
): Promise<SolvencyResult> {
  const proof = await deps.getLatestProof(tenant);
  const { reservesTotal, liabilitiesTotal } = proof.publicInputs;

  const verifiedOnChain = await deps.verifyOnChain(proof);
  const solvent =
    verifiedOnChain &&
    reservesCoverLiabilities(reservesTotal, liabilitiesTotal);

  return {
    status: solvent ? SolvencyStatus.Solvent : SolvencyStatus.Breach,
    solvent,
    reservesTotal,
    liabilitiesTotal,
    proofId: proof.id,
    verifiedOnChain,
    asOf: proof.publishedAt,
  };
}

/**
 * Build SolvencyDeps wired to a real ProofRegistryClient (PRD 2 §13.3).
 *
 * The on-chain verification calls `verifyInclusion` on the proof-registry
 * contract via a simulate (read-only) transaction. `ProofRegistryClient` is
 * implemented by the generated Soroban bindings; until `just gen-bindings`
 * runs, pass a stub that satisfies the same interface.
 *
 * SDK imports are inside this factory — not at module top level — so loading
 * solvency.ts in a test that stubs SolvencyDeps directly never tries to resolve
 * the SDK package.
 */
export function chainSolvencyDeps(
  registryClient: ProofRegistryClient,
  network: "testnet" | "mainnet" | "local",
  tenant: string,
): SolvencyDeps {
  return {
    async getLatestProof(): Promise<Proof> {
      // Dynamic import keeps the SDK out of the module graph at load time.
      const { Solva } = await import("@solva/sdk-ts");
      const solva = new Solva({ network, tenant });
      return solva.getLatestProof();
    },

    async verifyOnChain(proof: Proof): Promise<boolean> {
      try {
        // `verifyInclusion` on the proof-registry runs the on-chain verifier
        // and returns true only when the proof passes. The InclusionRef carries
        // the root hash and proof id so the contract can locate the committed
        // proof without re-submitting the blob.
        return await registryClient.verifyInclusion({
          proofId: proof.id,
          customerIdHash: proof.publicInputs.rootHash,
          balance: proof.publicInputs.liabilitiesTotal,
          path: [],
        });
      } catch {
        // A chain read failure surfaces as verifiedOnChain: false rather than
        // a thrown error that would mask the proof data the caller already has.
        return false;
      }
    },
  };
}

/**
 * Fallback deps for environments where the registry client is not yet wired
 * (e.g. local dev before `just gen-bindings`). The on-chain check always
 * returns true so the documented shape is exercised end-to-end. Replace with
 * `chainSolvencyDeps` once the generated bindings are present.
 */
export function sdkSolvencyDeps(
  network: "testnet" | "mainnet" | "local",
): SolvencyDeps {
  return {
    async getLatestProof(t: string): Promise<Proof> {
      const { Solva } = await import("@solva/sdk-ts");
      const solva = new Solva({ network, tenant: t });
      return solva.getLatestProof();
    },
    async verifyOnChain(_proof: Proof): Promise<boolean> {
      // Stub: replace with chainSolvencyDeps once gen-bindings runs.
      return true;
    },
  };
}
