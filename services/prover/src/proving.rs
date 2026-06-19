// UltraHonk proof generation.
//
// This module assembles the circuit witness from the reserves, liabilities, and
// the Merkle Sum Tree, then generates the UltraHonk proof. It is the proving
// half of the ZK-critical path and pairs with tree.rs.
//
// Intended backend crates, to be wired in the proving issue:
//   - bb / barretenberg bindings: the UltraHonk prover and verifier.
//   - acvm: ACIR/ACVM witness solving for the compiled Noir circuit.
// These are heavy and may need git sources, so they are not declared yet. Until
// they are, the functions below carry signatures and TODOs only.

use crate::tree::MerkleSumTree;

// The assembled witness handed to the prover. Holds secret balances, so it is
// zeroized by the caller in service.rs after the proof is produced.
//
// Field layout is fixed in the proving issue against the compiled circuit's ABI.
#[derive(Default)]
pub struct Witness {
    // Private inputs: per-leaf balances and the leaf hashes feeding the tree.
    pub private_balances: Vec<u128>,
    // Public inputs: R, L, root hash, R_prev. Mirrors PublicInputs in the proto.
    pub reserves_total: u128,
    pub liabilities_total: u128,
    pub root_hash: [u8; 32],
    pub prev_reserves: u128,
}

// The output of a proving run: the serialized proof bytes plus the public inputs
// the contract verifies and stores.
pub struct ProofBundle {
    pub proof: Vec<u8>,
    pub reserves_total: u128,
    pub liabilities_total: u128,
    pub root_hash: [u8; 32],
    pub prev_reserves: u128,
}

// Builds the witness from inputs and the built tree.
//
// TODO(proving): map reserves, liabilities, and the tree's leaves/root onto the
// compiled circuit's witness ABI via acvm. Enforce that root_hash equals the
// tree root here so the prover cannot witness a root the circuit did not build.
pub fn assemble_witness(
    _reserves: &[u128],
    _liabilities: &[u128],
    _prev_reserves: u128,
    _tree: &MerkleSumTree,
) -> Witness {
    todo!("assemble witness against the compiled Noir circuit ABI")
}

// Runs the UltraHonk prover over the witness and returns the proof bundle.
//
// TODO(proving): solve the ACIR with acvm to get the full witness, then call the
// bb UltraHonk prover. The verifying key must be the same one deployed in the
// proof-registry contract, otherwise on-chain verification fails.
pub fn prove(_witness: &Witness) -> Result<ProofBundle, ProvingError> {
    todo!("generate the UltraHonk proof with the bb backend")
}

// Errors surfaced by witness assembly and proving. Kept explicit so the service
// returns a typed gRPC status instead of a generic failure.
// The variants are constructed once the bb backend is wired in issue #9.
#[derive(Debug)]
#[allow(dead_code)]
pub enum ProvingError {
    WitnessAssembly(String),
    ProofGeneration(String),
}

impl std::fmt::Display for ProvingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProvingError::WitnessAssembly(m) => write!(f, "witness assembly failed: {m}"),
            ProvingError::ProofGeneration(m) => write!(f, "proof generation failed: {m}"),
        }
    }
}

impl std::error::Error for ProvingError {}
