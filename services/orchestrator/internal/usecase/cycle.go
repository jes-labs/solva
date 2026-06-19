package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// ErrCycleInProgress means a cycle for the tenant already holds the idempotency
// lock. The caller should treat the trigger as a no-op, not a failure.
var ErrCycleInProgress = errors.New("usecase: cycle already in progress for tenant")

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

// Run executes one cycle for a tenant. It follows PRD 2 section 7.2 and holds
// the Redis idempotency lock for the duration so a tenant cannot prove twice
// concurrently.
func (uc *Cycle) Run(ctx context.Context, tenantID string) error {
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

	chainID, err := uc.stellar.PublishProof(ctx, res.Proof, res.PublicInputs)
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

	uc.log.Info().
		Str("tenant", tenantID).
		Uint64("chain_proof_id", chainID).
		Msg("proof cycle complete")
	return nil
}
