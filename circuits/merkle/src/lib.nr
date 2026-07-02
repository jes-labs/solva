// Poseidon2 Merkle Sum Tree: root computation and single-leaf inclusion.
//
// Leaf encoding: each leaf commits to one customer as (id_hash, balance).
//   id_hash  = Poseidon2 commitment to the customer identifier (built off-circuit).
//   balance  = that customer's liability amount, a non-negative 64-bit integer.
// A leaf node is { hash = hash4([id_hash, balance, 0, 0]), sum = balance }.
//
// Internal node: parent = { hash = hash4([left.hash, left.sum, right.hash, right.sum]),
//                           sum  = left.sum + right.sum }.
// The root sum is the total liability L; the root hash is root_h.

use solva_lib::{assert_u64, hash4, MerkleSumNode};

// PathNode is one sibling along an inclusion path.
// In a sum tree the sibling carries both its hash and its subtree sum, since
// the parent sum needs the sibling sum. is_right says the sibling sits on the
// right of the node we are proving (so our node is the left child).
pub struct PathNode {
    pub hash: Field,
    pub sum: Field,
    pub is_right: bool,
}

// compute_root builds the full Merkle Sum Tree root from N leaf balances.
// id_hashes and balances are aligned by index. N must be a power of two so the
// tree is complete and DEPTH must equal log2(N). The caller supplies DEPTH as a
// const generic because Noir loop bounds must be known at compile time. The
// returned node holds the root hash and the total balance L.
pub fn compute_root<let N: u32, let DEPTH: u32>(
    id_hashes: [Field; N],
    balances: [Field; N],
) -> MerkleSumNode {
    // Build the leaf layer. Range check each balance so sums cannot overflow
    // via a wrapped negative Field value.
    let mut layer: [MerkleSumNode; N] = [MerkleSumNode { hash: 0, sum: 0 }; N];
    for i in 0..N {
        let _ = assert_u64(balances[i]);
        let leaf_hash = hash4([id_hashes[i], balances[i], 0, 0]);
        layer[i] = MerkleSumNode { hash: leaf_hash, sum: balances[i] };
    }

    // Fold pairs upward over DEPTH rounds, halving the active width each round
    // until one node remains. width tracks how many nodes are live at the front
    // of layer; once width reaches one the remaining rounds are no-ops.
    let mut width = N;
    for _ in 0..DEPTH {
        let half = width / 2;
        // next holds the parents for this round. Build it fully, then copy back.
        // Reads use guarded indices so they never run past the live front, which
        // keeps every array access in bounds regardless of j.
        let mut next: [MerkleSumNode; N] = layer;
        for j in 0..N {
            // Clamp child indices into range so the read is always in bounds.
            // For live j (j < half) the clamp is a no-op since 2*j+1 < width <= N;
            // for dead j it just reads a stale node whose result we discard.
            let li = if 2 * j < N { 2 * j } else { N - 1 };
            let ri = if 2 * j + 1 < N { 2 * j + 1 } else { N - 1 };
            if j < half {
                next[j] = MerkleSumNode::combine(layer[li], layer[ri]);
            }
        }
        layer = next;
        width = half;
    }

    layer[0]
}

// verify_inclusion recomputes the root from one leaf and its sibling path,
// then checks it against the expected root hash and root sum.
// This is the same fold the on-chain Poseidon2 inclusion check performs.
pub fn verify_inclusion<let DEPTH: u32>(
    id_hash: Field,
    balance: Field,
    path: [PathNode; DEPTH],
    expected_root_hash: Field,
    expected_root_sum: Field,
) {
    let _ = assert_u64(balance);
    let leaf_hash = hash4([id_hash, balance, 0, 0]);
    let mut node = MerkleSumNode { hash: leaf_hash, sum: balance };

    for i in 0..DEPTH {
        let sibling = MerkleSumNode { hash: path[i].hash, sum: path[i].sum };
        // Order the combine by which side the sibling is on, then climb.
        if path[i].is_right {
            node = MerkleSumNode::combine(node, sibling);
        } else {
            node = MerkleSumNode::combine(sibling, node);
        }
    }

    assert(node.hash == expected_root_hash, "inclusion hash mismatch");
    assert(node.sum == expected_root_sum, "inclusion sum mismatch");
}

// --- Unit Tests ---

#[test]
fn test_compute_root_and_verify_inclusion_passes() {
    // Setup a 4-leaf complete Merkle Sum Tree (N=4, DEPTH=2)
    let ids: [Field; 4] = [1, 2, 3, 4];
    let balances: [Field; 4] = [10, 20, 30, 40]; // Total = 100

    // Compute full tree root
    let root = compute_root::<4, 2>(ids, balances);
    assert(root.sum == 100, "root sum total error");

    // Manually reconstruct sibling paths to verify index 0 (balance: 10)
    // Sibling 1: index 1 (balance: 20)
    let leaf_1_hash = hash4([2, 20, 0, 0]);
    let p0 = PathNode { hash: leaf_1_hash, sum: 20, is_right: true };

    // Sibling 2: parent node of index 2 & 3
    let leaf_2_hash = hash4([3, 30, 0, 0]);
    let leaf_3_hash = hash4([4, 40, 0, 0]);
    let right_parent = MerkleSumNode::combine(
        MerkleSumNode { hash: leaf_2_hash, sum: 30 },
        MerkleSumNode { hash: leaf_3_hash, sum: 40 }
    );
    let p1 = PathNode { hash: right_parent.hash, sum: right_parent.sum, is_right: true };

    let path: [PathNode; 2] = [p0, p1];

    // Assert that the verified path matches the tree computation root
    verify_inclusion::<2>(1, 10, path, root.hash, root.sum);
}

#[test(should_fail_with = "inclusion sum mismatch")]
fn test_verify_inclusion_fails_on_tampered_balance() {
    let ids: [Field; 4] = [1, 2, 3, 4];
    let balances: [Field; 4] = [10, 20, 30, 40];

    let root = compute_root::<4, 2>(ids, balances);

    // Keep the entire sibling path structurally valid so that the recomputed
    // root hash matches perfectly.
    let leaf_1_hash = hash4([2, 20, 0, 0]);
    let p0 = PathNode { hash: leaf_1_hash, sum: 20, is_right: true };

    let leaf_2_hash = hash4([3, 30, 0, 0]);
    let leaf_3_hash = hash4([4, 40, 0, 0]);
    let right_parent = MerkleSumNode::combine(
        MerkleSumNode { hash: leaf_2_hash, sum: 30 },
        MerkleSumNode { hash: leaf_3_hash, sum: 40 }
    );
    let p1 = PathNode { hash: right_parent.hash, sum: right_parent.sum, is_right: true };
    let path: [PathNode; 2] = [p0, p1];

    // Pass an incorrect expected root liability sum (e.g., 999 instead of 100).
    // This forces the circuit to successfully verify the hash path but fail on the sum.
    verify_inclusion::<2>(1, 10, path, root.hash, 999);
}
