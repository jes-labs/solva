// Package entity holds Solva's pure domain objects. It imports nothing
// outside the standard library so the inner layer stays free of frameworks,
// drivers, and transport concerns.
package entity

import "time"

// Proof is one published solvency proof for a tenant. Money fields are
// decimal strings of integer minor units, never floats, so values round-trip
// exactly between the prover, the chain, and Postgres.
type Proof struct {
	// ID is the orchestrator's internal proof identifier.
	ID string
	// TenantID owns this proof.
	TenantID string
	// ChainProofID is the monotonic id returned by the Soroban registry.
	ChainProofID uint64
	// RootHash is the Poseidon2 sum-tree root, hex. Computed by the prover,
	// not by Go. The orchestrator only carries it.
	RootHash string
	// ReservesTotal (R) and LiabilitiesTotal (L) are decimal strings.
	ReservesTotal    string
	LiabilitiesTotal string
	// Blob is the serialized UltraHonk proof.
	Blob []byte
	// PublishedAt is the on-chain timestamp of the proof.
	PublishedAt time.Time
}

// PublicInputs are the values exposed on-chain for a proof. Everything else in
// the witness stays private to the prover.
type PublicInputs struct {
	// ReservesTotal (R), LiabilitiesTotal (L), and PrevReserves (R_prev) are
	// decimal strings of integer minor units.
	ReservesTotal    string
	LiabilitiesTotal string
	PrevReserves     string
	// RootHash is the Poseidon2 sum-tree root, hex.
	RootHash string
}
