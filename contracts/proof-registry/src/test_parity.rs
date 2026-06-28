#[cfg(test)]
extern crate std;

use std::boxed;
#[cfg(test)]
use std::format;
use std::string::ToString;
// Poseidon2 parity tests -- Stellar contract layer.
//
// Appended to test.rs via `mod test_parity;` at the bottom of that file.
//
// Verifies that the contract's poseidon2_leaf and poseidon2_node functions
// produce the same output as the Noir circuit for every vector in
// test-vectors/poseidon2_parity.json.
//
// Run: cargo test -p proof-registry poseidon2_parity
use soroban_poseidon::Poseidon2Sponge;
use soroban_sdk::crypto::bn254::Bn254Fr;
use soroban_sdk::{BytesN, Env, U256};

// Read expected values from the committed JSON vector file at compile time.
// Path relative to contracts/proof-registry/src/ -> up three levels.
const JSON: &str = include_str!("../../../test-vectors/poseidon2_parity.json");

fn expected_hex_runtime(id: &str) -> &'static str {
    // We need a &'static str so we box and leak for test use only.
    let tag = format!("\"id\": \"{id}\"");
    let pos = JSON
        .find(&tag as &str)
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
    // Leak is fine in tests -- they run once and exit.
    boxed::Box::leak(after[s..s + e].to_string().into_boxed_str())
}

fn hex_to_bytes32(env: &Env, hex: &str) -> BytesN<32> {
    let hex = hex.trim_start_matches("0x");
    let mut buf = [0u8; 32];
    for i in 0..32 {
        buf[i] = u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16)
            .unwrap_or_else(|_| panic!("bad hex byte at {i}"));
    }
    BytesN::from_array(env, &buf)
}

fn decimal_to_u256(env: &Env, s: &str) -> U256 {
    // Parse decimal into big-endian bytes then into U256.
    // Use simple repeated division -- tests only, not production.
    let mut digits: alloc::vec::Vec<u8> = s.bytes().map(|b| b - b'0').collect();
    let mut be_bytes = [0u8; 32];
    let mut byte_idx = 31usize;
    let mut all_zero = false;
    while !all_zero {
        // Divide digits by 256, remainder is the next byte.
        let mut rem = 0u32;
        all_zero = true;
        for d in digits.iter_mut() {
            let v = rem * 10 + *d as u32;
            *d = (v / 256) as u8;
            rem = v % 256;
            if *d != 0 {
                all_zero = false;
            }
        }
        be_bytes[byte_idx] = rem as u8;
        if byte_idx == 0 {
            break;
        }
        byte_idx -= 1;
    }
    U256::from_be_bytes(env, &BytesN::from_array(env, &be_bytes).into())
}

#[allow(unused_extern_crates)]
extern crate alloc;

#[allow(deprecated)]
fn poseidon2_two(env: &Env, a: U256, b: U256) -> BytesN<32> {
    let mut sponge = Poseidon2Sponge::<4, Bn254Fr>::new(env);
    let inputs = soroban_sdk::vec![env, a, b];
    let result = sponge.compute_hash(&inputs);
    BytesN::from_array(env, &result.to_be_bytes().try_into().unwrap_or([0u8; 32]))
}

#[allow(deprecated)]
fn poseidon2_four(env: &Env, a: &U256, b: &U256, c: &U256, d: &U256) -> U256 {
    let mut sponge = Poseidon2Sponge::<4, Bn254Fr>::new(env);
    let inputs = soroban_sdk::vec![env, a.clone(), b.clone(), c.clone(), d.clone()];
    let result = sponge.compute_hash(&inputs);
    let bytes: [u8; 32] = result.to_be_bytes().try_into().unwrap_or([0u8; 32]);
    U256::from_be_bytes(env, &BytesN::from_array(env, &bytes).into())
}

// Computes the canonical hash4-with-sums root for the demo leaf set (ids 1..8,
// balances 10..80) using the native on-chain Poseidon2. This is the ground
// truth the circuit and prover must reproduce. The scheme, per the whitepaper:
//   leaf = poseidon2([id_hash, balance, 0, 0]), sum = balance
//   node = poseidon2([left.hash, left.sum, right.hash, right.sum]), sum = left+right
// Run: cargo test -p proof-registry canonical_root -- --nocapture
#[test]
fn canonical_root() {
    let env = Env::default();
    let zero = U256::from_u32(&env, 0);

    let ids = [1u32, 2, 3, 4, 5, 6, 7, 8];
    let bals = [10u32, 20, 30, 40, 50, 60, 70, 80];

    let mut hashes: alloc::vec::Vec<U256> = alloc::vec::Vec::new();
    let mut sums: alloc::vec::Vec<U256> = alloc::vec::Vec::new();
    for i in 0..8 {
        let id = U256::from_u32(&env, ids[i]);
        let bal = U256::from_u32(&env, bals[i]);
        hashes.push(poseidon2_four(&env, &id, &bal, &zero, &zero));
        sums.push(bal);
    }

    while hashes.len() > 1 {
        let mut next_hashes: alloc::vec::Vec<U256> = alloc::vec::Vec::new();
        let mut next_sums: alloc::vec::Vec<U256> = alloc::vec::Vec::new();
        let mut j = 0;
        while j < hashes.len() {
            next_hashes.push(poseidon2_four(&env, &hashes[j], &sums[j], &hashes[j + 1], &sums[j + 1]));
            next_sums.push(sums[j].add(&sums[j + 1]));
            j += 2;
        }
        hashes = next_hashes;
        sums = next_sums;
    }

    let root: [u8; 32] = hashes[0].to_be_bytes().try_into().unwrap_or([0u8; 32]);
    let hexs: std::string::String = root.iter().map(|b| format!("{:02x}", b)).collect();
    std::eprintln!("CANONICAL_ROOT_HASH=0x{}", hexs);
}

const CANONICAL_ROOT: &str =
    "0x0e36888d7cade7e79309cd7e58109611104c225f2fcd5a158c662debb173572f";

fn small_id(env: &Env, n: u32) -> BytesN<32> {
    let mut buf = [0u8; 32];
    buf[28..32].copy_from_slice(&n.to_be_bytes());
    BytesN::from_array(env, &buf)
}

// The production inclusion helpers must build the same root as the native sponge
// (canonical_root). This is the contract side of the cross-layer parity gate.
#[test]
fn inclusion_helpers_match_canonical() {
    let env = Env::default();
    let ids = [1u32, 2, 3, 4, 5, 6, 7, 8];
    let bals = [10u128, 20, 30, 40, 50, 60, 70, 80];

    let mut hashes: alloc::vec::Vec<BytesN<32>> = alloc::vec::Vec::new();
    let mut sums: alloc::vec::Vec<u128> = alloc::vec::Vec::new();
    for i in 0..8 {
        hashes.push(crate::poseidon2_leaf(&env, &small_id(&env, ids[i]), bals[i]));
        sums.push(bals[i]);
    }

    while hashes.len() > 1 {
        let mut next_hashes: alloc::vec::Vec<BytesN<32>> = alloc::vec::Vec::new();
        let mut next_sums: alloc::vec::Vec<u128> = alloc::vec::Vec::new();
        let mut j = 0;
        while j < hashes.len() {
            next_hashes.push(crate::poseidon2_node(&env, &hashes[j], sums[j], &hashes[j + 1], sums[j + 1]));
            next_sums.push(sums[j] + sums[j + 1]);
            j += 2;
        }
        hashes = next_hashes;
        sums = next_sums;
    }

    assert_eq!(
        hashes[0],
        hex_to_bytes32(&env, CANONICAL_ROOT),
        "contract inclusion helpers do not match the canonical root"
    );
}

#[test]
fn poseidon2_parity_v0_zero_zero() {
    let env = Env::default();
    let zero = U256::from_u32(&env, 0);
    let got = poseidon2_two(&env, zero.clone(), zero);
    let expected = hex_to_bytes32(&env, expected_hex_runtime("v0_zero_zero"));
    assert_eq!(got, expected, "parity v0: Stellar hash_two(0,0) mismatch");
}

#[test]
fn poseidon2_parity_v1_one_zero() {
    let env = Env::default();
    let one = U256::from_u32(&env, 1);
    let zero = U256::from_u32(&env, 0);
    let got = poseidon2_two(&env, one, zero);
    let expected = hex_to_bytes32(&env, expected_hex_runtime("v1_one_zero"));
    assert_eq!(got, expected, "parity v1: Stellar hash_two(1,0) mismatch");
}

#[test]
fn poseidon2_parity_v2_zero_one() {
    let env = Env::default();
    let zero = U256::from_u32(&env, 0);
    let one = U256::from_u32(&env, 1);
    let got = poseidon2_two(&env, zero, one);
    let expected = hex_to_bytes32(&env, expected_hex_runtime("v2_zero_one"));
    assert_eq!(got, expected, "parity v2: Stellar hash_two(0,1) mismatch");
}

#[test]
fn poseidon2_parity_v3_realistic_leaf() {
    let env = Env::default();
    // id_hash = SHA-256("customer-0001") mod p
    let id_hash = decimal_to_u256(
        &env,
        "3911146184957771170533462677490463864027325414938019701220093847937035118375",
    );
    let balance = U256::from_u128(&env, 1_000_000);
    let got = poseidon2_two(&env, id_hash, balance);
    let expected = hex_to_bytes32(&env, expected_hex_runtime("v3_realistic_leaf"));
    assert_eq!(
        got, expected,
        "parity v3: Stellar hash_two(id_hash, balance) mismatch"
    );
}

#[test]
fn poseidon2_parity_order_sensitivity() {
    let env = Env::default();
    let one = U256::from_u32(&env, 1);
    let two = U256::from_u32(&env, 2);
    assert_ne!(
        poseidon2_two(&env, one.clone(), two.clone()),
        poseidon2_two(&env, two, one),
        "parity: Stellar Poseidon2 is commutative -- broken"
    );
}
