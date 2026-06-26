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
	// ClaimCycle records the cycle's idempotency key. It returns true when the
	// key is new (claimed) and false when it was already claimed (a duplicate).
	// This is the durable idempotency layer that backs the Redis lock.
	ClaimCycle(ctx context.Context, tenantID, requestKey string) (bool, error)
	// AppendAudit writes one event to the append-only audit log.
	AppendAudit(ctx context.Context, tenantID, event string, payload []byte) error
}

// ReserveRepo records reserve snapshots and reports the previous cycle total,
// which the fraud bound needs.
type ReserveRepo interface {
	SaveSnapshot(ctx context.Context, snap entity.ReserveSnapshot) error
	LatestReserves(ctx context.Context, tenantID string) (string, error)
}

// TenantRepo lists tenants the scheduler needs to drive.
type TenantRepo interface {
	// ListTenants returns every active tenant. The scheduler calls this on
	// each tick so newly provisioned tenants are picked up without a restart.
	ListTenants(ctx context.Context) ([]entity.Tenant, error)
}

// CadenceForPlan maps a billing plan name to its cycle interval. Free tenants
// run hourly; pro tenants run every hour by default but can be tightened to
// daily. Unknown plans fall back to hourly so a misconfigured tenant still
// produces proofs rather than being silently skipped.
//
// PRD 2 §7.1 defines the two supported cadences. Billing logic (which plan a
// tenant is on) is intentionally out of scope here: the plan field is read,
// not written.
func CadenceForPlan(plan string) (hourly, daily bool) {
	switch plan {
	case "pro":
		return true, false // pro: hourly
	case "free":
		return false, true // free: daily
	default:
		return true, false // unknown: default to hourly
	}
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
