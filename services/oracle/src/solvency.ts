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
type OracleNetwork = "testnet" | "mainnet" | "local";

// Endpoint overrides from the environment, so the oracle can point the SDK at a
// local or hosted orchestrator instead of the network default. The institution
// stays a tool argument; these only decide where reads go.
function sdkConfig(network: OracleNetwork, tenant: string) {
  const endpoints: { orchestratorUrl?: string; rpcUrl?: string; contractId?: string } = {};
  if (process.env.SOLVA_ORCHESTRATOR_URL) endpoints.orchestratorUrl = process.env.SOLVA_ORCHESTRATOR_URL;
  if (process.env.SOLVA_RPC_URL) endpoints.rpcUrl = process.env.SOLVA_RPC_URL;
  if (process.env.SOLVA_CONTRACT_ID) endpoints.contractId = process.env.SOLVA_CONTRACT_ID;
  const cfg: { network: OracleNetwork; tenant: string; endpoints?: typeof endpoints; apiKey?: string } = {
    network,
    tenant,
  };
  if (Object.keys(endpoints).length > 0) cfg.endpoints = endpoints;
  if (process.env.SOLVA_API_TOKEN) cfg.apiKey = process.env.SOLVA_API_TOKEN;
  return cfg;
}

export function chainSolvencyDeps(network: OracleNetwork): SolvencyDeps {
  return {
    async getLatestProof(tenant: string): Promise<Proof> {
      const { Solva } = await import("@solva/sdk-ts");
      return new Solva(sdkConfig(network, tenant)).getLatestProof();
    },

    async verifyOnChain(tenant: string): Promise<boolean> {
      try {
        const { Solva } = await import("@solva/sdk-ts");
        const onChain = await new Solva(sdkConfig(network, tenant)).getOnChainLatestProof();
        return reservesCoverLiabilities(onChain.reservesTotal, onChain.liabilitiesTotal);
      } catch {
        return false;
      }
    },
  };
}
