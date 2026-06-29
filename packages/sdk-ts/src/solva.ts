// The primary SDK entry point. Composes the orchestrator REST client and the
// on-chain client behind the small surface from the PRD.

import type { ProofMeta } from "@solva/contract-bindings";
import type { Proof, InclusionRef, InclusionResult } from "@solva/shared-types";
import { resolveConfig, type NetworkConfig, type SolvaConfig } from "./config.js";
import { OrchestratorClient, type BankSourceConfig } from "./orchestrator-client.js";
import { ChainClient } from "./chain-client.js";

export class Solva {
  private readonly orchestrator: OrchestratorClient;
  private readonly endpoints: NetworkConfig;
  // Built lazily: the chain client needs the tenant's contract, which is
  // resolved from the orchestrator unless an explicit contractId is configured.
  private chain?: ChainClient;

  constructor(config: SolvaConfig) {
    const resolved = resolveConfig(config);
    this.endpoints = resolved.endpoints;
    this.orchestrator = new OrchestratorClient(
      resolved.endpoints.orchestratorUrl,
      resolved.tenant,
      resolved.apiKey,
    );
  }

  // resolveChain builds the on-chain client for the tenant's contract. An
  // explicit contractId in config wins; otherwise the tenant's contract is
  // resolved from the orchestrator so reads target the tenant's own registry.
  private async resolveChain(): Promise<ChainClient> {
    if (this.chain) return this.chain;
    let contractId = this.endpoints.contractId;
    if (!contractId) {
      contractId = (await this.orchestrator.getTenantContract()).contractId;
    }
    this.chain = new ChainClient({
      rpcUrl: this.endpoints.rpcUrl,
      networkPassphrase: this.endpoints.networkPassphrase,
      contractId,
    });
    return this.chain;
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
   * Read the latest proof directly from the tenant's on-chain contract. Use this
   * for a ledger-backed solvency check, not the orchestrator's cached view.
   */
  async getOnChainLatestProof(): Promise<ProofMeta> {
    const chain = await this.resolveChain();
    return chain.getLatestProof();
  }

  /**
   * Verify a customer's inclusion on-chain. Accepts either a full InclusionRef
   * or a reference string, which is resolved through the orchestrator first.
   */
  async verifyInclusion(ref: InclusionRef | string): Promise<InclusionResult> {
    const resolved =
      typeof ref === "string" ? await this.orchestrator.getInclusionRef(ref) : ref;
    const chain = await this.resolveChain();
    return chain.verifyInclusion(resolved);
  }
}
