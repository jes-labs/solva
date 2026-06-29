// On-chain reads against the proof-registry contract. Inclusion is checked on
// the chain, not through the orchestrator, so a customer can verify it against
// the public ledger without trusting the institution's API.

import {
  createProofRegistryClient,
  type ProofMeta,
  type ProofRegistryClient,
} from "@solva/contract-bindings";
import type { InclusionRef, InclusionResult } from "@solva/shared-types";
import { ChainError } from "./errors.js";

export interface ChainClientOptions {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
}

export class ChainClient {
  private readonly registry: ProofRegistryClient;

  constructor(options: ChainClientOptions) {
    if (!options.contractId) {
      throw new ChainError("no contractId configured for chain reads");
    }
    this.registry = createProofRegistryClient({
      contractId: options.contractId,
      rpcUrl: options.rpcUrl,
      networkPassphrase: options.networkPassphrase,
    });
  }

  /**
   * Verify a customer's inclusion in the committed Merkle Sum Tree by calling
   * verify_inclusion on the proof-registry contract. The contract recomputes
   * the root from the leaf and path and compares it to the published root, so a
   * true result is a ledger-backed fact, not the institution's word.
   */
  async verifyInclusion(ref: InclusionRef): Promise<InclusionResult> {
    try {
      const included = await this.registry.verifyInclusion(ref);
      return { included, proofId: ref.proofId };
    } catch (cause) {
      throw new ChainError("verify_inclusion call failed", { cause });
    }
  }

  /** Read the latest proof recorded on the contract (an on-chain read). */
  async getLatestProof(): Promise<ProofMeta> {
    try {
      return await this.registry.getLatestProof();
    } catch (cause) {
      throw new ChainError("get_latest_proof call failed", { cause });
    }
  }
}
