#![no_std]

// Solva proof-registry contract.
//
// Single Soroban contract that holds the registry, the embedded UltraHonk
// verifying key, the BN254 proof verification, and the Poseidon2 inclusion
// check. No cross-contract calls.

use soroban_poseidon::Poseidon2Sponge;
use soroban_sdk::crypto::bn254::Bn254Fr;
use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env, Map, Vec, U256};
use ultrahonk_soroban_verifier::{UltraHonkVerifier, PROOF_BYTES};

use crate::storage::{DataKey, Error, PathNode, ProofMeta, ProofPublishedEvent, PubInputs};

#[contract]
pub struct ProofRegistry;

#[contractimpl]
impl ProofRegistry {
    pub fn __constructor(env: Env, owner: Address, vk: Bytes) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Vk, &vk);
        env.storage().instance().set(&DataKey::LatestId, &0u64);
        let proofs: Map<u64, ProofMeta> = Map::new(&env);
        env.storage().persistent().set(&DataKey::Proofs, &proofs);
        Ok(())
    }

    pub fn publish_proof(env: Env, proof: Bytes, pub_inputs: PubInputs) -> Result<u64, Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        owner.require_auth();

        let vk: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .ok_or(Error::NotInitialized)?;

        if !verify_ultrahonk(&env, &vk, &proof, &pub_inputs) {
            return Err(Error::ProofInvalid);
        }

        let r = U256::from_u128(&env, pub_inputs.reserves_total);
        let l = U256::from_u128(&env, pub_inputs.liabilities_total);
        if r < l {
            return Err(Error::InsolventBound);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::LatestId)
            .unwrap_or(0)
            + 1;

        let ts = env.ledger().timestamp();
        let meta = ProofMeta {
            root_h: pub_inputs.root_hash.clone(),
            r: pub_inputs.reserves_total,
            l: pub_inputs.liabilities_total,
            timestamp: ts,
        };

        let mut proofs: Map<u64, ProofMeta> = env
            .storage()
            .persistent()
            .get(&DataKey::Proofs)
            .unwrap_or_else(|| Map::new(&env));
        proofs.set(id, meta);
        env.storage().persistent().set(&DataKey::Proofs, &proofs);
        env.storage().instance().set(&DataKey::LatestId, &id);

        ProofPublishedEvent {
            reserves_total: pub_inputs.reserves_total,
            liabilities_total: pub_inputs.liabilities_total,
            ts,
        }
        .publish(&env);

        Ok(id)
    }

    pub fn get_latest_proof(env: Env) -> Result<ProofMeta, Error> {
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::LatestId)
            .ok_or(Error::NotInitialized)?;
        Self::get_proof(env, id)
    }

    pub fn get_proof(env: Env, id: u64) -> Result<ProofMeta, Error> {
        let proofs: Map<u64, ProofMeta> = env
            .storage()
            .persistent()
            .get(&DataKey::Proofs)
            .ok_or(Error::NotInitialized)?;
        proofs.get(id).ok_or(Error::ProofNotFound)
    }

    pub fn verify_inclusion(
        env: Env,
        id: u64,
        id_hash: BytesN<32>,
        balance: u128,
        path: Vec<PathNode>,
    ) -> Result<bool, Error> {
        let meta = Self::get_proof(env.clone(), id)?;

        let mut node_hash = poseidon2_leaf(&env, &id_hash, balance);
        let mut node_sum = balance;

        for step in path.iter() {
            let (left_hash, right_hash) = if step.sibling_is_left {
                (step.hash.clone(), node_hash.clone())
            } else {
                (node_hash.clone(), step.hash.clone())
            };
            // Only the two child hashes are fed into the hash -- not the sums.
            // This matches the Noir circuit's hash2(left.hash, right.hash).
            node_hash = poseidon2_node(&env, &left_hash, &right_hash);
            node_sum = node_sum.saturating_add(step.sum);
        }

        Ok(node_hash == meta.root_h)
    }
}

// ---------------------------------------------------------------------------
// Poseidon2 helpers
//
// Both use Poseidon2Sponge<4, Bn254Fr>:
//   t=4, rate=3, capacity=1, R_F=8, R_P=56, S-box x^5, BN254
//   IV = message_count << 64 in state[3]
//   output = state[0] after permutation
//
// This is identical to Poseidon2::hash([a, b], 2) in the Noir circuit.
// See circuits/lib/POSEIDON2_PARAMS.md.

fn bytes32_to_u256(env: &Env, b: &BytesN<32>) -> U256 {
    U256::from_be_bytes(env, &b.clone().into())
}

fn u256_to_bytes32(env: &Env, v: U256) -> BytesN<32> {
    let arr: [u8; 32] = v.to_be_bytes().try_into().unwrap_or([0u8; 32]);
    BytesN::from_array(env, &arr)
}

/// Poseidon2([id_hash, balance], 2) -- matches hash_leaf in the Noir circuit.
fn poseidon2_leaf(env: &Env, id_hash: &BytesN<32>, balance: u128) -> BytesN<32> {
    let mut sponge = Poseidon2Sponge::<4, Bn254Fr>::new(env);
    let inputs = soroban_sdk::vec![
        env,
        bytes32_to_u256(env, id_hash),
        U256::from_u128(env, balance),
    ];
    u256_to_bytes32(env, sponge.compute_hash(&inputs))
}

/// Poseidon2([left_hash, right_hash], 2) -- matches hash2 in the Noir circuit.
fn poseidon2_node(env: &Env, left_hash: &BytesN<32>, right_hash: &BytesN<32>) -> BytesN<32> {
    let mut sponge = Poseidon2Sponge::<4, Bn254Fr>::new(env);
    let inputs = soroban_sdk::vec![
        env,
        bytes32_to_u256(env, left_hash),
        bytes32_to_u256(env, right_hash),
    ];
    u256_to_bytes32(env, sponge.compute_hash(&inputs))
}

// UltraHonk/BN254 proof verification against the stored verifying key.
//
// Runs the vendored `ultrahonk_soroban_verifier` (forked from
// yugocabrio/rs-soroban-ultrahonk), which calls the native BN254 host functions.
// The proof is the keccak-transcript UltraHonk proof bytes; the public inputs
// are rebuilt from `pub_inputs` into the exact field layout the circuit
// declares. Returns true only when the proof verifies.
fn verify_ultrahonk(env: &Env, vk: &Bytes, proof: &Bytes, pub_inputs: &PubInputs) -> bool {
    // The verifier expects a fixed-size proof; reject anything else up front so
    // a malformed length cannot reach the parser.
    if proof.len() as usize != PROOF_BYTES {
        return false;
    }
    let verifier = match UltraHonkVerifier::new(env, vk) {
        Ok(v) => v,
        Err(_) => return false,
    };
    let public_inputs = encode_public_inputs(env, pub_inputs);
    verifier.verify(env, proof, &public_inputs).is_ok()
}

// Serialize the public inputs into the byte layout the solvency circuit
// declares: four 32-byte big-endian BN254 field elements in the order
// `R, root_h, L, R_prev`. This MUST match the order in circuits/solvency and
// the `public_inputs` file barretenberg emits, or verification fails. The u128
// aggregates are left-padded into the low 16 bytes of each 32-byte word.
fn encode_public_inputs(env: &Env, pi: &PubInputs) -> Bytes {
    let mut out = Bytes::new(env);
    append_u128_field(&mut out, pi.reserves_total); // R
    out.append(&Bytes::from_array(env, &pi.root_hash.to_array())); // root_h
    append_u128_field(&mut out, pi.liabilities_total); // L
    append_u128_field(&mut out, pi.prev_reserves); // R_prev
    out
}

// Append a u128 as a 32-byte big-endian field element (16 zero bytes, then the
// 16-byte big-endian value).
fn append_u128_field(out: &mut Bytes, value: u128) {
    let mut word = [0u8; 32];
    word[16..].copy_from_slice(&value.to_be_bytes());
    let env = out.env();
    out.append(&Bytes::from_array(env, &word));
}

#[cfg(test)]
mod test;

#[cfg(test)]
mod test_parity;

mod storage;
