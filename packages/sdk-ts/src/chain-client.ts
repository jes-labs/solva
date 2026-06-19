// On-chain reads against the proof-registry contract. Inclusion is checked on
// the chain, not through the orchestrator, so a customer can verify it against
// the public ledger without trusting the institution's API.

import type { InclusionRef, InclusionResult } from "@solva/shared-types";
import { ChainError } from "./errors.js";

export interface ChainClientOptions {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
}

export class ChainClient {
  constructor(private readonly options: ChainClientOptions) {}

  /**
   * Verify a customer's inclusion in the committed Merkle Sum Tree by calling
   * verify_inclusion on the proof-registry contract.
   *
   * This is a stub. The real implementation builds a Soroban simulate call with
   * @stellar/stellar-sdk and the generated bindings, roughly:
   *
   *   import { Contract, rpc, scValToNative } from "@stellar/stellar-sdk";
   *   const server = new rpc.Server(this.options.rpcUrl);
   *   const contract = new Contract(this.options.contractId);
   *   const op = contract.call("verify_inclusion", ...scvalArgs(ref));
   *   const sim = await server.simulateTransaction(buildTx(op));
   *   return { included: scValToNative(sim.result.retval), proofId: ref.proofId };
   *
   * stellar-sdk is a peer dependency and the import is kept out of the build
   * until the bindings exist, so this package typechecks in a clean tree.
   */
  async verifyInclusion(ref: InclusionRef): Promise<InclusionResult> {
    if (!this.options.contractId) {
      throw new ChainError("no contractId configured for inclusion check");
    }
    // Typed placeholder result. Replace with the simulate call above.
    return { included: false, proofId: ref.proofId };
  }
}
