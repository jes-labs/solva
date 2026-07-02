// @solva/contract-bindings
//
// Thin, stable wrapper around the generated Soroban bindings for the
// proof-registry contract. Consumers import from here, never from the generated
// directory directly, so a contract regeneration does not ripple through call
// sites.
//
// The generated client lives in ./generated and is produced by
// `just gen-bindings` from the deployed contract. It is committed so the package
// builds without the Stellar CLI or a network connection.

import { Buffer } from "buffer";

import type { PublicInputs, InclusionRef, PathNode } from "@solva/shared-types";

import {
  Client as GeneratedClient,
  type ProofMeta as GeneratedProofMeta,
  type PathNode as GeneratedPathNode,
} from "./generated/dist/index.js";

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
 * Writes (publish_proof) go through the orchestrator, not this client, so they
 * are not part of the read surface.
 */
export interface ProofRegistryClient {
  getLatestProof(): Promise<ProofMeta>;
  getProof(id: string): Promise<ProofMeta>;
  verifyInclusion(ref: InclusionRef): Promise<boolean>;
}

/** Bare hex of a byte buffer, matching the prover's root-hash encoding. */
function bufferToHex(buf: Buffer): string {
  return Buffer.from(buf).toString("hex");
}

/** Parse bare or 0x-prefixed hex into a buffer. */
function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex.replace(/^0x/, ""), "hex");
}

/** Map the contract's ProofMeta (bigints, buffer) to the string read surface. */
function toProofMeta(m: GeneratedProofMeta): ProofMeta {
  return {
    rootHash: bufferToHex(m.root_h),
    reservesTotal: m.r.toString(),
    liabilitiesTotal: m.l.toString(),
    timestamp: Number(m.timestamp),
  };
}

/** Map a shared PathNode to the contract's PathNode shape. */
function toContractPathNode(node: PathNode): GeneratedPathNode {
  return {
    hash: hexToBuffer(node.hash),
    sibling_is_left: node.position === "left",
    sum: BigInt(node.sum),
  };
}

/**
 * Build a typed read client for the proof-registry contract. Each read is a
 * simulated transaction; the unwrapped result is mapped to the stable surface.
 */
export function createProofRegistryClient(
  options: ContractClientOptions,
): ProofRegistryClient {
  const client = new GeneratedClient({
    contractId: options.contractId,
    rpcUrl: options.rpcUrl,
    networkPassphrase: options.networkPassphrase,
  });

  return {
    async getLatestProof() {
      const tx = await client.get_latest_proof();
      return toProofMeta(tx.result.unwrap());
    },
    async getProof(id) {
      const tx = await client.get_proof({ id: BigInt(id) });
      return toProofMeta(tx.result.unwrap());
    },
    async verifyInclusion(ref) {
      const tx = await client.verify_inclusion({
        id: BigInt(ref.proofId),
        id_hash: hexToBuffer(ref.customerIdHash),
        balance: BigInt(ref.balance),
        path: ref.path.map(toContractPathNode),
      });
      return tx.result.unwrap();
    },
  };
}

export type { PublicInputs, InclusionRef };
