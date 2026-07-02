mod proving;
mod service;
mod tree;
mod tree_parity_tests;
pub mod pb {
    tonic::include_proto!("solva.prover.v1");
}
use std::net::SocketAddr;
use std::time::Duration;

use tonic::transport::Server;
use tonic::{Request, Status};

use crate::pb::prover_server::ProverServer;
use service::ProverService;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(120);
const MAX_CONCURRENCY: usize = 4;

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

    let token = std::env::var("PROVER_API_TOKEN").unwrap_or_default();
    if token.is_empty() {
        tracing::warn!("PROVER_API_TOKEN is empty: the prover gRPC API is UNAUTHENTICATED");
    }

    tracing::info!(%addr, "starting solva prover gRPC server");

    Server::builder()
        .timeout(REQUEST_TIMEOUT)
        .concurrency_limit_per_connection(MAX_CONCURRENCY)
        .add_service(ProverServer::with_interceptor(
            svc,
            move |req: Request<()>| authorize(req, &token),
        ))
        .serve(addr)
        .await?;

    Ok(())
}

// authorize checks the bearer token when one is configured; empty disables it.
// The large-Err return is tonic's Status, required by the interceptor signature.
#[allow(clippy::result_large_err)]
fn authorize(req: Request<()>, token: &str) -> Result<Request<()>, Status> {
    if token.is_empty() {
        return Ok(req);
    }
    let ok = req
        .metadata()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|got| ct_eq(got, token))
        .unwrap_or(false);
    if ok {
        Ok(req)
    } else {
        Err(Status::unauthenticated("invalid token"))
    }
}

// Constant-time compare; token length is fixed, so a length leak is fine.
fn ct_eq(a: &str, b: &str) -> bool {
    let (a, b) = (a.as_bytes(), b.as_bytes());
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}
