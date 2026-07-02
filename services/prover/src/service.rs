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
        // Reject oversized input before parsing or shelling out to nargo.
        if req.liabilities.len() > proving::N {
            return Err(Status::invalid_argument(format!(
                "too many liabilities: max {}",
                proving::N
            )));
        }
        if req.reserves.len() > proving::M {
            return Err(Status::invalid_argument(format!(
                "too many reserves: max {}",
                proving::M
            )));
        }

        let leaf_ids = req
            .liabilities
            .iter()
            .map(|l| proving::parse_field(&l.customer_id_hash))
            .collect::<Result<Vec<_>, _>>()
            .map_err(proving_error_to_status)?;

        // Balances are u64 in the circuit; parse as u64 so an out-of-range value
        // is rejected here, not deep in nargo.
        let leaf_balances =
            req.liabilities
                .iter()
                .map(|l| {
                    l.balance.parse::<u64>().map(u128::from).map_err(|e| {
                        Status::invalid_argument(format!("bad liability balance: {e}"))
                    })
                })
                .collect::<Result<Vec<_>, _>>()?;

        let reserves = req
            .reserves
            .iter()
            .map(|r| {
                r.balance
                    .parse::<u64>()
                    .map(u128::from)
                    .map_err(|e| Status::invalid_argument(format!("bad reserve balance: {e}")))
            })
            .collect::<Result<Vec<_>, _>>()?;

        let prev_reserves = req
            .prev_reserves
            .parse::<u64>()
            .map(u128::from)
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pb::{Liability, Reserve};

    fn reserve(balance: &str) -> Reserve {
        Reserve {
            source_id: "r".into(),
            balance: balance.into(),
        }
    }

    fn liability(i: u64) -> Liability {
        Liability {
            customer_id_hash: i.to_string(),
            balance: "1".into(),
        }
    }

    #[tokio::test]
    async fn rejects_too_many_liabilities() {
        let svc = ProverService::new("circuits/solvency");
        let req = ProveRequest {
            liabilities: (0..=(proving::N as u64)).map(liability).collect(),
            reserves: vec![reserve("10")],
            prev_reserves: "10".into(),
            tree_depth: 3,
        };
        let err = svc.prove(Request::new(req)).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }

    #[tokio::test]
    async fn rejects_balance_above_u64() {
        let svc = ProverService::new("circuits/solvency");
        let req = ProveRequest {
            liabilities: vec![liability(1)],
            reserves: vec![reserve(&(u128::from(u64::MAX) + 1).to_string())],
            prev_reserves: "10".into(),
            tree_depth: 3,
        };
        let err = svc.prove(Request::new(req)).await.unwrap_err();
        assert_eq!(err.code(), tonic::Code::InvalidArgument);
    }
}
