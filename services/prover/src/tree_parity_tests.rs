#[cfg(test)]
mod parity_tests {
    use crate::tree::{
        fr_to_bytes, permutation, poseidon2_hash_two, FieldElem, MerkleSumTree, Node, PathStep,
    };
    use ark_bn254::Fr;
    use ark_ff::Zero;

    fn fe_from_decimal(s: &str) -> FieldElem {
        use num_bigint::BigUint;
        use std::str::FromStr;
        let n = BigUint::from_str(s).unwrap_or_else(|_| panic!("bad decimal: {s}"));
        let b = n.to_bytes_be();
        assert!(b.len() <= 32, "overflows field: {s}");
        let mut out = [0u8; 32];
        out[32 - b.len()..].copy_from_slice(&b);
        out
    }

    fn fe_from_hex(hex: &str) -> FieldElem {
        let hex = hex.trim_start_matches("0x");
        let b = hex::decode(hex).unwrap_or_else(|_| panic!("bad hex: {hex}"));
        assert!(b.len() <= 32);
        let mut out = [0u8; 32];
        out[32 - b.len()..].copy_from_slice(&b);
        out
    }

    // Load expected values from the committed JSON file at compile time.
    // Relative to services/prover/src/ -> up three levels to repo root.
    const JSON: &str = include_str!("../../../test-vectors/poseidon2_parity.json");

    fn expected_hex(id: &str) -> FieldElem {
        let tag = format!("\"id\": \"{id}\"");
        let pos = JSON
            .find(&tag)
            .unwrap_or_else(|| panic!("vector {id} not in JSON"));
        let after = &JSON[pos..];
        let key = "\"expected_hex\": \"";
        let s = after
            .find(key)
            .unwrap_or_else(|| panic!("no expected_hex for {id}"))
            + key.len();
        let e = after[s..]
            .find('"')
            .unwrap_or_else(|| panic!("unterminated for {id}"));
        fe_from_hex(&after[s..s + e])
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

    #[test]
    fn poseidon2_parity_v0_zero_zero() {
        assert_eq!(
            poseidon2_hash_two([0u8; 32], [0u8; 32]),
            expected_hex("v0_zero_zero"),
            "parity v0: hash_two(0,0) mismatch"
        );
    }

    #[test]
    fn poseidon2_parity_v1_one_zero() {
        assert_eq!(
            poseidon2_hash_two(fe_from_decimal("1"), [0u8; 32]),
            expected_hex("v1_one_zero"),
            "parity v1: hash_two(1,0) mismatch"
        );
    }

    #[test]
    fn poseidon2_parity_v2_zero_one() {
        assert_eq!(
            poseidon2_hash_two([0u8; 32], fe_from_decimal("1")),
            expected_hex("v2_zero_one"),
            "parity v2: hash_two(0,1) mismatch"
        );
    }

    #[test]
    fn poseidon2_parity_v3_realistic_leaf() {
        // id_hash = SHA-256("customer-0001") mod p
        let id_hash = fe_from_decimal(
            "3911146184957771170533462677490463864027325414938019701220093847937035118375",
        );
        assert_eq!(
            poseidon2_hash_two(id_hash, fe_from_decimal("1000000")),
            expected_hex("v3_realistic_leaf"),
            "parity v3: hash_two(id_hash, balance) mismatch"
        );
    }

    #[test]
    fn poseidon2_parity_order_sensitivity() {
        let one = fe_from_decimal("1");
        let two = fe_from_decimal("2");
        assert_ne!(
            poseidon2_hash_two(one, two),
            poseidon2_hash_two(two, one),
            "parity: hash_two is commutative, which is wrong"
        );
    }

    // Tree determinism tests
    // The same leaf set must always produce the same root. This catches any
    // non-determinism in leaf ordering or the hash function.

    fn make_leaf(balance: u128) -> crate::tree::Node {
        use ark_ff::Zero;
        let balance_bytes = fr_to_bytes(ark_bn254::Fr::from(balance));
        crate::tree::Node {
            hash: poseidon2_hash_two(balance_bytes, fr_to_bytes(ark_bn254::Fr::zero())),
            sum: balance,
        }
    }

    #[test]
    fn tree_determinism_same_root() {
        // Build the same tree twice; roots must be identical.
        let balances = [100u128, 200, 300, 400];
        let leaves_a: Vec<_> = balances.iter().map(|&b| make_leaf(b)).collect();
        let leaves_b: Vec<_> = balances.iter().map(|&b| make_leaf(b)).collect();

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
        // Reordering leaves must change the root (the tree is order-sensitive).
        let leaves_fwd: Vec<_> = [100u128, 200].iter().map(|&b| make_leaf(b)).collect();
        let leaves_rev: Vec<_> = [200u128, 100].iter().map(|&b| make_leaf(b)).collect();

        let root_fwd = MerkleSumTree::build(leaves_fwd).root();
        let root_rev = MerkleSumTree::build(leaves_rev).root();

        assert_ne!(
            root_fwd, root_rev,
            "determinism: different leaf order produced the same root"
        );
    }

    #[test]
    fn tree_root_sum_equals_total_balance() {
        let balances = [100u128, 200, 300, 400];
        let leaves: Vec<_> = balances.iter().map(|&b| make_leaf(b)).collect();
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
    // the tree root. This is the same fold the circuit's verify_inclusion
    // performs.

    // Recomputes the root from a leaf node and the sibling path.
    // Mirrors circuits/merkle/src/lib.nr verify_inclusion.
    fn recompute_root(leaf: &Node, path: &[PathStep]) -> crate::tree::Node {
        let mut node = leaf.clone();
        for step in path {
            let (left, right) = if step.sibling_is_left {
                (&step.sibling, &node)
            } else {
                (&node, &step.sibling)
            };
            node = Node {
                hash: poseidon2_hash_two(left.hash, right.hash),
                sum: left.sum + right.sum,
            };
        }
        node
    }

    #[test]
    fn inclusion_path_all_leaves_reach_root() {
        // Four-leaf tree (power of two, matching the circuit's expected shape).
        let balances = [111u128, 222, 333, 444];
        let leaves: Vec<_> = balances.iter().map(|&b| make_leaf(b)).collect();
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
        // Minimal two-leaf case: DEPTH=1 path, one sibling step.
        let leaves: Vec<_> = [500u128, 600].iter().map(|&b| make_leaf(b)).collect();
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

    #[test]
    fn inclusion_path_parity_with_circuit_vector() {
        // Cross-check against a known root computed the same way the circuit
        // would. We build a two-leaf tree with balances [1, 2] and verify:
        //   leaf_0.hash = hash_two(fr(1), fr(0))   -- hash_two(balance, 0)
        //   leaf_1.hash = hash_two(fr(2), fr(0))
        //   root.hash   = hash_two(leaf_0.hash, leaf_1.hash)
        use ark_ff::Zero;

        let b0 = fr_to_bytes(ark_bn254::Fr::from(1u64));
        let b1 = fr_to_bytes(ark_bn254::Fr::from(2u64));
        let zero = fr_to_bytes(ark_bn254::Fr::zero());

        let leaf0_hash = poseidon2_hash_two(b0, zero);
        let leaf1_hash = poseidon2_hash_two(b1, zero);
        let expected_root_hash = poseidon2_hash_two(leaf0_hash, leaf1_hash);

        let leaves = vec![
            crate::tree::Node {
                hash: leaf0_hash,
                sum: 1,
            },
            crate::tree::Node {
                hash: leaf1_hash,
                sum: 2,
            },
        ];
        let tree = MerkleSumTree::build(leaves.clone());

        assert_eq!(
            tree.root().hash,
            expected_root_hash,
            "tree root does not match manually computed poseidon2(leaf0, leaf1)"
        );

        // Both inclusion paths must reconstruct that same root.
        for (i, leaf) in leaves.iter().enumerate() {
            let path = tree.inclusion_path(i);
            let recomputed = recompute_root(leaf, &path);
            assert_eq!(
                recomputed.hash, expected_root_hash,
                "inclusion path for leaf {i} diverges from manually computed root"
            );
        }
    }
}
