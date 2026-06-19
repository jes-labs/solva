// Solva solvency circuit (PRD 2, section 5.1).
//
// Proves an institution holds enough reserves to cover its liabilities, that
// the published commitment is well formed, and that reserves did not jump by
// more than the allowed fraud bound since the previous cycle.
//
// Hashing is Poseidon2 throughout so root_h matches the prover tree and the
// native on-chain Poseidon2 inclusion check.

use solva_lib::assert_u64;
use solva_merkle::compute_root;

// Tree and reserve sizes are fixed at compile time. These are demo values.
// N must be a power of two (complete tree); DEPTH = log2(N).
global N: u32 = 8; // number of customer leaves
global DEPTH: u32 = 3; // tree depth, log2(N)
global M: u32 = 4; // number of reserve figures

// Note on the PRD shape: a leaf is (id_hash, balance), so the well-formed root
// needs the id_hashes as well. leaf_ids[N] is added as a private input. The
// merkle_paths input is kept for interface fidelity; for a complete tree the
// root is recomputed directly from all leaves, which subsumes per-leaf paths.
fn main(
    R: pub Field, // total reserves, public
    root_h: pub Field, // published Merkle Sum Tree root hash, public
    L: pub Field, // total liabilities, public
    R_prev: pub Field, // previous cycle reserves, public
    leaf_ids: [Field; N], // per-customer id_hash, private
    leaf_balances: [Field; N], // per-customer balance, private
    merkle_paths: [[Field; DEPTH]; N], // sibling hashes per leaf, private
    reserves: [Field; M], // individual reserve figures, private
) {
    // Touch merkle_paths so the declared interface input is bound. The complete
    // tree recompute below is the authoritative commitment check.
    let _ = merkle_paths;

    // Range check the public aggregates as non-negative 64-bit integers.
    let r_u64 = assert_u64(R);
    let l_u64 = assert_u64(L);
    let _ = assert_u64(R_prev);

    // 1. Solvency: R - L >= 0.
    // Done as an unsigned compare on the range-checked u64 values, which is the
    // correct Noir way to assert non-negativity without underflow tricks.
    assert(r_u64 >= l_u64, "insolvent: reserves below liabilities");

    // 2. Commitment well-formedness: the Poseidon2 sum-tree root computed from
    // the leaves equals root_h, and its sum equals L.
    let root = compute_root::<N, DEPTH>(leaf_ids, leaf_balances);
    assert(root.hash == root_h, "root hash mismatch");
    assert(root.sum == L, "root sum does not equal L");

    // 3. Sum consistency: sum of leaf balances equals L.
    // Each balance is range checked before being added.
    let mut liabilities_total: Field = 0;
    for i in 0..N {
        let _ = assert_u64(leaf_balances[i]);
        liabilities_total += leaf_balances[i];
    }
    assert(liabilities_total == L, "leaf balance sum does not equal L");

    // 4. Reserve total: sum of reserve figures equals R.
    let mut reserves_total: Field = 0;
    for i in 0..M {
        let _ = assert_u64(reserves[i]);
        reserves_total += reserves[i];
    }
    assert(reserves_total == R, "reserve sum does not equal R");

    // 5. Fraud bound: R <= floor(1.1 * R_prev).
    // Integer math only: floor(1.1 * R_prev) = floor(11 * R_prev / 10), and
    // R <= floor(x/10) is equivalent to 10*R <= 11*R_prev over non-negative
    // integers. Compare on u64 to stay in unsigned arithmetic.
    let r_prev_u64 = R_prev as u64;
    assert(10 * r_u64 <= 11 * r_prev_u64, "fraud bound: reserves grew too fast");
}

// Test helpers build a fixed N=8 complete tree and the matching aggregates.

// expected_root computes the root hash and sum for given leaves.
// Tests use it to witness a consistent root_h and L.
fn expected_root(ids: [Field; N], bals: [Field; N]) -> (Field, Field) {
    let node = compute_root::<N, DEPTH>(ids, bals);
    (node.hash, node.sum)
}

// sum_reserves totals the M reserve figures.
fn sum_reserves(rs: [Field; M]) -> Field {
    let mut acc: Field = 0;
    for i in 0..M {
        acc += rs[i];
    }
    acc
}

#[test]
// Solvent case: R >= L, root and sums consistent, reserves within fraud bound.
fn test_solvent_passes() {
    let ids: [Field; N] = [1, 2, 3, 4, 5, 6, 7, 8];
    let bals: [Field; N] = [10, 20, 30, 40, 50, 60, 70, 80];
    let (root_h, l) = expected_root(ids, bals); // l = 360
    let reserves: [Field; M] = [200, 200, 0, 0]; // R = 400 >= 360
    let r = sum_reserves(reserves);
    let paths: [[Field; DEPTH]; N] = [[0; DEPTH]; N];
    // R_prev = 400 so 10*400 <= 11*400 holds.
    main(r, root_h, l, 400, ids, bals, paths, reserves);
}

#[test(should_fail_with = "insolvent: reserves below liabilities")]
// Insolvent case: R < L must fail the solvency assertion.
fn test_insolvent_fails() {
    let ids: [Field; N] = [1, 2, 3, 4, 5, 6, 7, 8];
    let bals: [Field; N] = [10, 20, 30, 40, 50, 60, 70, 80];
    let (root_h, l) = expected_root(ids, bals); // l = 360
    let reserves: [Field; M] = [100, 100, 0, 0]; // R = 200 < 360
    let r = sum_reserves(reserves);
    let paths: [[Field; DEPTH]; N] = [[0; DEPTH]; N];
    main(r, root_h, l, 400, ids, bals, paths, reserves);
}

#[test(should_fail_with = "fraud bound: reserves grew too fast")]
// Fraud-bound breach: R exceeds floor(1.1 * R_prev) and must fail.
fn test_fraud_bound_fails() {
    let ids: [Field; N] = [1, 2, 3, 4, 5, 6, 7, 8];
    let bals: [Field; N] = [10, 20, 30, 40, 50, 60, 70, 80];
    let (root_h, l) = expected_root(ids, bals); // l = 360
    let reserves: [Field; M] = [400, 400, 0, 0]; // R = 800
    let r = sum_reserves(reserves);
    let paths: [[Field; DEPTH]; N] = [[0; DEPTH]; N];
    // R_prev = 400: floor(1.1 * 400) = 440, and 800 > 440 so this breaches.
    main(r, root_h, l, 400, ids, bals, paths, reserves);
}
