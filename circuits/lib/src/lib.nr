// Solva Shared Library Helpers (PRD 2, section 5.1).
//
// Provides core arithmetic and cryptographic primitives used across all
// circuits, including 64-bit range checks and Poseidon2 Merkle Sum Tree nodes.

// Asserts that a Field element fits within a 64-bit unsigned integer.
// Returns the value cast to u64 for safe unsigned arithmetic operations.
pub fn assert_u64(val: Field) -> u64 {
    let val_u64 = val as u64;
    assert(val == val_u64 as Field, "range check failed: value exceeds u64");
    val_u64
}

// Wraps the native Noir Poseidon implementation for a 4-element inputs array.
// This matches the structural requirements for a 2-child Merkle Sum Tree node.
use dep::poseidon::poseidon::bn254;

pub fn hash4(inputs: [Field; 4]) -> Field {
    bn254::hash_4(inputs)
}

// Represents a single node in the Merkle Sum Tree.
pub struct MerkleSumNode {
    pub hash: Field,
    pub sum: Field,
}

impl MerkleSumNode {
    // Combines two child nodes into a single parent Merkle Sum Tree node.
    // The parent sum is the exact addition of the left and right child sums.
    // The parent hash binds both child hashes and child sums to prevent fraud.
    pub fn combine(left: MerkleSumNode, right: MerkleSumNode) -> Self {
        let parent_sum = left.sum + right.sum;

        let inputs = [left.hash, left.sum, right.hash, right.sum];
        let parent_hash = hash4(inputs);

        MerkleSumNode {
            hash: parent_hash,
            sum: parent_sum,
        }
    }
}

#[test]
// Verifies that valid 64-bit integers pass the range check wrapper.
fn test_assert_u64_valid() {
    let _ = assert_u64(0);
    let _ = assert_u64(123456789);
    let _ = assert_u64(18446744073709551615); // Max u64
}

#[test(should_fail_with = "range check failed: value exceeds u64")]
// Verifies that a value strictly greater than max u64 fails the range check.
fn test_assert_u64_overflow() {
    let max_u64_plus_one = 18446744073709551616;
    let _ = assert_u64(max_u64_plus_one);
}

#[test]
// Verifies the Poseidon wrapper executes cleanly with a dummy input array.
fn test_hash4_execution() {
    let inputs = [1, 2, 3, 4];
    let h = hash4(inputs);
    assert(h != 0, "hash should be non-zero");
}

#[test]
// Verifies that combining two sum tree nodes updates the total sum and hash.
fn test_node_combine() {
    let left = MerkleSumNode { hash: 100, sum: 50 };
    let right = MerkleSumNode { hash: 200, sum: 70 };

    let parent = MerkleSumNode::combine(left, right);

    // Assert sum balance consistency
    assert(parent.sum == 120, "parent sum must equal left sum plus right sum");

    // Assert cryptographic commitment match
    let expected_hash = hash4([100, 50, 200, 70]);
    assert(parent.hash == expected_hash, "parent hash must match commitment inputs");
}
