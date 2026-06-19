package entity

import "time"

// Reserve is a single reserve figure attested by one source, for example a
// bank balance or an on-chain holding. Balance is a decimal string of integer
// minor units.
type Reserve struct {
	// SourceID identifies the reserve source within the tenant.
	SourceID string
	// Balance is the attested amount, decimal string, integer minor units.
	Balance string
	// Currency is the ISO 4217 code the minor units belong to.
	Currency string
}

// ReserveSnapshot is the set of reserves captured for a tenant at one instant.
// It is the input the orchestrator hands to the prover for a cycle.
type ReserveSnapshot struct {
	// TenantID owns the snapshot.
	TenantID string
	// Reserves are the per-source figures gathered for the cycle.
	Reserves []Reserve
	// CapturedAt marks when the snapshot was taken.
	CapturedAt time.Time
}

// Total is intentionally not summed here. Aggregation that feeds the circuit
// happens in the Rust prover so Go never derives a value the proof depends on.
