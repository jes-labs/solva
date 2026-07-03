package repo

import (
	"context"
	"errors"
	"testing"
)

func TestResolveTenantContract(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	q := New(store.pool)

	tenantID, err := q.CreateTenant(ctx, CreateTenantParams{Name: "Meridian Bank", Plan: "growth"})
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	tid := fromUUID(tenantID)

	// A fresh tenant has no contract yet: a distinct, handled state.
	if _, err := store.ResolveTenantContract(ctx, tid); !errors.Is(err, ErrTenantNotProvisioned) {
		t.Fatalf("unprovisioned tenant: got %v, want ErrTenantNotProvisioned", err)
	}

	// After provisioning, the contract and network resolve.
	const contractID = "CB56V5BNNNP5SFFW2D4ZIDVHZUFEJVBNOSKWBXFGVDMHXCM7LK3OCRYV"
	if err := store.SetTenantContract(ctx, tid, contractID, "testnet"); err != nil {
		t.Fatalf("set tenant contract: %v", err)
	}
	got, err := store.ResolveTenantContract(ctx, tid)
	if err != nil {
		t.Fatalf("resolve after set: %v", err)
	}
	if got.ContractID != contractID || got.Network != "testnet" {
		t.Fatalf("resolved %+v, want {%s testnet}", got, contractID)
	}
}

func TestResolveTenantContractUnknownTenant(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)

	// A random, non-existent tenant id is ErrNotFound, not ErrTenantNotProvisioned.
	_, err := store.ResolveTenantContract(ctx, "11111111-1111-1111-1111-111111111111")
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("unknown tenant: got %v, want ErrNotFound", err)
	}
}

// CreateTenant inserts a fresh tenant row with no contract: the
// control-plane provisioning write the HTTP layer's POST /v1/tenants exposes.
func TestCreateTenant(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)

	tenant, err := store.CreateTenant(ctx, "Meridian Bank", "growth")
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	if tenant.Name != "Meridian Bank" || tenant.Plan != "growth" || tenant.ID == "" {
		t.Fatalf("created tenant = %+v, want name/plan set and a non-empty id", tenant)
	}

	// Fresh tenant, no contract yet.
	if _, err := store.ResolveTenantContract(ctx, tenant.ID); !errors.Is(err, ErrTenantNotProvisioned) {
		t.Fatalf("fresh tenant: got %v, want ErrTenantNotProvisioned", err)
	}
}

// SetTenantWallet records the passkey smart-wallet account that owns the tenant's
// registry (#131), readable back on the tenant row.
func TestSetTenantWallet(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	q := New(store.pool)

	tenantID, err := q.CreateTenant(ctx, CreateTenantParams{Name: "Meridian Bank", Plan: "growth"})
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}

	const wallet = "CBX5EJPO6Y4SL3LEAKCZBT4QKWBPFI4LMOUUFQ5KDY4YQ3RA6PPUFU7J"
	if err := store.SetTenantWallet(ctx, fromUUID(tenantID), wallet); err != nil {
		t.Fatalf("set tenant wallet: %v", err)
	}
	got, err := q.GetTenantWallet(ctx, tenantID)
	if err != nil {
		t.Fatalf("get tenant wallet: %v", err)
	}
	if !got.Valid || got.String != wallet {
		t.Fatalf("wallet = %+v, want %s", got, wallet)
	}
}
