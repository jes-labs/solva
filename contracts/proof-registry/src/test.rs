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
use soroban_sdk::crypto::bn254::Bn254Fr;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Bytes, BytesN, Env, Vec, U256,
};

use crate::{Error, PathNode, ProofRegistry, ProofRegistryClient, PubInputs};

// Verifying key and proof for the solvency circuit's solvent sample vector,
// generated with the pinned tooling (see circuits/README.md).
static SOLVENCY_VK: &[u8] = include_bytes!("testdata/solvency_vk.bin");
static SOLVENCY_PROOF: &[u8] = include_bytes!("testdata/solvency_proof.bin");

// Poseidon2 hash4-with-sums root for the sample leaves (ids 1..8, balances
// 10..80). This is the `root_h` public input the proof commits to.
const SAMPLE_ROOT_H: [u8; 32] = [
    0x0e, 0x36, 0x88, 0x8d, 0x7c, 0xad, 0xe7, 0xe7, 0x93, 0x09, 0xcd, 0x7e, 0x58, 0x10, 0x96, 0x11,
    0x10, 0x4c, 0x22, 0x5f, 0x2f, 0xcd, 0x5a, 0x15, 0x8c, 0x66, 0x2d, 0xeb, 0xb1, 0x73, 0x57, 0x2f,
];

// Deploys the contract with the real solvency verifying key.
fn setup() -> (Env, ProofRegistryClient<'static>, Address) {
    let env = Env::default();
    let owner = Address::generate(&env);
    let vk = Bytes::from_slice(&env, SOLVENCY_VK);
    let contract_id = env.register(ProofRegistry, (owner.clone(), vk));
    let client = ProofRegistryClient::new(&env, &contract_id);
    (env, client, owner)
}

// The public inputs the sample proof commits to. The circuit binds these, so
// they are the only values the proof verifies against (R = 400, L = 360,
// R_prev = 400).
fn solvent_inputs(env: &Env) -> PubInputs {
    PubInputs {
        reserves_total: 400,
        liabilities_total: 360,
        root_hash: BytesN::from_array(env, &SAMPLE_ROOT_H),
        prev_reserves: 400,
    }
}

// Section 1: registry behavior

#[test]
fn real_proof_verifies_and_is_recorded() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();
    env.ledger().set_timestamp(1000);

    let proof = Bytes::from_slice(&env, SOLVENCY_PROOF);
    let inputs = solvent_inputs(&env);

    // A genuine proof against the stored vk verifies and is recorded.
    let id = client.publish_proof(&proof, &inputs);
    assert_eq!(id, 1);

    let meta = client.get_proof(&id);
    assert_eq!(meta.r, 400);
    assert_eq!(meta.l, 360);
    assert_eq!(meta.timestamp, 1000);
    assert_eq!(meta.root_h, BytesN::from_array(&env, &SAMPLE_ROOT_H));

    assert_eq!(client.get_latest_proof().r, 400);

    // Publishing the same valid proof again bumps the monotonic id.
    let id2 = client.publish_proof(&proof, &inputs);
    assert_eq!(id2, 2);

    // Per-id storage: both proofs stay independently retrievable, and each
    // publish writes only its own entry (no growing map to read and rewrite).
    assert_eq!(client.get_proof(&1).r, 400);
    assert_eq!(client.get_proof(&2).r, 400);
    assert_eq!(client.get_latest_proof().r, 400);
}

#[test]
fn tampered_proof_is_rejected() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();

    // Flip one byte of an otherwise valid proof. Verification must fail.
    let mut proof = Bytes::from_slice(&env, SOLVENCY_PROOF);
    proof.set(100, proof.get(100).unwrap() ^ 0x01);
    let inputs = solvent_inputs(&env);

    let result = client.try_publish_proof(&proof, &inputs);
    assert_eq!(result, Err(Ok(Error::ProofInvalid)));
}

#[test]
fn mismatched_public_inputs_are_rejected() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();

    // The proof is intact, but the public inputs do not match what it commits
    // to (L is off by one). The proof is bound to its public inputs, so this
    // must fail verification rather than record a false statement.
    let proof = Bytes::from_slice(&env, SOLVENCY_PROOF);
    let mut inputs = solvent_inputs(&env);
    inputs.liabilities_total = 361;

    let result = client.try_publish_proof(&proof, &inputs);
    assert_eq!(result, Err(Ok(Error::ProofInvalid)));
}

#[test]
fn publish_requires_owner_auth() {
    let (env, client, _owner) = setup();
    // No mocked auths: require_auth runs before verification and must reject.
    let proof = Bytes::from_slice(&env, SOLVENCY_PROOF);
    let inputs = solvent_inputs(&env);
    let result = client.try_publish_proof(&proof, &inputs);
    assert!(result.is_err());
}

// Native Poseidon2 inclusion check.

// Convert a 32-byte big-endian node hash back into a field element, matching
// bytes32_to_u256 in lib.rs.
fn b32_to_u256(env: &Env, b: &BytesN<32>) -> U256 {
    U256::from_be_bytes(env, &b.clone().into())
}

// Build the 8-leaf Poseidon2 sum tree for the sample leaves (ids 1..8,
// balances 10..80) and return the levels bottom-up. Each node is (hash, sum).
// Mirrors the prover fold in services/prover/src/tree.rs: leaf is
// hash4([id, balance, 0, 0]), node is hash4([left.hash, left.sum, right.hash,
// right.sum]).
fn build_sample_levels(env: &Env) -> std::vec::Vec<std::vec::Vec<(BytesN<32>, u128)>> {
    let zero = U256::from_u32(env, 0);
    let mut leaves: std::vec::Vec<(BytesN<32>, u128)> = std::vec::Vec::new();
    for i in 1u128..=8 {
        let bal = 10 * i;
        let hash = poseidon2_four(
            env,
            U256::from_u128(env, i),
            U256::from_u128(env, bal),
            zero.clone(),
            zero.clone(),
        );
        leaves.push((hash, bal));
    }

    let mut levels: std::vec::Vec<std::vec::Vec<(BytesN<32>, u128)>> = std::vec::Vec::new();
    levels.push(leaves);
    while levels.last().unwrap().len() > 1 {
        let cur = levels.last().unwrap();
        let mut parents: std::vec::Vec<(BytesN<32>, u128)> = std::vec::Vec::new();
        let mut k = 0;
        while k < cur.len() {
            let (lh, ls) = &cur[k];
            let (rh, rs) = if k + 1 < cur.len() {
                &cur[k + 1]
            } else {
                &cur[k]
            };
            let hash = poseidon2_four(
                env,
                b32_to_u256(env, lh),
                U256::from_u128(env, *ls),
                b32_to_u256(env, rh),
                U256::from_u128(env, *rs),
            );
            parents.push((hash, ls.saturating_add(*rs)));
            k += 2;
        }
        levels.push(parents);
    }
    levels
}

// Derive the sibling path for one leaf, in the PathNode shape the contract
// expects. Odd index means the sibling sits on the left, matching
// tree.rs::inclusion_path.
fn inclusion_path(
    env: &Env,
    levels: &[std::vec::Vec<(BytesN<32>, u128)>],
    index: usize,
) -> Vec<PathNode> {
    let mut path: Vec<PathNode> = Vec::new(env);
    let mut idx = index;
    for level in &levels[..levels.len() - 1] {
        let is_right = idx % 2 == 1;
        let sib = if is_right { idx - 1 } else { idx + 1 };
        let node = level.get(sib).unwrap_or(&level[idx]);
        path.push_back(PathNode {
            hash: node.0.clone(),
            sum: node.1,
            sibling_is_left: is_right,
        });
        idx /= 2;
    }
    path
}

#[test]
fn inclusion_path_verifies_and_tampering_is_rejected() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();

    // The contract's native Poseidon2 builds the same root the prover committed
    // (SAMPLE_ROOT_H), with root sum == L == 360. This ties the on-chain hash to
    // the prover tree for the sample leaves.
    let levels = build_sample_levels(&env);
    let root = &levels.last().unwrap()[0];
    assert_eq!(root.0, BytesN::from_array(&env, &SAMPLE_ROOT_H));
    assert_eq!(root.1, 360);

    // Record the proof so the registry holds root_h = SAMPLE_ROOT_H and l = 360.
    let proof = Bytes::from_slice(&env, SOLVENCY_PROOF);
    let id = client.publish_proof(&proof, &solvent_inputs(&env));

    // Leaf 0 is customer id_hash = 1, balance = 10.
    let mut id_bytes = [0u8; 32];
    id_bytes[31] = 1;
    let id_hash = BytesN::from_array(&env, &id_bytes);
    let path = inclusion_path(&env, &levels, 0);

    // A correct path for the recorded leaf passes.
    assert!(client.verify_inclusion(&id, &id_hash, &10u128, &path));

    // Wrong balance changes the leaf hash, so the recomputed root mismatches.
    assert!(!client.verify_inclusion(&id, &id_hash, &11u128, &path));

    // Flipping a sibling hash breaks the recomputed root hash.
    let mut bad_hash_path = path.clone();
    let mut step = bad_hash_path.get(0).unwrap();
    let mut hash_bytes = step.hash.to_array();
    // Flip the least-significant byte so the value stays well below the BN254
    // field modulus while still changing the recomputed hash.
    hash_bytes[31] ^= 0x01;
    step.hash = BytesN::from_array(&env, &hash_bytes);
    bad_hash_path.set(0, step);
    assert!(!client.verify_inclusion(&id, &id_hash, &10u128, &bad_hash_path));

    // A wrong sibling sum keeps the hash intact but makes node_sum != l, so the
    // sum check rejects it.
    let mut bad_sum_path = path.clone();
    let mut step = bad_sum_path.get(0).unwrap();
    step.sum += 1;
    bad_sum_path.set(0, step);
    assert!(!client.verify_inclusion(&id, &id_hash, &10u128, &bad_sum_path));
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

fn poseidon2_four(env: &Env, a: U256, b: U256, c: U256, d: U256) -> BytesN<32> {
    let mut sponge = Poseidon2Sponge::<4, Bn254Fr>::new(env);
    let inputs = soroban_sdk::vec![env, a, b, c, d];
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
