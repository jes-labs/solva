package config

import (
	"slices"
	"testing"
)

func TestLoadReadsReserveSourceSettings(t *testing.T) {
	t.Setenv("ORCH_RESERVE_BASE_URL", "http://reserves.test:8090")
	t.Setenv("ORCH_RESERVE_PUBLIC_KEY_PEM", "test-pem")
	t.Setenv("ORCH_RESERVE_ACCOUNTS", "acct-one, acct-two")
	t.Setenv("ORCH_RESERVE_CLIENT_ID", "client-test")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if cfg.ReserveBaseURL != "http://reserves.test:8090" {
		t.Errorf("ReserveBaseURL = %q", cfg.ReserveBaseURL)
	}
	if cfg.ReservePublicKeyPEM != "test-pem" {
		t.Errorf("ReservePublicKeyPEM = %q", cfg.ReservePublicKeyPEM)
	}
	if !slices.Equal(cfg.ReserveAccounts, []string{"acct-one", "acct-two"}) {
		t.Errorf("ReserveAccounts = %v", cfg.ReserveAccounts)
	}
	if cfg.ReserveClientID != "client-test" {
		t.Errorf("ReserveClientID = %q", cfg.ReserveClientID)
	}
}

func TestLoadIgnoresRemovedBankSettings(t *testing.T) {
	t.Setenv("ORCH_BANK_BASE_URL", "http://old.test")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if cfg.ReserveBaseURL == "http://old.test" {
		t.Errorf("ReserveBaseURL read the removed ORCH_BANK_BASE_URL")
	}
}

func TestLoadReadsAPIToken(t *testing.T) {
	t.Setenv("ORCH_API_TOKEN", "api-token-test")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if cfg.APIToken != "api-token-test" {
		t.Errorf("APIToken = %q", cfg.APIToken)
	}
}
