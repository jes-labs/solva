// gRPC service implementation.
//
// Wires the generated Prover trait to the tree builder and the UltraHonk prover.
// The witness holds secret balances, so this layer zeroizes its copy as soon as
// proving returns, matching the security requirement that witness data never
// lingers after the proof.

use tonic::{Request, Response, Status};
use zeroize::Zeroize;

use crate::proving::{self, Witness};
use crate::tree::MerkleSumTree;

// Generated server stubs from proto/prover.proto. The package is
// solva.prover.v1, so tonic emits this module path.
pub mod pb {
    tonic::include_proto!("solva.prover.v1");
}

use pb::prover_server::Prover;
use pb::{ProveRequest, ProveResponse, PublicInputs};

// Stateless prover handler. Horizontal scaling just runs more of these.
#[derive(Default)]
pub struct ProverService;

#[tonic::async_trait]
impl Prover for ProverService {
    async fn prove(
        &self,
        request: Request<ProveRequest>,
    ) -> Result<Response<ProveResponse>, Status> {
        let req = request.into_inner();

        // TODO(proving): parse decimal-string balances into u128 minor units and
        // build the leaf nodes with the circuit's Poseidon2 leaf hashing. The
        // tree and witness assembly are stubbed until the backend lands, so we
        // build empty placeholders to exercise the zeroize path and the wiring.
        let reserves: Vec<u128> = Vec::new();
        let liabilities: Vec<u128> = Vec::new();
        let prev_reserves: u128 = 0;

        let tree = MerkleSumTree::build(placeholder_leaves());

        let mut witness: Witness =
            proving::assemble_witness(&reserves, &liabilities, prev_reserves, &tree);

        let prove_result = proving::prove(&witness);

        // Zeroize the secret witness copy before doing anything else, success or
        // failure. After this point the balances are gone from this stack frame.
        zeroize_witness(&mut witness);

        let bundle = prove_result.map_err(|e| Status::internal(e.to_string()))?;

        let public_inputs = PublicInputs {
            reserves_total: bundle.reserves_total.to_string(),
            liabilities_total: bundle.liabilities_total.to_string(),
            root_hash: encode_hex(&bundle.root_hash),
            prev_reserves: bundle.prev_reserves.to_string(),
        };

        // TODO(proving): serialize the real tree to JSON for the audit log and
        // inclusion paths once leaf hashing is wired.
        let serialized_tree = Vec::new();

        Ok(Response::new(ProveResponse {
            proof: bundle.proof,
            public_inputs: Some(public_inputs),
            serialized_tree,
        }))
    }
}

// Placeholder leaf set so the tree wiring compiles before real hashing lands.
fn placeholder_leaves() -> Vec<crate::tree::Node> {
    vec![crate::tree::Node {
        hash: [0u8; 32],
        sum: 0,
    }]
}

// Zeroes the secret fields of the witness. Vec<u128> and the scalar fields all
// implement Zeroize, so this clears the heap and stack copies.
fn zeroize_witness(witness: &mut Witness) {
    witness.private_balances.zeroize();
    witness.reserves_total.zeroize();
    witness.liabilities_total.zeroize();
    witness.root_hash.zeroize();
    witness.prev_reserves.zeroize();
}

// Small local hex helper for the root hash so we avoid pulling another crate.
fn encode_hex(bytes: &[u8; 32]) -> String {
    let mut s = String::with_capacity(64);
    for b in bytes {
        s.push_str(&format!("{b:02x}"));
    }
    s
}
