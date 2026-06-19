// Tests for the proof-registry contract.
//
// These cover the storage round-trip and owner gating. The UltraHonk
// verification is the verify_ultrahonk stub for now, so these focus on the
// registry behavior the contract owns directly.

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Bytes, BytesN, Env,
};

use crate::{Error, ProofRegistry, ProofRegistryClient, PubInputs};

// Deploys the contract with a dummy vk and returns the env, client, and owner.
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

    // A second publish bumps the monotonic id.
    let id2 = client.publish_proof(&proof, &sample_inputs(&env, 900, 100));
    assert_eq!(id2, 2);
    assert_eq!(client.get_latest_proof().r, 900);
}

#[test]
fn publish_requires_owner_auth() {
    let (env, client, _owner) = setup();
    // No mocked auths: the require_auth in publish_proof must reject the call.
    let proof = Bytes::from_array(&env, &[1u8; 16]);
    let inputs = sample_inputs(&env, 500, 300);

    let result = client.try_publish_proof(&proof, &inputs);
    assert!(result.is_err());
}

#[test]
fn insolvent_bound_is_rejected() {
    let (env, client, _owner) = setup();
    env.mock_all_auths();

    // L greater than R must be rejected even though the proof stub passes.
    let proof = Bytes::from_array(&env, &[1u8; 16]);
    let inputs = sample_inputs(&env, 100, 500);

    let result = client.try_publish_proof(&proof, &inputs);
    assert_eq!(result, Err(Ok(Error::InsolventBound)));
}
