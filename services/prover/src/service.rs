//! gRPC service wiring for the Solva prover.
//!
//! Prove RPC:
//!   1. Deserialise and validate the request.
//!   2. Build the witness (customer leaves, reserves, previous reserves).
//!   3. Generate the UltraHonk proof via nargo + bb (proving.rs).
//!   4. Zeroize the private balances.
//!   5. Return { proof, public_inputs, serialized_tree }.

use std::path::PathBuf;

use tonic::{Request, Response, Status};
use zeroize::Zeroize;

use crate::pb::prover_server::Prover as ProverRpc;
use crate::pb::{self, ProveRequest, ProveResponse};
use crate::proving::{self, Prover, ProvingError, Witness};

// Tonic service. The Prover holds the circuit directory and shells out to
// nargo + bb; it is cheap to share across concurrent RPC calls.
pub struct ProverService {
    prover: Prover,
}

impl ProverService {
    pub fn new(circuit_dir: impl Into<PathBuf>) -> Self {
        Self {
            prover: Prover::new(circuit_dir),
        }
    }
}

#[tonic::async_trait]
impl ProverRpc for ProverService {
    async fn prove(
        &self,
        request: Request<ProveRequest>,
    ) -> Result<Response<ProveResponse>, Status> {
        let req = request.into_inner();

        if req.reserves.is_empty() {
            return Err(Status::invalid_argument("at least one reserve is required"));
        }
        if req.liabilities.is_empty() {
            return Err(Status::invalid_argument(
                "at least one liability is required",
            ));
        }

        let leaf_ids = req
            .liabilities
            .iter()
            .map(|l| proving::parse_field(&l.customer_id_hash))
            .collect::<Result<Vec<_>, _>>()
            .map_err(proving_error_to_status)?;

        let leaf_balances = req
            .liabilities
            .iter()
            .map(|l| {
                l.balance
                    .parse::<u128>()
                    .map_err(|e| Status::invalid_argument(format!("bad liability balance: {e}")))
            })
            .collect::<Result<Vec<_>, _>>()?;

        let reserves = req
            .reserves
            .iter()
            .map(|r| {
                r.balance
                    .parse::<u128>()
                    .map_err(|e| Status::invalid_argument(format!("bad reserve balance: {e}")))
            })
            .collect::<Result<Vec<_>, _>>()?;

        let prev_reserves: u128 = req
            .prev_reserves
            .parse()
            .map_err(|e| Status::invalid_argument(format!("bad prev_reserves: {e}")))?;

        let mut witness = Witness {
            leaf_ids,
            leaf_balances,
            reserves,
            prev_reserves,
        };

        let bundle = self.prover.prove(&witness).map_err(proving_error_to_status);
        witness.zeroize();
        let bundle = bundle?;

        Ok(Response::new(ProveResponse {
            proof: bundle.proof,
            public_inputs: Some(pb::PublicInputs {
                reserves_total: bundle.reserves_total.to_string(),
                liabilities_total: bundle.liabilities_total.to_string(),
                root_hash: hex::encode(bundle.root_hash),
                prev_reserves: bundle.prev_reserves.to_string(),
            }),
            serialized_tree: bundle.serialized_tree,
        }))
    }
}

fn proving_error_to_status(e: ProvingError) -> Status {
    match &e {
        ProvingError::WitnessAssembly(_) => Status::invalid_argument(e.to_string()),
        ProvingError::ProofGeneration(_) => Status::internal(e.to_string()),
    }
}
