// Poseidon2 Merkle Sum Tree: root computation and single-leaf inclusion.
//
// Leaf encoding: each leaf commits to one customer as (id_hash, balance).
//   id_hash  = Poseidon2 commitment to the customer identifier (built off-circuit).
//   balance  = that customer's liability amount, a non-negative 64-bit integer.
// A leaf node is { hash = Poseidon2(id_hash, balance), sum = balance }.
//
// Internal node: parent = { hash = Poseidon2(left.hash, right.hash),
//                           sum  = left.sum + right.sum }.
// The root sum is the total liability L; the root hash is root_h.

use solva_lib::{assert_u64, MerkleSumNode};

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
        layer[i] = MerkleSumNode::leaf(id_hashes[i], balances[i]);
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
    let mut node = MerkleSumNode::leaf(id_hash, balance);

    for i in 0..DEPTH {
        let sibling = MerkleSumNode { hash: path[i].hash, sum: path[i].sum };
        // Order the combine by which side the sibling is on, then climb.
        if path[i].is_right {
            node = MerkleSumNode::combine(node, sibling);
        } else {
            node = MerkleSumNode::combine(sibling, node);
        }
    }

    assert(node.hash == expected_root_hash);
    assert(node.sum == expected_root_sum);
}
