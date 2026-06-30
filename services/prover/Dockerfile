# Reproducible prover image: the Rust gRPC server plus the pinned proving
# toolchain (Noir 1.0.0-beta.9, Barretenberg 0.87.0), the compiled circuit, and
# the BN254 CRS. Build from the repo root:
#
#   docker build -f services/prover/Dockerfile -t solva-prover .
#
# This removes the fragile host setup (PATH, bash 3.2, CRS download, version
# drift) the e2e fought with.

# ---- builder: compile the prover binary -------------------------------------
FROM rust:1.91.1-bookworm AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
      protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /src
# The prover is a workspace member, so the workspace manifest and every member
# must be present for cargo to resolve. Only solva-prover is built.
COPY Cargo.toml ./
COPY patches ./patches
COPY contracts ./contracts
COPY crates ./crates
COPY proto ./proto
COPY services/prover ./services/prover
RUN cargo build -p solva-prover --release

# ---- runtime: nargo + bb + CRS + compiled circuit + the binary --------------
FROM debian:bookworm-slim AS runtime
ENV DEBIAN_FRONTEND=noninteractive
# bb is a C++ binary (libstdc++, OpenMP); git lets nargo fetch circuit deps.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git libstdc++6 libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Pin the proving toolchain. noirup installs to ~/.nargo, bbup to ~/.bb.
ENV PATH="/root/.nargo/bin:/root/.bb:${PATH}"
RUN curl -fsSL https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash && \
    noirup -v 1.0.0-beta.9
RUN curl -fsSL https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash && \
    bbup -v 0.87.0

WORKDIR /app
# The circuit the prover runs nargo + bb against at runtime.
COPY circuits ./circuits
# Compile the circuit and pre-download the BN254 CRS into the image so the first
# proof needs no network. bb write_vk downloads the CRS without a witness.
RUN cd circuits/solvency && \
    nargo compile && \
    bb write_vk --scheme ultra_honk --oracle_hash keccak \
      --bytecode_path target/solva_solvency.json \
      --output_path target --output_format bytes_and_fields

COPY --from=builder /src/target/release/solva-prover /usr/local/bin/solva-prover

ENV SOLVA_CIRCUIT_DIR=/app/circuits/solvency
ENV PROVER_ADDR=0.0.0.0:50051
EXPOSE 50051
CMD ["solva-prover"]
