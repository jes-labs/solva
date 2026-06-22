// Solva prover service entrypoint.
//
// Starts the tonic gRPC server exposing the Prover service. The orchestrator
// calls Prove with the witness; this service builds the Poseidon2 Merkle Sum
// Tree and generates the UltraHonk proof. It owns the entire ZK-critical path.

mod proving;
mod service;
mod tree;
mod tree_parity_tests;

use std::net::SocketAddr;

use service::pb::prover_server::ProverServer;
use service::ProverService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // Bind address. Defaults to all interfaces on 50051 for container use.
    let addr: SocketAddr = std::env::var("PROVER_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:50051".to_string())
        .parse()?;

    tracing::info!(%addr, "starting solva prover gRPC server");

    tonic::transport::Server::builder()
        .add_service(ProverServer::new(ProverService))
        .serve(addr)
        .await?;

    Ok(())
}
