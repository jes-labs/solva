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
	// StellarRPCURL is the Soroban RPC endpoint used to publish proofs.
	StellarRPCURL string
	// StellarContractID is the deployed proof-registry contract address.
	StellarContractID string
	// StellarNetworkPassphrase selects the network proofs are published to.
	StellarNetworkPassphrase string
	// StellarSignerSecret is the publisher key that signs publish_proof
	// invocations. In production this comes from KMS, never a checked-in value.
	StellarSignerSecret string
	// BankBaseURL is the sandbox Open Banking base URL.
	BankBaseURL string
	// BankPublicKeyPEM is the PEM-encoded P-256 public key used to verify
	// signed bank balance responses.
	BankPublicKeyPEM string
	// BankAccounts is the set of reserve-source account ids read each cycle.
	// Per-tenant resolution from reserve_sources lands later; for now the set
	// is configured directly.
	BankAccounts []string
	// BankClientID is the OAuth client id the adapter authenticates with. Empty
	// disables auth, which the adapter unit tests rely on.
	BankClientID string
	// CycleInterval is how often the scheduler triggers a cycle per tenant.
	CycleInterval time.Duration
	// SchedulerEnabled controls whether the background cron scheduler starts.
	// Set ORCH_SCHEDULER_ENABLED=true to activate it. Disabled by default so
	// the HTTP-only deployment (e.g. for testing) does not start background work.
	SchedulerEnabled bool
	// LogLevel is the zerolog level, for example "info" or "debug".
	LogLevel string
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
		StellarContractID:        env("ORCH_STELLAR_CONTRACT_ID", "CAYWB2IMDG753S3YF7DKVNLD7WBROYSP3JP5HEJET77W53UBWRD7ZX3Z"),
		StellarNetworkPassphrase: env("ORCH_STELLAR_NETWORK_PASSPHRASE", network.TestNetworkPassphrase),
		StellarSignerSecret:      env("ORCH_STELLAR_SIGNER_SECRET", ""),
		BankBaseURL:              env("ORCH_BANK_BASE_URL", "http://localhost:8090"),
		BankPublicKeyPEM:         env("ORCH_BANK_PUBLIC_KEY_PEM", ""),
		BankAccounts:             splitList(env("ORCH_BANK_ACCOUNTS", "acct-anchor,acct-beacon,acct-cedar")),
		BankClientID:             env("ORCH_BANK_CLIENT_ID", "solva-orchestrator"),
		SchedulerEnabled:         env("ORCH_SCHEDULER_ENABLED", "false") == "true",
		LogLevel:                 env("ORCH_LOG_LEVEL", "info"),
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
