// Package config loads sandbox settings from the environment.
package config

import "os"

// Config holds the sandbox's settings.
type Config struct {
	// HTTPAddr is the listen address, for example ":8090".
	HTTPAddr string
	// SigningKeyPEM is the PEM-encoded P-256 private key used to sign balance
	// payloads. Empty means generate an ephemeral key at boot and log its
	// public half so the orchestrator can be configured to match.
	SigningKeyPEM string
	// LogLevel is the zerolog level.
	LogLevel string
}

// Load reads configuration with local-development defaults.
func Load() Config {
	return Config{
		HTTPAddr:      env("SANDBOX_HTTP_ADDR", ":8090"),
		SigningKeyPEM: env("SANDBOX_SIGNING_KEY_PEM", ""),
		LogLevel:      env("SANDBOX_LOG_LEVEL", "info"),
	}
}

func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
