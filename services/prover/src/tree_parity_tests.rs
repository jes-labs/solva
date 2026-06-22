// ─── Parity tests for services/prover/src/tree.rs ────────────────────────────
//
// Append this block at the bottom of tree.rs, inside the file (not a separate
// module file) so it has access to the private `poseidon2` and `hash_pair` fns.
//
// These tests are the Rust side of the three-layer parity gate.
// They will NOT PASS until two things are done:
//
//   1. poseidon2() is wired to a real BN254 Poseidon2 implementation.
//   2. hash_pair() is fixed to pass TWO inputs, not four.
//      Current (WRONG):  poseidon2(&[left.hash, right.hash, field_from_u128(left.sum), field_from_u128(right.sum)])
//      Required (RIGHT): poseidon2(&[left.hash, right.hash])
//      See circuits/lib/POSEIDON2_PARAMS.md for the full explanation.
//
// Run with:
//   cargo test -p solva-prover poseidon2_parity

#[cfg(test)]
mod parity_tests {
    use crate::tree::{fr_to_bytes, permutation, poseidon2_hash_two, FieldElem};
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
}
