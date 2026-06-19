#![no_std]

// Solva proof-registry contract.
//
// Single Soroban contract that holds the registry, the embedded UltraHonk
// verifying key, the BN254 proof verification, and the Poseidon2 inclusion
// check. No cross-contract calls.
//
// The design forks NethermindEth/rs-soroban-ultrahonk: the verifying key is
// stored once at deploy via __constructor (immutable), and publish_proof checks
// each proof against it before recording the result.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env, Map, Symbol,
    Vec, U256,
};

// Instance storage keys. Instance storage holds the small, always-needed values:
// the owner, the embedded verifying key, and the monotonic proof counter.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Vk,
    LatestId,
    // Persistent map of proof id to its recorded metadata.
    Proofs,
}

// Public inputs exposed on chain. Everything else in the witness stays private.
// Reserves and liabilities are minor units as u128, matching the prover.
#[contracttype]
#[derive(Clone)]
pub struct PubInputs {
    pub reserves_total: u128,
    pub liabilities_total: u128,
    pub root_hash: BytesN<32>,
    pub prev_reserves: u128,
}

// Recorded result of a published proof. R and L are kept so verifiers can read
// totals without re-running the proof.
#[contracttype]
#[derive(Clone)]
pub struct ProofMeta {
    pub root_h: BytesN<32>,
    pub r: u128,
    pub l: u128,
    pub timestamp: u64,
}

// One sibling step on a Poseidon2 inclusion path. `hash` is the sibling hash and
// `sum` is the sibling subtree total. `sibling_is_left` fixes the hash order so
// it matches the order the prover used when it built the tree.
#[contracttype]
#[derive(Clone)]
pub struct PathNode {
    pub hash: BytesN<32>,
    pub sum: u128,
    pub sibling_is_left: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    // Verification of the UltraHonk proof against the stored vk failed.
    ProofInvalid = 3,
    // The re-asserted solvency bound R >= L did not hold.
    InsolventBound = 4,
    ProofNotFound = 5,
}

#[contract]
pub struct ProofRegistry;

#[contractimpl]
impl ProofRegistry {
    // Deploy-time setup. Stores the owner, the immutable verifying key, and seeds
    // the proof counter at zero. Runs once; re-running is rejected.
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

    // Owner-gated publish. Verifies the proof against the stored vk, re-asserts
    // R >= L with checked 256-bit math, records ProofMeta, and emits an event.
    // Returns the new proof id.
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

        // UltraHonk/BN254 verification against the embedded vk.
        if !verify_ultrahonk(&env, &vk, &proof, &pub_inputs) {
            return Err(Error::ProofInvalid);
        }

        // Re-assert the solvency bound R >= L on chain even though the circuit
        // already proves it. CAP-0082 checked 256-bit integers so the comparison
        // never traps on overflow.
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

        // ProofPublished(id, R, L, ts).
        env.events().publish(
            (Symbol::new(&env, "ProofPublished"), id),
            (pub_inputs.reserves_total, pub_inputs.liabilities_total, ts),
        );

        Ok(id)
    }

    // Returns the most recently published proof metadata.
    pub fn get_latest_proof(env: Env) -> Result<ProofMeta, Error> {
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::LatestId)
            .ok_or(Error::NotInitialized)?;
        Self::get_proof(env, id)
    }

    // Returns proof metadata by id.
    pub fn get_proof(env: Env, id: u64) -> Result<ProofMeta, Error> {
        let proofs: Map<u64, ProofMeta> = env
            .storage()
            .persistent()
            .get(&DataKey::Proofs)
            .ok_or(Error::NotInitialized)?;
        proofs.get(id).ok_or(Error::ProofNotFound)
    }

    // Public inclusion check. Recomputes the Poseidon2 sum-tree path for a leaf
    // and compares the recomputed root against the stored root_h for that proof.
    // Returns true when the leaf is provably in the committed tree.
    pub fn verify_inclusion(
        env: Env,
        id: u64,
        id_hash: BytesN<32>,
        balance: u128,
        path: Vec<PathNode>,
    ) -> Result<bool, Error> {
        let meta = Self::get_proof(env.clone(), id)?;

        // Start from the leaf: hash the customer id_hash with its balance, using
        // the same Poseidon2 leaf encoding the prover used.
        let mut node_hash = poseidon2_leaf(&env, &id_hash, balance);
        let mut node_sum = balance;

        // Walk the siblings up to the root. Order each hash by sibling_is_left so
        // it matches the prover's pairing.
        for step in path.iter() {
            let (left_hash, left_sum, right_hash, right_sum) = if step.sibling_is_left {
                (step.hash.clone(), step.sum, node_hash.clone(), node_sum)
            } else {
                (node_hash.clone(), node_sum, step.hash.clone(), step.sum)
            };
            node_hash = poseidon2_node(&env, &left_hash, left_sum, &right_hash, right_sum);
            // Saturating add keeps the sum from trapping; an overflow here would
            // mean a malformed path and the root compare will fail anyway.
            node_sum = node_sum.saturating_add(step.sum);
        }

        Ok(node_hash == meta.root_h)
    }
}

// STUB. UltraHonk/BN254 proof verification against the stored verifying key.
//
// The real implementation uses the native BN254 host functions (CAP-0074, made
// cheap by the CAP-0080 Yardstick host functions) to verify the UltraHonk proof
// over the public inputs. Port this from NethermindEth/rs-soroban-ultrahonk's
// verify_proof; that fork already follows the VK-at-deploy pattern we use.
//
// Returns true on a valid proof. The stub returns true so the registry storage
// path and owner gating can be exercised in tests; it MUST be replaced before
// any deployment.
fn verify_ultrahonk(_env: &Env, _vk: &Bytes, _proof: &Bytes, _pub_inputs: &PubInputs) -> bool {
    true
}

// STUB. Poseidon2 hash of a leaf: the customer id_hash bound to its balance.
//
// Must use the SAME Poseidon2 parameters and leaf encoding as the prover's tree
// (services/prover/src/tree.rs) and the Noir circuit. The real call uses the
// Stellar native Poseidon2 host function (CAP-0075). Returns the id_hash
// unchanged for now so tests compile; replace before deployment.
fn poseidon2_leaf(_env: &Env, id_hash: &BytesN<32>, _balance: u128) -> BytesN<32> {
    id_hash.clone()
}

// STUB. Poseidon2 hash of two child nodes into their parent.
//
// Same parameter requirement as poseidon2_leaf. The real call uses the native
// Poseidon2 host function and must match the prover's hash_pair ordering and
// sum encoding. Returns the left hash for now so tests compile.
fn poseidon2_node(
    _env: &Env,
    left_hash: &BytesN<32>,
    _left_sum: u128,
    _right_hash: &BytesN<32>,
    _right_sum: u128,
) -> BytesN<32> {
    left_hash.clone()
}

#[cfg(test)]
mod test;
