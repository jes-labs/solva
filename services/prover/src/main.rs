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

    // PROVER_ADDR wins (local, docker-compose, e2e). Otherwise honor PORT, which
    // Cloud Run and similar platforms inject and expect the server to bind on
    // 0.0.0.0. Fall back to the default gRPC port for a bare `cargo run`.
    let addr: SocketAddr = match std::env::var("PROVER_ADDR") {
        Ok(a) => a.parse()?,
        Err(_) => {
            let port = std::env::var("PORT").unwrap_or_else(|_| "50051".to_string());
            format!("0.0.0.0:{port}").parse()?
        }
    };

    let circuit_dir =
        std::env::var("SOLVA_CIRCUIT_DIR").unwrap_or_else(|_| "circuits/solvency".to_string());
    let svc = ProverService::new(circuit_dir);

    tracing::info!(%addr, "starting solva prover gRPC server");

    tonic::transport::Server::builder()
        .add_service(ProverServer::new(svc))
        .serve(addr)
        .await?;

    Ok(())
}
