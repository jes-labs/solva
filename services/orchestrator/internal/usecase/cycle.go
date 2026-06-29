package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// ErrCycleInProgress means a cycle for the tenant already holds the Redis lock.
// The caller should treat the trigger as a no-op, not a failure.
var ErrCycleInProgress = errors.New("usecase: cycle already in progress for tenant")

// ErrDuplicateCycle means the request key was already claimed in Postgres: this
// exact cycle has run before. Like ErrCycleInProgress, it is a no-op, not a
// failure. It is the durable layer that catches a replay after the lock is gone.
var ErrDuplicateCycle = errors.New("usecase: cycle already ran for this request key")

// Cycle runs one full proof cycle: fetch signed reserves, load liabilities,
// prove, publish on Stellar, then persist and cache. It coordinates the ports
// and owns none of the crypto.
type Cycle struct {
	banks    BankAdapter
	prover   ProverClient
	stellar  StellarPublisher
	proofs   ProofRepo
	reserves ReserveRepo
	cache    Cache
	log      zerolog.Logger
}

// NewCycle wires the use case to its dependencies.
func NewCycle(
	banks BankAdapter,
	prover ProverClient,
	stellar StellarPublisher,
	proofs ProofRepo,
	reserves ReserveRepo,
	cache Cache,
	log zerolog.Logger,
) *Cycle {
	return &Cycle{
		banks:    banks,
		prover:   prover,
		stellar:  stellar,
		proofs:   proofs,
		reserves: reserves,
		cache:    cache,
		log:      log,
	}
}

// Run executes one cycle for a tenant, guarded by three idempotency layers from
// PRD 2 section 7.3: the per-tenant Redis lock (concurrency), the Postgres
// request-key claim (durable replay protection), and the request key itself. A
// trigger that loses either guard returns a sentinel and does no work.
func (uc *Cycle) Run(ctx context.Context, tenantID, requestKey string) error {
	// Layer 1: per-tenant Redis lock. Stops two cycles running at once.
	locked, err := uc.cache.AcquireCycleLock(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("acquire cycle lock: %w", err)
	}
	if !locked {
		return ErrCycleInProgress
	}
	defer func() {
		if releaseErr := uc.cache.ReleaseCycleLock(ctx, tenantID); releaseErr != nil {
			uc.log.Error().Err(releaseErr).Str("tenant", tenantID).Msg("release cycle lock")
		}
	}()

	// Layer 2: durable claim on the request key. Catches a replay even if the
	// lock expired or Redis restarted. A claimed key is never re-runnable, so a
	// retry after a failed cycle must use a fresh key.
	claimed, err := uc.proofs.ClaimCycle(ctx, tenantID, requestKey)
	if err != nil {
		return fmt.Errorf("claim cycle: %w", err)
	}
	if !claimed {
		return ErrDuplicateCycle
	}

	snap, err := uc.banks.FetchSigned(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("fetch signed reserves: %w", err)
	}
	if err := uc.reserves.SaveSnapshot(ctx, snap); err != nil {
		return fmt.Errorf("save reserve snapshot: %w", err)
	}

	liabilities, err := uc.proofs.LoadLiabilities(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("load liabilities: %w", err)
	}

	prev, err := uc.reserves.LatestReserves(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("load previous reserves: %w", err)
	}

	res, err := uc.prover.Prove(ctx, snap.Reserves, liabilities, prev)
	if err != nil {
		return fmt.Errorf("prove: %w", err)
	}

	// Publish to the tenant's own contract, not a global one. An unprovisioned
	// tenant fails the cycle clearly rather than publishing somewhere wrong.
	contract, err := uc.proofs.ResolveTenantContract(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("resolve tenant contract: %w", err)
	}

	chainID, err := uc.stellar.PublishProof(ctx, contract, res.Proof, res.PublicInputs)
	if err != nil {
		return fmt.Errorf("publish proof: %w", err)
	}

	proof := entity.Proof{
		TenantID:         tenantID,
		ChainProofID:     chainID,
		RootHash:         res.PublicInputs.RootHash,
		ReservesTotal:    res.PublicInputs.ReservesTotal,
		LiabilitiesTotal: res.PublicInputs.LiabilitiesTotal,
		Blob:             res.Proof,
	}
	if err := uc.proofs.SaveProof(ctx, proof, res.SerializedTree); err != nil {
		return fmt.Errorf("save proof: %w", err)
	}

	if err := uc.cache.SetLatest(ctx, tenantID, fmt.Sprintf("%d", chainID)); err != nil {
		return fmt.Errorf("cache latest proof: %w", err)
	}

	// Every completed cycle appends one audit entry. Marshal cannot fail for
	// these scalar fields.
	payload, _ := json.Marshal(map[string]any{
		"request_key":       requestKey,
		"chain_proof_id":    chainID,
		"reserves_total":    res.PublicInputs.ReservesTotal,
		"liabilities_total": res.PublicInputs.LiabilitiesTotal,
		"root_hash":         res.PublicInputs.RootHash,
	})
	if err := uc.proofs.AppendAudit(ctx, tenantID, "proof_cycle", payload); err != nil {
		return fmt.Errorf("append audit: %w", err)
	}

	uc.log.Info().
		Str("tenant", tenantID).
		Uint64("chain_proof_id", chainID).
		Msg("proof cycle complete")
	return nil
}
