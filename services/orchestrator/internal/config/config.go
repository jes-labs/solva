// Package config loads orchestrator settings from the environment. It keeps
// configuration in one place so the rest of the service takes plain values.
package config

import (
	"fmt"
	"os"
	"time"
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
	// BankBaseURL is the sandbox Open Banking base URL.
	BankBaseURL string
	// BankPublicKeyPEM is the PEM-encoded P-256 public key used to verify
	// signed bank balance responses.
	BankPublicKeyPEM string
	// CycleInterval is how often the scheduler triggers a cycle per tenant.
	CycleInterval time.Duration
	// LogLevel is the zerolog level, for example "info" or "debug".
	LogLevel string
}

// Load reads configuration from the environment and applies defaults suitable
// for local development.
func Load() (Config, error) {
	cfg := Config{
		HTTPAddr:         env("ORCH_HTTP_ADDR", ":8080"),
		PostgresURL:      env("ORCH_POSTGRES_URL", "postgres://solva:solva@localhost:5432/solva?sslmode=disable"),
		RedisURL:         env("ORCH_REDIS_URL", "redis://localhost:6379/0"),
		ProverAddr:       env("ORCH_PROVER_ADDR", "localhost:50051"),
		StellarRPCURL:    env("ORCH_STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
		BankBaseURL:      env("ORCH_BANK_BASE_URL", "http://localhost:8090"),
		BankPublicKeyPEM: env("ORCH_BANK_PUBLIC_KEY_PEM", ""),
		LogLevel:         env("ORCH_LOG_LEVEL", "info"),
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
