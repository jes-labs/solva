// Poseidon2 parity tests
// Expected values sourced from poseidon2_parity_print (the circuit is authoritative).
// These same values must appear in test-vectors/poseidon2_parity.json and in the
// Rust prover and Stellar contract parity tests.

use crate::hash2;
use crate::hash_leaf;

// id_hash = SHA-256("customer-0001") mod p (BN254 scalar field prime).
global ID_HASH: Field = 3911146184957771170533462677490463864027325414938019701220093847937035118375;

// Print helper -- kept for re-verification after any parameter change.
#[test]
fn poseidon2_parity_print() {
    let v0 = hash2(0, 0);
    let v1 = hash2(1, 0);
    let v2 = hash2(0, 1);
    let v3 = hash_leaf(ID_HASH, 1000000);
    println(v0);
    println(v1);
    println(v2);
    println(v3);
}

// v0: hash2(0, 0)
#[test]
fn poseidon2_parity_v0_zero_zero() {
    let expected: Field = 5151499478991301833156025595048985053689893395646836724335623777508747990769;
    let got = hash2(0, 0);
    assert(got == expected);
}

// v1: hash2(1, 0)
#[test]
fn poseidon2_parity_v1_one_zero() {
    let expected: Field = 13578228163221461099666880123719605962228317296560839894194711027875318124803;
    let got = hash2(1, 0);
    assert(got == expected);
}

// v2: hash2(0, 1) -- must differ from v1
#[test]
fn poseidon2_parity_v2_zero_one() {
    let expected: Field = 6259659785923049555990894654032439312315958725226197300561261471894681115848;
    let got = hash2(0, 1);
    assert(got == expected);
}

// v3: hash_leaf(SHA-256("customer-0001") mod p, 1000000)
#[test]
fn poseidon2_parity_v3_realistic_leaf() {
    let expected: Field = 4444522096250258628179065313576986800542057722003645796897505527667395597796;
    let got = hash_leaf(ID_HASH, 1000000);
    assert(got == expected);
}

// Argument-order sensitivity: hash2(a,b) must not equal hash2(b,a).
#[test]
fn poseidon2_parity_order_sensitivity() {
    let ab = hash2(1, 2);
    let ba = hash2(2, 1);
    assert(ab != ba);
}
