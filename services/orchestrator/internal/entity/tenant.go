package entity

import "time"

// Tenant is an institution that runs proof cycles on Solva.
type Tenant struct {
	// ID is the tenant identifier.
	ID string
	// Name is the institution's display name.
	Name string
	// Plan is the billing tier, for example "free" or "pro".
	Plan string
	// CreatedAt is when the tenant was provisioned.
	CreatedAt time.Time
}

// TenantContract is the on-chain home for a tenant's proofs: the deployed
// proof-registry contract and the Stellar network it lives on. A tenant has one
// once it is provisioned (epic #124).
type TenantContract struct {
	// ContractID is the deployed proof-registry address, C... strkey.
	ContractID string
	// Network is the Stellar network the contract lives on, for example "testnet".
	Network string
}
