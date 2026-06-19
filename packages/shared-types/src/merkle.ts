// Merkle Sum Tree types. The tree commits liabilities so a customer can prove
// inclusion without revealing other balances. Each node carries a running sum,
// which is how the circuit binds the liability total to the root.

/** A node in the serialized Poseidon2 Merkle Sum Tree. */
export interface MerkleTreeNode {
  /** Poseidon2 hash of this node, hex. */
  hash: string;
  /** Subtree liability sum in integer minor units, decimal string. */
  sum: string;
  /** Child nodes, empty for leaves. */
  children?: MerkleTreeNode[];
}

/**
 * One step on the inclusion path: a sibling node plus which side it sits on.
 * The contract recomputes the root from a leaf and its path.
 */
export interface PathNode {
  /** Sibling hash, hex. */
  hash: string;
  /** Sibling subtree sum, decimal string. */
  sum: string;
  /** Side of the sibling relative to the path. */
  position: "left" | "right";
}

/**
 * A reference a customer pastes into the inclusion checker. It carries enough
 * to call verify_inclusion on-chain: the proof ID, the leaf, and the path.
 */
export interface InclusionRef {
  /** Proof ID the customer is checking against. */
  proofId: string;
  /** Poseidon2 hash of the customer reference, hex. */
  customerIdHash: string;
  /** Committed balance in integer minor units, decimal string. */
  balance: string;
  /** Path from the leaf up to the root. */
  path: PathNode[];
}
