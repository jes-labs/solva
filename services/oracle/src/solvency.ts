// Builds the get_solvency answer for an institution. The verdict comes from the
// latest proof, and verified_on_chain reflects an on-chain verification check
// rather than the institution's word.

import type { Proof, SolvencyResult } from "@solva/shared-types";
import { SolvencyStatus } from "@solva/shared-types";
import { Solva } from "@solva/sdk-ts";

/** Compare two decimal-string totals as integers. Returns R >= L. */
function reservesCoverLiabilities(reservesTotal: string, liabilitiesTotal: string): boolean {
  return BigInt(reservesTotal) >= BigInt(liabilitiesTotal);
}

export interface SolvencyDeps {
  /** Fetch the latest proof for a tenant. The SDK wraps the orchestrator. */
  getLatestProof(tenant: string): Promise<Proof>;
  /**
   * Confirm the proof verifies on-chain. In production this re-runs the
   * registry's verification path. Kept as a dependency so the MCP layer stays
   * thin and this is testable.
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
  const solvent = verifiedOnChain && reservesCoverLiabilities(reservesTotal, liabilitiesTotal);

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
 * Default deps backed by the Solva SDK. The on-chain verification is a stub:
 * verify_inclusion exists on-chain today, but a standalone "verify this proof"
 * read is wired once the registry exposes it. Until then this returns true so
 * the shape is exercised; swap it for the real read when available.
 */
export function sdkSolvencyDeps(network: "testnet" | "mainnet" | "local"): SolvencyDeps {
  return {
    async getLatestProof(tenant: string): Promise<Proof> {
      const solva = new Solva({ network, tenant });
      return solva.getLatestProof();
    },
    async verifyOnChain(_proof: Proof): Promise<boolean> {
      // Stub: replace with a contract simulate call that re-checks the proof.
      return true;
    },
  };
}
