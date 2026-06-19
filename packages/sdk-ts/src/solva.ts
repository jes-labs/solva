// The primary SDK entry point. Composes the orchestrator REST client and the
// on-chain client behind the small surface from the PRD.

import type { Proof, InclusionRef, InclusionResult } from "@solva/shared-types";
import { resolveConfig, type SolvaConfig } from "./config.js";
import { OrchestratorClient, type BankSourceConfig } from "./orchestrator-client.js";
import { ChainClient } from "./chain-client.js";

export class Solva {
  private readonly orchestrator: OrchestratorClient;
  private readonly chain: ChainClient;

  constructor(config: SolvaConfig) {
    const resolved = resolveConfig(config);
    this.orchestrator = new OrchestratorClient(
      resolved.endpoints.orchestratorUrl,
      resolved.tenant,
      resolved.apiKey,
    );
    this.chain = new ChainClient({
      rpcUrl: resolved.endpoints.rpcUrl,
      networkPassphrase: resolved.endpoints.networkPassphrase,
      contractId: resolved.endpoints.contractId,
    });
  }

  /** Connect a reserve source. Returns the new source id. */
  connectSource(config: BankSourceConfig): Promise<string> {
    return this.orchestrator.connectSource(config);
  }

  /** Run a full proof cycle. Returns the published proof id. */
  runProofCycle(): Promise<string> {
    return this.orchestrator.runProofCycle();
  }

  /** Get the latest published proof. */
  getLatestProof(): Promise<Proof> {
    return this.orchestrator.getLatestProof();
  }

  /** Get a proof by id. */
  getProof(id: string): Promise<Proof> {
    return this.orchestrator.getProof(id);
  }

  /**
   * Verify a customer's inclusion on-chain. Accepts either a full InclusionRef
   * or a reference string, which is resolved through the orchestrator first.
   */
  async verifyInclusion(ref: InclusionRef | string): Promise<InclusionResult> {
    const resolved =
      typeof ref === "string" ? await this.orchestrator.getInclusionRef(ref) : ref;
    return this.chain.verifyInclusion(resolved);
  }
}
