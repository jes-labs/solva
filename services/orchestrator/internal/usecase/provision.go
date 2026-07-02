package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// ErrInvalidNetwork means SetTenantContract was called with a network outside
// the small fixed set Solva deploys to. Caught here so a typo never silently
// points a tenant's reads and publishes at the wrong Stellar network.
var ErrInvalidNetwork = errors.New("usecase: network must be testnet, mainnet, or local")

// validNetworks mirrors the SDK's Network type (packages/sdk-ts/src/config.ts)
// so a tenant's recorded network is always one the SDK and oracle can resolve.
var validNetworks = map[string]bool{"testnet": true, "mainnet": true, "local": true}

// Provision is the control-plane use case behind tenant onboarding: creating
// the tenant row, then recording the on-chain contract once it is deployed.
// It does not deploy contracts itself — that stays an explicit, auditable step
// (an operator running `just provision-tenant`, or a future deploy worker) —
// it only owns the two database writes that make a tenant usable.
type Provision struct {
	tenants TenantRepo
}

// NewProvision wires the use case to its repo.
func NewProvision(tenants TenantRepo) *Provision {
	return &Provision{tenants: tenants}
}

// CreateTenant registers a new institution. The tenant has no contract yet:
// every consumer's institution-to-contract resolution treats that as "not
// provisioned" (ErrTenantNotProvisioned) until SetTenantContract is called.
func (p *Provision) CreateTenant(ctx context.Context, name, plan string) (entity.Tenant, error) {
	if name == "" {
		return entity.Tenant{}, fmt.Errorf("name is required")
	}
	if plan == "" {
		plan = "free"
	}
	t, err := p.tenants.CreateTenant(ctx, name, plan)
	if err != nil {
		return entity.Tenant{}, fmt.Errorf("create tenant: %w", err)
	}
	return t, nil
}

// SetTenantContract records the tenant's deployed proof-registry contract and
// network, completing provisioning. Called once the contract from
// `just provision-tenant` (or any equivalent deploy step) is on-chain.
func (p *Provision) SetTenantContract(ctx context.Context, tenantID, contractID, network string) error {
	if contractID == "" {
		return fmt.Errorf("contract_id is required")
	}
	if !validNetworks[network] {
		return ErrInvalidNetwork
	}
	if err := p.tenants.SetTenantContract(ctx, tenantID, contractID, network); err != nil {
		return fmt.Errorf("set tenant contract: %w", err)
	}
	return nil
}
