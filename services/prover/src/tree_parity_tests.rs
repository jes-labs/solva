#[cfg(test)]
mod parity_tests {
    use crate::tree::{
        fr_to_bytes, permutation, poseidon2_hash_four, FieldElem, MerkleSumTree, Node, PathStep,
    };
    use ark_bn254::Fr;
    use ark_ff::Zero;

    fn fe_from_hex(hex: &str) -> FieldElem {
        let hex = hex.trim_start_matches("0x");
        let b = hex::decode(hex).unwrap_or_else(|_| panic!("bad hex: {hex}"));
        assert!(b.len() <= 32);
        let mut out = [0u8; 32];
        out[32 - b.len()..].copy_from_slice(&b);
        out
    }

    fn id(n: u128) -> FieldElem {
        fr_to_bytes(Fr::from(n))
    }

    // Smoke test: permute [0,0,0,0] and check state[0].
    // Expected value from Noir's own bn254_blackbox_solver test suite.
    // If this fails, the round constants or matrix are wrong.
    #[test]
    fn poseidon2_parity_permutation_smoke() {
        let mut s = [Fr::zero(); 4];
        permutation(&mut s);
        assert_eq!(
            fr_to_bytes(s[0]),
            fe_from_hex("18DFB8DC9B82229CFF974EFEFC8DF78B1CE96D9D844236B496785C698BC6732E"),
            "permutation smoke failed: round constants or matrix are wrong"
        );
    }

    // Tree determinism tests
    // The same leaf set must always produce the same root. This catches any
    // non-determinism in leaf ordering or the hash function.

    fn make_leaf(id_n: u128, balance: u128) -> Node {
        Node::leaf(id(id_n), balance)
    }

    #[test]
    fn tree_determinism_same_root() {
        let leaves_a: Vec<_> = (1..=4).map(|i| make_leaf(i, i * 100)).collect();
        let leaves_b: Vec<_> = (1..=4).map(|i| make_leaf(i, i * 100)).collect();

        let tree_a = MerkleSumTree::build(leaves_a);
        let tree_b = MerkleSumTree::build(leaves_b);

        assert_eq!(
            tree_a.root(),
            tree_b.root(),
            "determinism: same leaves produced different roots"
        );
    }

    #[test]
    fn tree_determinism_different_order_changes_root() {
        let fwd: Vec<_> = [(1u128, 100u128), (2, 200)]
            .iter()
            .map(|&(i, b)| make_leaf(i, b))
            .collect();
        let rev: Vec<_> = [(2u128, 200u128), (1, 100)]
            .iter()
            .map(|&(i, b)| make_leaf(i, b))
            .collect();

        assert_ne!(
            MerkleSumTree::build(fwd).root(),
            MerkleSumTree::build(rev).root(),
            "determinism: different leaf order produced the same root"
        );
    }

    #[test]
    fn tree_root_sum_equals_total_balance() {
        let leaves: Vec<_> = (1..=4).map(|i| make_leaf(i, i * 100)).collect();
        let tree = MerkleSumTree::build(leaves);
        assert_eq!(
            tree.root().sum,
            1000,
            "root sum must equal the sum of all leaf balances"
        );
    }

    // Inclusion path tests
    //
    // For each leaf, walk the inclusion path returned by inclusion_path(i) and
    // check that recomputing the root from that leaf and its siblings matches
    // the tree root. This is the same fold the contract's verify_inclusion does:
    // hash4([left.hash, left.sum, right.hash, right.sum]).
    fn recompute_root(leaf: &Node, path: &[PathStep]) -> Node {
        let mut node = leaf.clone();
        for step in path {
            let (left, right) = if step.sibling_is_left {
                (&step.sibling, &node)
            } else {
                (&node, &step.sibling)
            };
            node = Node {
                hash: poseidon2_hash_four(
                    left.hash,
                    fr_to_bytes(Fr::from(left.sum)),
                    right.hash,
                    fr_to_bytes(Fr::from(right.sum)),
                ),
                sum: left.sum + right.sum,
            };
        }
        node
    }

    #[test]
    fn inclusion_path_all_leaves_reach_root() {
        let leaves: Vec<_> = (1..=4).map(|i| make_leaf(i, i * 111)).collect();
        let tree = MerkleSumTree::build(leaves.clone());
        let expected_root = tree.root();

        for (i, leaf) in leaves.iter().enumerate() {
            let path = tree.inclusion_path(i);
            let recomputed = recompute_root(leaf, &path);
            assert_eq!(
                recomputed.hash, expected_root.hash,
                "inclusion path for leaf {i} does not reach the correct root hash"
            );
            assert_eq!(
                recomputed.sum, expected_root.sum,
                "inclusion path for leaf {i} does not reach the correct root sum"
            );
        }
    }

    #[test]
    fn inclusion_path_two_leaves() {
        let leaves: Vec<_> = [(1u128, 500u128), (2, 600)]
            .iter()
            .map(|&(i, b)| make_leaf(i, b))
            .collect();
        let tree = MerkleSumTree::build(leaves.clone());
        let root = tree.root();

        for (i, leaf) in leaves.iter().enumerate() {
            let path = tree.inclusion_path(i);
            assert_eq!(path.len(), 1, "depth-1 tree must have path length 1");
            let recomputed = recompute_root(leaf, &path);
            assert_eq!(
                recomputed.hash, root.hash,
                "two-leaf inclusion path for leaf {i} gives wrong root hash"
            );
        }
    }
}
