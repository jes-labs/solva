# Solva cross-language task runner.
# Each tier owns its native tooling. This file wires them together.

set shell := ["bash", "-uc"]

# List available recipes.
default:
    @just --list

# Bring up Postgres and Redis, compile circuits, then start every service.
dev:
    docker compose -f infra/docker-compose.yml up -d
    just build-circuits
    just dev-prover & just dev-orchestrator & just dev-sandbox & turbo run dev

# Compile the Noir circuits.
build-circuits:
    cd circuits/solvency && nargo compile
    cd circuits/merkle && nargo compile

# Run the Rust prover service.
dev-prover:
    cargo run -p solva-prover

# Run the Go orchestrator.
dev-orchestrator:
    cd services/orchestrator && go run ./cmd/app

# Run the mock Open Banking sandbox.
dev-sandbox:
    cd services/sandbox && go run ./cmd/app

# Generate gRPC stubs for Go and Rust from proto/prover.proto.
proto:
    buf generate

# Build the Soroban contract to wasm.
build-contract:
    stellar contract build

# Deploy the contract to testnet. Requires a funded identity.
deploy-contract network="testnet":
    stellar contract deploy --wasm target/wasm32v1-none/release/proof_registry.wasm --network {{network}}

# Regenerate the TypeScript contract bindings after a contract change.
gen-bindings:
    stellar contract bindings typescript --output-dir packages/contract-bindings/src/generated --overwrite

# Run every test suite across all languages.
test:
    cd circuits/solvency && nargo test
    cd circuits/merkle && nargo test
    cargo test --workspace
    cd services/orchestrator && go test ./...
    cd services/sandbox && go test ./...
    turbo run test

# Lint and format check across all languages.
lint:
    cargo clippy --workspace -- -D warnings
    cd services/orchestrator && go vet ./...
    cd services/sandbox && go vet ./...
    turbo run lint

# Tear down local infrastructure.
down:
    docker compose -f infra/docker-compose.yml down
