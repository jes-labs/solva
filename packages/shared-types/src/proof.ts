// Types that mirror proto/prover.proto. All monetary and field values are
// decimal or hex strings, never numbers, so we never lose precision to floats.

/** A single customer liability committed into the Merkle Sum Tree. */
export interface Liability {
  /** Poseidon2 hash of the external customer reference, hex. */
  customerIdHash: string;
  /** Balance in integer minor units, decimal string. */
  balance: string;
}

/** A single reserve figure attested by a bank or on-chain source. */
export interface Reserve {
  sourceId: string;
  /** Balance in integer minor units, decimal string. */
  balance: string;
}

/**
 * Values exposed on-chain by a published proof. Everything else stays private.
 * Maps to proto PublicInputs.
 */
export interface PublicInputs {
  /** R, total reserves, decimal string. */
  reservesTotal: string;
  /** L, total liabilities, decimal string. */
  liabilitiesTotal: string;
  /** root_h, Poseidon2 sum-tree root, hex. */
  rootHash: string;
  /** R_prev, previous cycle reserve total, used for the fraud bound. */
  prevReserves: string;
}

/**
 * A published proof as the SDK and web app see it. The proof bytes are the
 * serialized UltraHonk proof, base64 encoded for transport over REST.
 */
export interface Proof {
  /** Monotonic on-chain proof ID. */
  id: string;
  /** Base64 of the serialized UltraHonk proof. */
  proof: string;
  publicInputs: PublicInputs;
  /** Unix epoch seconds when the proof was published on-chain. */
  publishedAt: number;
}
