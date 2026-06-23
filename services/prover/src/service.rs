//! gRPC service wiring for the Solva prover.
//!
//! `Prove` RPC:
//!   1. Deserialise + validate the request.
//!   2. Build the Merkle-sum tree.
//!   3. Assemble the ACIR witness.
//!   4. Generate the UltraHonk proof (locally verified inside `prove`).
//!   5. Zeroize private balances.
//!   6. Return `{ proof, public_inputs, serialized_tree }`.

use crate::pb::prover_server::Prover;
use crate::pb::{self, ProveRequest, ProveResponse};
use crate::proving::{self, CircuitArtifacts, ProvingError};
use crate::tree::MerkleSumTree;
use std::sync::Arc;
use tonic::{Request, Response, Status};
use zeroize::Zeroize;

/// Tonic service.  `artifacts` is loaded once at startup and shared across
/// all concurrent RPC calls behind an `Arc`.
pub struct ProverService {
    artifacts: Arc<CircuitArtifacts>,
}

impl ProverService {
    /// Load circuit artifacts and construct the service.  Call once from
    /// `main` before passing to `ProverServer::new`.
    pub fn new(artifacts_dir: impl AsRef<std::path::Path>) -> eyre::Result<Self> {
        let artifacts = CircuitArtifacts::load(artifacts_dir)?;
        Ok(Self {
            artifacts: Arc::new(artifacts),
        })
    }
}

#[tonic::async_trait]
impl Prover for ProverService {
    async fn prove(
        &self,
        request: Request<ProveRequest>,
    ) -> Result<Response<ProveResponse>, Status> {
        let req = request.into_inner();

        if req.reserves.len() != req.liabilities.len() {
            return Err(Status::invalid_argument(
                "reserves and liabilities must have equal length",
            ));
        }
        if req.reserves.is_empty() {
            return Err(Status::invalid_argument("at least one account is required"));
        }

        let reserves: Vec<u128> = req
            .reserves
            .iter()
            .map(|r| {
                r.balance
                    .parse::<u128>()
                    .map_err(|e| Status::invalid_argument(format!("bad reserve balance: {e}")))
            })
            .collect::<Result<_, _>>()?;

        let liabilities: Vec<u128> = req
            .liabilities
            .iter()
            .map(|l| {
                l.balance
                    .parse::<u128>()
                    .map_err(|e| Status::invalid_argument(format!("bad liability balance: {e}")))
            })
            .collect::<Result<_, _>>()?;

        let prev_reserves: u128 = req
            .prev_reserves
            .parse()
            .map_err(|e| Status::invalid_argument(format!("bad prev_reserves: {e}")))?;

        use crate::tree::{fr_to_bytes, poseidon2_hash_two, Node};
        use ark_bn254::Fr;
        use ark_ff::Zero;

        let leaves: Vec<Node> = reserves
            .iter()
            .zip(liabilities.iter())
            .map(|(&_r, &l)| {
                // leaf hash = poseidon2(balance_as_field, 0)
                let balance_bytes = fr_to_bytes(Fr::from(l));
                Node {
                    hash: poseidon2_hash_two(balance_bytes, fr_to_bytes(Fr::zero())),
                    sum: l,
                }
            })
            .collect();

        let tree = MerkleSumTree::build(leaves);

        let serialized_tree = serde_json::to_vec(&reserves)
            .map_err(|e| Status::internal(format!("tree serialize: {e}")))?;

        let mut witness = proving::assemble_witness(&reserves, &liabilities, prev_reserves, &tree)
            .map_err(proving_error_to_status)?;

        let bundle_result =
            proving::prove(&witness, &self.artifacts).map_err(proving_error_to_status);
        witness.private_balances.zeroize();
        let bundle = bundle_result?;

        let root = tree.root();
        let root_hex = hex::encode(root.hash);

        Ok(Response::new(ProveResponse {
            proof: bundle.proof,
            public_inputs: Some(pb::PublicInputs {
                reserves_total: bundle.reserves_total.to_string(),
                liabilities_total: bundle.liabilities_total.to_string(),
                root_hash: root_hex,
                prev_reserves: bundle.prev_reserves.to_string(),
            }),
            serialized_tree,
        }))
    }
}

fn proving_error_to_status(e: ProvingError) -> Status {
    match &e {
        ProvingError::WitnessAssembly(_) => Status::invalid_argument(e.to_string()),
        ProvingError::ProofGeneration(_) => Status::internal(e.to_string()),
    }
}

// // Placeholder leaf set so the tree wiring compiles before real hashing lands.
// fn placeholder_leaves() -> Vec<crate::tree::Node> {
//     vec![crate::tree::Node {
//         hash: [0u8; 32],
//         sum: 0,
//     }]
// }
//
// // Zeroes the secret fields of the witness. Vec<u128> and the scalar fields all
// // implement Zeroize, so this clears the heap and stack copies.
// fn zeroize_witness(witness: &mut Witness) {
//     witness.private_balances.zeroize();
//     witness.reserves_total.zeroize();
//     witness.liabilities_total.zeroize();
//     witness.root_hash.zeroize();
//     witness.prev_reserves.zeroize();
// }
//
// // Small local hex helper for the root hash so we avoid pulling another crate.
// fn encode_hex(bytes: &[u8; 32]) -> String {
//     let mut s = String::with_capacity(64);
//     for b in bytes {
//         s.push_str(&format!("{b:02x}"));
//     }
//     s
// }
