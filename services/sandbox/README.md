# Solva Sandbox (Go)

The sandbox is a first-class mock Open Banking product, not a throwaway stub. It
stands in for real bank APIs during development and demos, and it gives Solva a
deterministic, signed source of reserve balances.

## What it provides

- **OAuth 2.0 consent flow.** `GET /oauth/authorize` issues a one-time
  authorization code; `POST /oauth/token` exchanges it for a bearer token.
- **Signed balances.** `GET /v1/accounts/{id}/balance` returns an ECDSA-signed
  payload. The signature is the cryptographic substitute for blockchain
  immutability: it lets the orchestrator prove a balance came from the bank and
  was not altered in transit.
- **Mock banks.** Three banks (`bank-anchor`, `bank-beacon`, `bank-cedar`) with
  configurable account balances.
- **Scenario seeding.** `POST /admin/scenarios/{name}` sets all balances to a
  named state for deterministic demos: `solvent`, `near-breach`, `insolvent`.
- **Key discovery.** `GET /.well-known/solva-signing-key.pem` exports the public
  key the orchestrator verifies against.

## Signing scheme

The signature scheme is fixed and must match the orchestrator's verifier:

- curve P-256 (secp256r1),
- SHA-256 over the canonical JSON payload,
- ASN.1 DER signature, base64-encoded in the response.

The canonical payload is the balance fields with keys sorted and the signature
field excluded. The orchestrator rebuilds the same bytes and verifies. See
`internal/bank/payload.go` here and the matching code in the orchestrator's
`banks` package.

## Modules

- `internal/signer`: P-256 key handling and signing.
- `internal/bank`: mock bank registry, scenarios, canonical payload.
- `internal/oauth`: authorization-code flow.
- `internal/server`: HTTP handlers wiring the three together.

## Run

```
go run ./cmd/app
```

With no `SANDBOX_SIGNING_KEY_PEM` set, the sandbox generates an ephemeral key and
logs its public PEM at boot. Configure the orchestrator's
`ORCH_BANK_PUBLIC_KEY_PEM` with that value so signatures verify. Pin the key in
both services for stable demos.
