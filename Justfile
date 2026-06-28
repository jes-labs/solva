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

# Assemble the prover's runtime artifacts into ./artifacts:
#   solva.json  the compiled solvency circuit (renamed from nargo's output)
#   g1.dat g2.dat  the BN254 CRS that bb downloads to ~/.bb-crs
# Requires the pinned nargo and bb (see circuits/README.md). bb write_vk needs
# no witness; it is the witness-free way to trigger the CRS download.
build-artifacts:
    #!/usr/bin/env bash
    set -euo pipefail
    # nargo and bb install outside the default PATH; add them so this runs from
    # just, CI, or any non-interactive shell, not only an interactive one.
    export PATH="$HOME/.bb:$HOME/.nargo/bin:$PATH"
    ( cd circuits/solvency && nargo compile )
    ( cd circuits/solvency && bb write_vk --scheme ultra_honk --oracle_hash keccak \
        --bytecode_path target/solva_solvency.json \
        --output_path target --output_format bytes_and_fields )
    mkdir -p artifacts
    cp circuits/solvency/target/solva_solvency.json artifacts/solva.json
    cp "$HOME/.bb-crs/bn254_g1.dat" artifacts/g1.dat
    cp "$HOME/.bb-crs/bn254_g2.dat" artifacts/g2.dat
    echo "artifacts assembled: artifacts/{solva.json,g1.dat,g2.dat}"

# Run the Rust prover service.
dev-prover:
    cargo run -p solva-prover

# Run the Go orchestrator.
dev-orchestrator:
    cd services/orchestrator && go run ./cmd/app

# Run the mock Open Banking sandbox.
dev-sandbox:
    cd services/sandbox && go run ./cmd/app

# Build the Soroban contract to wasm.
build-contract:
    stellar contract build

# Deploy the contract to testnet. Requires a funded identity.
# The constructor takes the registry owner (the account allowed to publish) and
# the embedded solvency verifying key. The deployed contract id is written to
# contracts/proof-registry/.contract_id.
deploy-contract network="testnet" owner="solva-spike":
    stellar contract deploy \
      --wasm target/wasm32v1-none/release/proof_registry.wasm \
      --source {{owner}} \
      --network {{network}} \
      -- \
      --owner {{owner}} \
      --vk-file-path contracts/proof-registry/src/testdata/solvency_vk.bin \
      | tail -1 | tee contracts/proof-registry/.contract_id

# Regenerate the TypeScript contract bindings from the deployed contract. The
# CLI fetches the interface from the network using the id in .contract_id.
gen-bindings network="testnet":
    stellar contract bindings typescript \
      --network {{network}} \
      --id "$(cat contracts/proof-registry/.contract_id)" \
      --output-dir packages/contract-bindings/src/generated \
      --overwrite

# Regenerate the sqlc database layer after changing query/ or migrations/.
sqlc:
    cd services/orchestrator && sqlc generate

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

# End-to-end test: sandbox -> orchestrator -> prover -> contract on Testnet,
# across the solvent / near-breach / insolvent scenarios. Needs a funded
# Testnet identity that owns the contract: export E2E_STELLAR_SIGNER_SECRET.
# See scripts/e2e.sh for the full prerequisites.
e2e:
    bash scripts/e2e.sh

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

# Install the Go protoc plugins required by buf.gen.yaml.
_install-proto-plugins:
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate gRPC stubs for Go from proto/prover.proto.
# Rust stubs are generated automatically by the prover's build.rs (tonic-build).
proto: _install-proto-plugins
    buf generate
    @echo "✓ Go stubs regenerated → services/orchestrator/internal/infrastructure/grpc/proverpb"

# Check that committed Go stubs match what buf generate would produce.
# Run before opening a PR if you changed any .proto file.
proto-check: _install-proto-plugins
    #!/usr/bin/env bash
    set -euo pipefail
    buf generate
    if ! git diff --quiet -- services/orchestrator/internal/infrastructure/grpc/proverpb; then
        echo ""
        echo "Stale Go stubs detected. Run 'just proto' and commit the result."
        echo ""
        git diff -- services/orchestrator/internal/infrastructure/grpc/proverpb
        exit 1
    fi
    echo "✓ Go stubs are up to date."
