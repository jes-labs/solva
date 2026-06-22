// Tests for the proof-registry contract.
//
// Section 1: registry behavior (storage round-trip, auth, solvency bound).
// Section 2: Poseidon2 parity tests -- hash correctness against the shared
//test vector file.
#[cfg(test)]
extern crate std;

#[cfg(test)]
use std::format;

use soroban_poseidon::Poseidon2Sponge;
use soroban_sdk::crypto::bn254::Fr as Bn254Fr;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Bytes, BytesN, Env, U256,
};

use crate::{Error, ProofRegistry, ProofRegistryClient, PubInputs};

fn setup() -> (Env, ProofRegistryClient<'static>, Address) {
    let env = Env::default();
    let owner = Address::generate(&env);
    let vk = Bytes::from_array(&env, &[0u8; 32]);
    let contract_id = env.register(ProofRegistry, (owner.clone(), vk));
    let client = ProofRegistryClient::new(&env, &contract_id);
    (env, client, owner)
}

fn sample_inputs(env: &Env, r: u128, l: u128) -> PubInputs {
    PubInputs {
        reserves_total: r,
        liabilities_total: l,
        root_hash: BytesN::from_array(env, &[7u8; 32]),
        prev_reserves: 0,
    }
}

// Section 1: registry behavior

#[test]
fn publish_then_read_round_trip() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();
    env.ledger().set_timestamp(1000);

    let proof = Bytes::from_array(&env, &[1u8; 16]);
    let inputs = sample_inputs(&env, 500, 300);

    let id = client.publish_proof(&proof, &inputs);
    assert_eq!(id, 1);

    let meta = client.get_proof(&id);
    assert_eq!(meta.r, 500);
    assert_eq!(meta.l, 300);
    assert_eq!(meta.timestamp, 1000);

    let latest = client.get_latest_proof();
    assert_eq!(latest.r, 500);

    let id2 = client.publish_proof(&proof, &sample_inputs(&env, 900, 100));
    assert_eq!(id2, 2);
    assert_eq!(client.get_latest_proof().r, 900);
}

#[test]
fn publish_requires_owner_auth() {
    let (env, client, _owner) = setup();
    let proof = Bytes::from_array(&env, &[1u8; 16]);
    let inputs = sample_inputs(&env, 500, 300);
    let result = client.try_publish_proof(&proof, &inputs);
    assert!(result.is_err());
}

#[test]
fn insolvent_bound_is_rejected() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();
    let proof = Bytes::from_array(&env, &[1u8; 16]);
    let inputs = sample_inputs(&env, 100, 500);
    let result = client.try_publish_proof(&proof, &inputs);
    assert_eq!(result, Err(Ok(Error::InsolventBound)));
}

// Section 2: Poseidon2 parity tests
//
// Verifies that the Stellar contract's Poseidon2 implementation produces the
// same output as the Noir circuit for every vector in
// test-vectors/poseidon2_parity.json.
//
// Uses Poseidon2Sponge<4, Bn254Fr> directly (same type as poseidon2_leaf and
// poseidon2_node in lib.rs) so these tests exercise the exact same code path.
//
// Run: cargo test -p proof-registry poseidon2_parity

const VECTORS_JSON: &str = include_str!("../../../test-vectors/poseidon2_parity.json");

fn json_expected_hex(id: &str) -> BytesN<32> {
    let tag = format!("\"id\": \"{id}\"");
    let pos = VECTORS_JSON
        .find(tag.as_str())
        .unwrap_or_else(|| panic!("vector {id} not in JSON"));
    let after = &VECTORS_JSON[pos..];
    let key = "\"expected_hex\": \"";
    let s = after
        .find(key)
        .unwrap_or_else(|| panic!("no expected_hex for {id}"))
        + key.len();
    let e = after[s..]
        .find('"')
        .unwrap_or_else(|| panic!("unterminated expected_hex for {id}"));
    let hex = after[s..s + e].trim_start_matches("0x");
    let env = Env::default();
    let mut buf = [0u8; 32];
    for i in 0..32 {
        buf[i] = u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16)
            .unwrap_or_else(|_| panic!("bad hex at byte {i}"));
    }
    BytesN::from_array(&env, &buf)
}

fn poseidon2_two(env: &Env, a: U256, b: U256) -> BytesN<32> {
    let mut sponge = Poseidon2Sponge::<4, Bn254Fr>::new(env);
    let inputs = soroban_sdk::vec![env, a, b];
    let result = sponge.compute_hash(&inputs);
    let arr: [u8; 32] = result.to_be_bytes().try_into().unwrap_or([0u8; 32]);
    BytesN::from_array(env, &arr)
}

fn decimal_to_u256(env: &Env, s: &str) -> U256 {
    // Parse decimal string into big-endian bytes via repeated division by 256.
    let mut digits: std::vec::Vec<u8> = s.bytes().map(|b| b - b'0').collect();
    let mut be = [0u8; 32];
    for slot in be.iter_mut().rev() {
        let mut rem = 0u16;
        let mut all_zero = true;
        for d in digits.iter_mut() {
            let v = rem * 10 + *d as u16;
            *d = (v / 256) as u8;
            rem = v % 256;
            if *d != 0 {
                all_zero = false;
            }
        }
        *slot = rem as u8;
        if all_zero {
            break;
        }
    }
    U256::from_be_bytes(env, &BytesN::from_array(env, &be).into())
}

#[test]
fn poseidon2_parity_v0_zero_zero() {
    let env = Env::default();
    let z = U256::from_u32(&env, 0);
    assert_eq!(
        poseidon2_two(&env, z.clone(), z),
        json_expected_hex("v0_zero_zero"),
        "parity v0: Stellar Poseidon2([0,0]) mismatch"
    );
}

#[test]
fn poseidon2_parity_v1_one_zero() {
    let env = Env::default();
    assert_eq!(
        poseidon2_two(&env, U256::from_u32(&env, 1), U256::from_u32(&env, 0)),
        json_expected_hex("v1_one_zero"),
        "parity v1: Stellar Poseidon2([1,0]) mismatch"
    );
}

#[test]
fn poseidon2_parity_v2_zero_one() {
    let env = Env::default();
    assert_eq!(
        poseidon2_two(&env, U256::from_u32(&env, 0), U256::from_u32(&env, 1)),
        json_expected_hex("v2_zero_one"),
        "parity v2: Stellar Poseidon2([0,1]) mismatch"
    );
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
    assert_eq!(
        poseidon2_two(&env, id_hash, balance),
        json_expected_hex("v3_realistic_leaf"),
        "parity v3: Stellar Poseidon2([id_hash, balance]) mismatch"
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
