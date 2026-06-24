# Solva cross-language task runner.
# Each tier owns its native tooling. This file wires them together.

set shell := ["bash", "-uc"]

fmt-check:
  cargo fmt --all --check

fix:
  cargo fmt --all

lint-check:
  cargo clippy --workspace -- -D warnings

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

# Run `just parity-check` to execute all three parity gate tests.
# Runs the full Poseidon2 parity gate across all three layers.
# Step 0 is manual: run `just parity-print` first, populate the JSON, then run this.
parity-check: parity-circuit parity-prover parity-contract
    @echo "✓ All three Poseidon2 parity layers passed."

# Step 0 (manual, run once): print the ground-truth hash values from the Noir circuit.
# Copy the output into test-vectors/poseidon2_parity.json before running parity-check.
parity-print:
    cd circuits/lib && nargo test --show-output poseidon2_parity_print

# Layer 1 — Noir circuit
parity-circuit:
    cd circuits/lib && nargo test --package solva_lib poseidon2_parity

# Layer 2 — Rust prover
parity-prover:
    cargo test -p solva-prover poseidon2_parity -- --nocapture

# Layer 3 — Stellar contract
parity-contract:
    cargo test -p proof-registry poseidon2_parity -- --nocapture
