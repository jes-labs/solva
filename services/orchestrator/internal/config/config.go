// Package config loads orchestrator settings from the environment. It keeps
// configuration in one place so the rest of the service takes plain values.
package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/stellar/go/network"
)

// Config holds every setting the orchestrator needs to start.
type Config struct {
	// HTTPAddr is the listen address for the REST API, for example ":8080".
	HTTPAddr string
	// PostgresURL is the pgx connection string.
	PostgresURL string
	// RedisURL is the go-redis connection string.
	RedisURL string
	// ProverAddr is the gRPC address of the Rust prover.
	ProverAddr string
	// ProverTLS enables TLS transport credentials for the prover gRPC
	// connection, for a prover reachable over a TLS endpoint (e.g. Cloud Run).
	ProverTLS bool
	// ProverToken, if set, is sent as a Bearer token in prover gRPC calls.
	ProverToken string
	// StellarRPCURL is the Soroban RPC endpoint used to publish proofs.
	StellarRPCURL string
	// StellarNetworkPassphrase selects the network proofs are published to.
	StellarNetworkPassphrase string
	// StellarSignerSecret is the publisher key that signs publish_proof
	// invocations. In production this comes from KMS, never a checked-in value.
	StellarSignerSecret string
	// ReserveBaseURL is the attested reserve source's base URL.
	ReserveBaseURL string
	// ReservePublicKeyPEM is the PEM-encoded P-256 public key used to verify
	// signed reserve balance responses.
	ReservePublicKeyPEM string
	// ReserveAccounts is the set of reserve-source account ids read each cycle.
	// Per-tenant resolution from reserve_sources lands later; for now the set
	// is configured directly.
	ReserveAccounts []string
	// ReserveClientID is the OAuth client id the adapter authenticates with. Empty
	// disables auth, which the adapter unit tests rely on.
	ReserveClientID string
	// CycleInterval is how often the scheduler triggers a cycle per tenant.
	CycleInterval time.Duration
	// SchedulerEnabled controls whether the background cron scheduler starts.
	// Set ORCH_SCHEDULER_ENABLED=true to activate it. Disabled by default so
	// the HTTP-only deployment (e.g. for testing) does not start background work.
	SchedulerEnabled bool
	// LogLevel is the zerolog level, for example "info" or "debug".
	LogLevel string
	// AdminToken gates the control-plane provisioning routes (POST /v1/tenants,
	// PUT /v1/tenants/{id}/contract): a caller must send it as a Bearer token.
	// Left empty, the check is skipped, matching ReserveClientID's "empty disables
	// it" convention — fine for local dev, never for a real deployment.
	AdminToken string
}

// Load reads configuration from the environment and applies defaults suitable
// for local development.
func Load() (Config, error) {
	cfg := Config{
		HTTPAddr:                 env("ORCH_HTTP_ADDR", ":8080"),
		PostgresURL:              env("ORCH_POSTGRES_URL", "postgres://solva:solva@localhost:5432/solva?sslmode=disable"),
		RedisURL:                 env("ORCH_REDIS_URL", "redis://localhost:6379/0"),
		ProverAddr:               env("ORCH_PROVER_ADDR", "localhost:50051"),
		StellarRPCURL:            env("ORCH_STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
		StellarNetworkPassphrase: env("ORCH_STELLAR_NETWORK_PASSPHRASE", network.TestNetworkPassphrase),
		StellarSignerSecret:      env("ORCH_STELLAR_SIGNER_SECRET", ""),
		ReserveBaseURL:           env("ORCH_RESERVE_BASE_URL", "http://localhost:8090"),
		ReservePublicKeyPEM:      env("ORCH_RESERVE_PUBLIC_KEY_PEM", ""),
		ReserveAccounts:          splitList(env("ORCH_RESERVE_ACCOUNTS", "acct-anchor,acct-beacon,acct-cedar")),
		ReserveClientID:          env("ORCH_RESERVE_CLIENT_ID", "solva-orchestrator"),
		SchedulerEnabled:         env("ORCH_SCHEDULER_ENABLED", "false") == "true",
		LogLevel:                 env("ORCH_LOG_LEVEL", "info"),
		ProverTLS:                env("ORCH_PROVER_TLS", "false") == "true",
		ProverToken:              env("ORCH_PROVER_TOKEN", ""),
		AdminToken:               env("ORCH_ADMIN_TOKEN", ""),
	}

	interval, err := time.ParseDuration(env("ORCH_CYCLE_INTERVAL", "1h"))
	if err != nil {
		return Config{}, fmt.Errorf("parse ORCH_CYCLE_INTERVAL: %w", err)
	}
	cfg.CycleInterval = interval

	return cfg, nil
}

func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// splitList parses a comma-separated env value into a trimmed, non-empty list.
func splitList(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
