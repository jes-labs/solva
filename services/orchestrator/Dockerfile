# Orchestrator service image. A static Go binary on distroless (CA certs
# included for the HTTPS calls to Soroban RPC and the bank). Build from the
# module directory:
#
#   docker build -f services/orchestrator/Dockerfile -t solva-orchestrator services/orchestrator

FROM golang:1.25-bookworm AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/orchestrator ./cmd/app

FROM gcr.io/distroless/static-debian12
COPY --from=builder /out/orchestrator /usr/local/bin/orchestrator
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/orchestrator"]
