mod proving;
mod service;
mod tree;
mod tree_parity_tests;
pub mod pb {
    tonic::include_proto!("solva.prover.v1");
}
use service::ProverService;
use std::net::SocketAddr;

use crate::pb::prover_server::ProverServer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let addr: SocketAddr = std::env::var("PROVER_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:50051".to_string())
        .parse()?;

    let artifacts_dir =
        std::env::var("CIRCUIT_ARTIFACTS_DIR").unwrap_or_else(|_| "artifacts".to_string());
    let svc = ProverService::new(&artifacts_dir)?;

    tracing::info!(%addr, "starting solva prover gRPC server");

    tonic::transport::Server::builder()
        .add_service(ProverServer::new(svc))
        .serve(addr)
        .await?;

    Ok(())
}
