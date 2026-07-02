use soroban_sdk::{contracterror, contractevent, contracttype, BytesN};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Vk,
    LatestId,
    // One entry per proof id. Keeping proofs under separate keys keeps publish at
    // O(1): a single small write, rather than reading and rewriting one growing
    // map every cycle (which crossed the per-tx resource budget around proof 4).
    Proof(u64),
}

#[contracttype]
#[derive(Clone)]
pub struct PubInputs {
    pub reserves_total: u128,
    pub liabilities_total: u128,
    pub root_hash: BytesN<32>,
    pub prev_reserves: u128,
}

#[contracttype]
#[derive(Clone)]
pub struct ProofMeta {
    pub root_h: BytesN<32>,
    pub r: u128,
    pub l: u128,
    pub timestamp: u64,
}

// One sibling step on a Poseidon2 inclusion path.
// sums are carried alongside the hash but are NOT fed into poseidon2_node --
// only the two child hashes are hashed, matching the circuit's hash2().
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
    ProofInvalid = 3,
    InsolventBound = 4,
    ProofNotFound = 5,
    PrevReservesMismatch = 6,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProofPublishedEvent {
    pub reserves_total: u128,
    #[topic]
    pub liabilities_total: u128,
    #[topic]
    pub ts: u64,
}
