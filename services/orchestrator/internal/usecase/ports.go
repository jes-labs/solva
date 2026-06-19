// Package usecase holds Solva's business logic and the interfaces it depends
// on. It imports only the entity layer. Infrastructure and repo packages
// implement these interfaces, so the dependencies point inward.
package usecase

import (
	"context"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// ProveResult is what the prover returns for one cycle. The orchestrator
// carries these values through to the chain and the database without deriving
// any circuit-relevant figure itself.
type ProveResult struct {
	Proof          []byte
	PublicInputs   entity.PublicInputs
	SerializedTree []byte
}

// ProverClient builds the Merkle Sum Tree and generates the proof. It owns the
// full ZK-critical path. The Go side never hashes for the circuit.
type ProverClient interface {
	Prove(ctx context.Context, reserves []entity.Reserve, liabilities []Liability, prevReserves string) (ProveResult, error)
}

// Liability is a single customer balance witnessed into the tree. The hash is
// computed upstream by the prover stack, not in Go. Balance is a decimal
// string of integer minor units.
type Liability struct {
	CustomerIDHash string
	Balance        string
}

// StellarPublisher publishes a verified proof to the Soroban proof-registry
// and returns the monotonic on-chain proof id.
type StellarPublisher interface {
	PublishProof(ctx context.Context, proof []byte, pub entity.PublicInputs) (uint64, error)
}

// BankAdapter fetches reserve figures from a source and verifies their ECDSA
// signature before returning them. A failed signature is an error, never a
// silently dropped reserve.
type BankAdapter interface {
	FetchSigned(ctx context.Context, tenantID string) (entity.ReserveSnapshot, error)
}

// ProofRepo persists proofs and serialized trees, and loads the inputs a cycle
// needs from Postgres.
type ProofRepo interface {
	SaveProof(ctx context.Context, p entity.Proof, serializedTree []byte) error
	GetProof(ctx context.Context, id string) (entity.Proof, error)
	GetLatestProof(ctx context.Context, tenantID string) (entity.Proof, error)
	GetInclusion(ctx context.Context, ref string) (entity.InclusionRef, error)
	LoadLiabilities(ctx context.Context, tenantID string) ([]Liability, error)
}

// ReserveRepo records reserve snapshots and reports the previous cycle total,
// which the fraud bound needs.
type ReserveRepo interface {
	SaveSnapshot(ctx context.Context, snap entity.ReserveSnapshot) error
	LatestReserves(ctx context.Context, tenantID string) (string, error)
}

// Cache holds the latest proof id per tenant and the idempotency locks that
// stop a cycle from running twice at once.
type Cache interface {
	SetLatest(ctx context.Context, tenantID, proofID string) error
	GetLatest(ctx context.Context, tenantID string) (string, error)
	// AcquireCycleLock returns false when a cycle for the tenant already holds
	// the lock. The caller must release it when the cycle ends.
	AcquireCycleLock(ctx context.Context, tenantID string) (bool, error)
	ReleaseCycleLock(ctx context.Context, tenantID string) error
}
