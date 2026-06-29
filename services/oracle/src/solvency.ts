// Builds the get_solvency answer for an institution. The verdict comes from the
// latest proof, confirmed by an on-chain read of the institution's own contract
// rather than a cache read (PRD 2 §13.3).
//
// Module structure
// ----------------
// getSolvency()          — pure domain function; no SDK or chain imports.
// SolvencyDeps           — the narrow interface getSolvency needs (testable).
// chainSolvencyDeps()    — production wiring: resolves each institution to its
//                          own contract through the SDK and reads it on-chain.

import type { Proof, SolvencyResult } from "@solva/shared-types";
import { SolvencyStatus } from "@solva/shared-types";

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
   * Confirm solvency against the tenant's own on-chain contract, not a cache
   * read (PRD 2 §13.3). tenant is passed so the check resolves to that
   * institution's contract. Injected so getSolvency stays testable without the
   * SDK or a live network.
   */
  verifyOnChain(tenant: string, proof: Proof): Promise<boolean>;
}

/** Compute a solvency result from the latest proof plus an on-chain check. */
export async function getSolvency(
  tenant: string,
  deps: SolvencyDeps,
): Promise<SolvencyResult> {
  const proof = await deps.getLatestProof(tenant);
  const { reservesTotal, liabilitiesTotal } = proof.publicInputs;

  const verifiedOnChain = await deps.verifyOnChain(tenant, proof);
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
 * Production SolvencyDeps. Each call builds an SDK client for the queried
 * institution, so reads resolve to that institution's own contract (#130). The
 * on-chain check reads the latest proof from the tenant's contract and confirms
 * R >= L there; an unreachable contract surfaces as not-verified rather than a
 * thrown error.
 *
 * The SDK import is dynamic so loading this module in a test that stubs
 * SolvencyDeps directly never resolves the SDK package.
 */
export function chainSolvencyDeps(
  network: "testnet" | "mainnet" | "local",
): SolvencyDeps {
  return {
    async getLatestProof(tenant: string): Promise<Proof> {
      const { Solva } = await import("@solva/sdk-ts");
      return new Solva({ network, tenant }).getLatestProof();
    },

    async verifyOnChain(tenant: string): Promise<boolean> {
      try {
        const { Solva } = await import("@solva/sdk-ts");
        const onChain = await new Solva({ network, tenant }).getOnChainLatestProof();
        return reservesCoverLiabilities(onChain.reservesTotal, onChain.liabilitiesTotal);
      } catch {
        return false;
      }
    },
  };
}
