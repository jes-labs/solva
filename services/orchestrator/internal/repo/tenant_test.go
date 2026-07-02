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
