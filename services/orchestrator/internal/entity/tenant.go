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
