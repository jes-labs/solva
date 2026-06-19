// @solva/contract-bindings
//
// Thin, stable wrapper around the generated Soroban bindings for the
// proof-registry contract. Consumers import from here, never from the generated
// directory directly, so a contract regeneration does not ripple through call
// sites.
//
// The generated client lives in ./generated and is produced by
// `just gen-bindings`. That directory is gitignored and regenerated, not
// hand-edited. Once it exists, re-export its `Client` and types here:
//
//   export { Client, type ProofMeta, type PathNode } from "./generated/index.js";
//
// Until then this module exposes the typed factory contract the rest of the
// codebase depends on, so the build does not require the generated output.

import type { PublicInputs, InclusionRef } from "@solva/shared-types";

/** On-chain proof metadata as stored by the proof-registry contract. */
export interface ProofMeta {
  /** Poseidon2 sum-tree root, hex. */
  rootHash: string;
  /** Total reserves R, decimal string. */
  reservesTotal: string;
  /** Total liabilities L, decimal string. */
  liabilitiesTotal: string;
  /** Unix epoch seconds the proof was published. */
  timestamp: number;
}

/** Connection details for the proof-registry contract on a given network. */
export interface ContractClientOptions {
  /** Contract address, for example the deployed proof-registry C... address. */
  contractId: string;
  /** Soroban RPC URL. */
  rpcUrl: string;
  /** Stellar network passphrase, for example "Test SDF Network ; September 2015". */
  networkPassphrase: string;
}

/**
 * The read surface of the proof-registry contract that the SDK and oracle use.
 * The generated client implements this shape. Writes (publish_proof) go through
 * the orchestrator, not this client, so they are not part of the read surface.
 */
export interface ProofRegistryClient {
  getLatestProof(): Promise<ProofMeta>;
  getProof(id: string): Promise<ProofMeta>;
  verifyInclusion(ref: InclusionRef): Promise<boolean>;
}

/**
 * Build a typed client for the proof-registry contract.
 *
 * This is a stub. When the generated bindings exist, swap the body for a call
 * into `new GeneratedClient({ ...options })` and adapt it to ProofRegistryClient.
 * The signature is stable so call sites do not change when that happens.
 */
export function createProofRegistryClient(
  options: ContractClientOptions,
): ProofRegistryClient {
  void options;
  throw new Error(
    "contract-bindings: generated client not present. Run `just gen-bindings`, " +
      "then wire createProofRegistryClient to ./generated.",
  );
}

export type { PublicInputs, InclusionRef };
