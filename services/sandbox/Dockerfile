# Mock open-banking sandbox image. A static Go binary on distroless. Build from
# the module directory:
#
#   docker build -f services/sandbox/Dockerfile -t solva-sandbox services/sandbox
#
# In production set SANDBOX_SIGNING_KEY_PEM to a fixed P-256 key so the bank's
# public key stays stable across restarts (the orchestrator is configured with
# the matching public key).

FROM golang:1.25-bookworm AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/sandbox ./cmd/app

FROM gcr.io/distroless/static-debian12
COPY --from=builder /out/sandbox /usr/local/bin/sandbox
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/sandbox"]
