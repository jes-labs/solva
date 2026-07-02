package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// stubTenantRepo is a minimal in-memory TenantRepo for testing Provision
// without a database.
type stubTenantRepo struct {
	created         entity.Tenant
	createErr       error
	setContractErr  error
	gotTenantID     string
	gotContract     string
	gotNetwork      string
}

func (s *stubTenantRepo) ListTenants(context.Context) ([]entity.Tenant, error) {
	return nil, nil
}

func (s *stubTenantRepo) CreateTenant(_ context.Context, name, plan string) (entity.Tenant, error) {
	if s.createErr != nil {
		return entity.Tenant{}, s.createErr
	}
	return entity.Tenant{ID: "tenant-1", Name: name, Plan: plan}, nil
}

func (s *stubTenantRepo) SetTenantContract(_ context.Context, tenantID, contractID, network string) error {
	s.gotTenantID, s.gotContract, s.gotNetwork = tenantID, contractID, network
	return s.setContractErr
}

func TestProvisionCreateTenantDefaultsPlan(t *testing.T) {
	repo := &stubTenantRepo{}
	p := NewProvision(repo)

	tenant, err := p.CreateTenant(context.Background(), "Meridian Bank", "")
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	if tenant.Plan != "free" {
		t.Fatalf("plan = %q, want default %q", tenant.Plan, "free")
	}
}

func TestProvisionCreateTenantRequiresName(t *testing.T) {
	p := NewProvision(&stubTenantRepo{})
	if _, err := p.CreateTenant(context.Background(), "", "growth"); err == nil {
		t.Fatal("expected an error for an empty name")
	}
}

func TestProvisionSetTenantContractRejectsUnknownNetwork(t *testing.T) {
	repo := &stubTenantRepo{}
	p := NewProvision(repo)

	err := p.SetTenantContract(context.Background(), "tenant-1", "CCONTRACT", "devnet")
	if !errors.Is(err, ErrInvalidNetwork) {
		t.Fatalf("got %v, want ErrInvalidNetwork", err)
	}
}

func TestProvisionSetTenantContractRequiresContractID(t *testing.T) {
	p := NewProvision(&stubTenantRepo{})
	err := p.SetTenantContract(context.Background(), "tenant-1", "", "testnet")
	if err == nil {
		t.Fatal("expected an error for an empty contract id")
	}
}

func TestProvisionSetTenantContractPassesThrough(t *testing.T) {
	repo := &stubTenantRepo{}
	p := NewProvision(repo)

	if err := p.SetTenantContract(context.Background(), "tenant-1", "CCONTRACT", "testnet"); err != nil {
		t.Fatalf("set tenant contract: %v", err)
	}
	if repo.gotTenantID != "tenant-1" || repo.gotContract != "CCONTRACT" || repo.gotNetwork != "testnet" {
		t.Fatalf("repo got (%q, %q, %q)", repo.gotTenantID, repo.gotContract, repo.gotNetwork)
	}
}
