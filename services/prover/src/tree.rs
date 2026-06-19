// Poseidon2 Merkle Sum Tree.
//
// Each node carries a hash and a running sum of the balances beneath it. The
// root commits to both the set of leaves and the total liability L, so the
// circuit can prove L without revealing any single balance.
//
// This module owns the tree side of the ZK-critical path. The hashing here MUST
// use the exact same Poseidon2 parameters as the Noir circuit and the on-chain
// Poseidon2 host function. Any drift breaks soundness silently. See poseidon2().

// A field element placeholder. The real type is the BN254 scalar field element
// from the proving backend. We model it as a 32-byte big-endian value for now so
// the tree shape and API are fixed before the backend is wired in.
pub type Field = [u8; 32];

// One node in the sum tree. `hash` binds the subtree, `sum` accumulates the
// balances below it. Sums use u128 to match the contract's reserve/liability math.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Node {
    pub hash: Field,
    pub sum: u128,
}

// A single sibling step on an inclusion path: the sibling node plus whether it
// sits on the left of the current node.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PathStep {
    pub sibling: Node,
    pub sibling_is_left: bool,
}

// A built tree. Levels are stored bottom up: levels[0] is the leaf row, the last
// level holds the single root.
#[derive(Clone, Debug)]
pub struct MerkleSumTree {
    levels: Vec<Vec<Node>>,
}

impl MerkleSumTree {
    // Builds a full tree from leaf nodes. Leaf count is expected to be a power of
    // two for a fixed-depth tree; callers pad to the circuit's fixed depth before
    // calling. Returns the tree so the root and inclusion paths can be read off.
    pub fn build(leaves: Vec<Node>) -> Self {
        assert!(!leaves.is_empty(), "tree needs at least one leaf");

        let mut levels: Vec<Vec<Node>> = vec![leaves];
        while levels.last().unwrap().len() > 1 {
            let current = levels.last().unwrap();
            let mut parents = Vec::with_capacity(current.len().div_ceil(2));
            for pair in current.chunks(2) {
                let left = &pair[0];
                // Odd row: duplicate the last node so every parent has two children.
                let right = if pair.len() == 2 { &pair[1] } else { &pair[0] };
                parents.push(hash_pair(left, right));
            }
            levels.push(parents);
        }

        Self { levels }
    }

    // The committed root: hash over the whole set and the total sum.
    pub fn root(&self) -> Node {
        self.levels.last().unwrap()[0].clone()
    }

    // The sibling path from a leaf index up to the root. The verifier replays
    // these steps with the same Poseidon2 to recompute and compare the root.
    pub fn inclusion_path(&self, index: usize) -> Vec<PathStep> {
        let leaf_count = self.levels[0].len();
        assert!(index < leaf_count, "leaf index out of range");

        let mut path = Vec::with_capacity(self.levels.len() - 1);
        let mut idx = index;
        for level in &self.levels[..self.levels.len() - 1] {
            let is_right = idx % 2 == 1;
            let sibling_idx = if is_right { idx - 1 } else { idx + 1 };
            // On an odd row the right edge has no sibling, so it pairs with itself.
            let sibling = level.get(sibling_idx).unwrap_or(&level[idx]).clone();
            path.push(PathStep {
                sibling,
                sibling_is_left: is_right,
            });
            idx /= 2;
        }
        path
    }
}

// Combines two child nodes into their parent. The sum is the children's totals.
// The hash binds both child hashes and the child sums.
fn hash_pair(left: &Node, right: &Node) -> Node {
    let sum = left.sum.saturating_add(right.sum);
    let hash = poseidon2(&[left.hash, right.hash, field_from_u128(left.sum), field_from_u128(right.sum)]);
    Node { hash, sum }
}

// STUB. The real Poseidon2 permutation over the BN254 scalar field.
//
// This must be instantiated with the SAME Poseidon2 parameters (field, t/width,
// round counts, MDS matrix, round constants) as:
//   1. the Noir solvency/Merkle circuit, and
//   2. the Stellar native Poseidon2 host function (CAP-0075) the contract calls.
//
// We do not invent parameters here. They come from the chosen Noir Poseidon2
// instance and must be cross-checked on testnet before this stub is replaced.
// Wired in the proving issue alongside the bb backend.
fn poseidon2(_inputs: &[Field]) -> Field {
    unimplemented!("Poseidon2 parameters must match the Noir circuit and the Stellar host function")
}

// Encodes a u128 sum as a field-sized big-endian value for hashing.
fn field_from_u128(value: u128) -> Field {
    let mut out = [0u8; 32];
    out[16..].copy_from_slice(&value.to_be_bytes());
    out
}
