// Compiles the shared prover proto into Rust server stubs at build time.
// The proto is the single source of the gRPC contract with the Go orchestrator.
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_client(false)
        .build_server(true)
        .compile_protos(&["../../proto/prover.proto"], &["../../proto"])?;
    Ok(())
}
