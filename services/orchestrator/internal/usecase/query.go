package usecase

import (
	"context"
	"fmt"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// Query serves read paths: latest proof, proof by id, and inclusion lookups.
// It reads through the cache where it helps and falls back to the repo.
type Query struct {
	proofs ProofRepo
	cache  Cache
}

// NewQuery wires the read use case.
func NewQuery(proofs ProofRepo, cache Cache) *Query {
	return &Query{proofs: proofs, cache: cache}
}

// GetLatestProof returns the most recent proof for a tenant.
func (q *Query) GetLatestProof(ctx context.Context, tenantID string) (entity.Proof, error) {
	proof, err := q.proofs.GetLatestProof(ctx, tenantID)
	if err != nil {
		return entity.Proof{}, fmt.Errorf("get latest proof: %w", err)
	}
	return proof, nil
}

// GetProof returns a single proof by its internal id.
func (q *Query) GetProof(ctx context.Context, id string) (entity.Proof, error) {
	proof, err := q.proofs.GetProof(ctx, id)
	if err != nil {
		return entity.Proof{}, fmt.Errorf("get proof: %w", err)
	}
	return proof, nil
}

// GetInclusion returns a customer's inclusion path for the reference. The path
// nodes come from the serialized tree the prover produced; Go does not rebuild
// them.
func (q *Query) GetInclusion(ctx context.Context, ref string) (entity.InclusionRef, error) {
	inc, err := q.proofs.GetInclusion(ctx, ref)
	if err != nil {
		return entity.InclusionRef{}, fmt.Errorf("get inclusion: %w", err)
	}
	return inc, nil
}

// ResolveTenantContract returns the tenant's contract and network so the SDK and
// oracle can read from the tenant's own contract. The repo's not-found and
// not-provisioned errors pass through unwrapped so the handler can map them.
func (q *Query) ResolveTenantContract(ctx context.Context, tenantID string) (entity.TenantContract, error) {
	return q.proofs.ResolveTenantContract(ctx, tenantID)
}
