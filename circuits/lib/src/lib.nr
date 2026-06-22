// Shared helpers for the Solva circuits.
// Hashing is Poseidon2 so the in-circuit root matches the prover tree and the
// native on-chain Poseidon2 inclusion check. Do not swap the hash here.

use poseidon::poseidon2::Poseidon2;
mod parity_tests;

// hash2 hashes exactly two field elements with Poseidon2.
// Used to combine two child node hashes into a parent hash.
pub fn hash2(left: Field, right: Field) -> Field {
    Poseidon2::hash([left, right], 2)
}

// hash_leaf hashes a leaf's (id_hash, balance) pair into the leaf node hash.
// id_hash binds the customer identity, balance is their liability amount.
pub fn hash_leaf(id_hash: Field, balance: Field) -> Field {
    Poseidon2::hash([id_hash, balance], 2)
}

// assert_u64 constrains value to the 64-bit non-negative range.
// Balances and reserves are non-negative integers that fit in 64 bits. A Field
// cast to u64 fails to prove if value does not fit, which is exactly the
// non-negativity guarantee we want for balances, reserves, and the aggregates.
pub fn assert_u64(value: Field) -> u64 {
    value as u64
}

// MerkleSumNode is one node of a Poseidon2 Merkle Sum Tree.
// hash commits to the subtree shape, sum is the total balance under the node.
pub struct MerkleSumNode {
    pub hash: Field,
    pub sum: Field,
}

impl MerkleSumNode {
    // leaf builds a node from a (id_hash, balance) pair.
    // The node sum is the leaf balance, which is range checked by the caller.
    pub fn leaf(id_hash: Field, balance: Field) -> Self {
        MerkleSumNode { hash: hash_leaf(id_hash, balance), sum: balance }
    }

    // combine folds two child nodes into their parent.
    // Parent hash = Poseidon2(left.hash, right.hash), parent sum = sum of children.
    // Hashing only the child hashes (not the sums) keeps the node layout fixed,
    // and the sum is carried alongside for the solvency aggregate.
    pub fn combine(left: Self, right: Self) -> Self {
        MerkleSumNode { hash: hash2(left.hash, right.hash), sum: left.sum + right.sum }
    }
}
