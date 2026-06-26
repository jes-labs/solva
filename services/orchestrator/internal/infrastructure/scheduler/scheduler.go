// Package scheduler triggers a proof cycle per tenant on a cron cadence driven
// by the tenant's billing plan (PRD 2 §7.1, §7.3).
//
// # Cadence
//
// Two cadences are supported: hourly (pro plan) and daily (free plan). The
// scheduler ticks every hour. On each tick it lists all active tenants, decides
// which are due based on plan, and runs their cycle.
//
// # Idempotency
//
// The request key encodes the tenant ID and the truncated tick time so two
// scheduler instances produce the same key for the same (tenant, window) pair.
// The Postgres claim inside RunProofCycle deduplicates any race.
//
// # Retry
//
// A failed cycle is retried up to maxRetries times with exponential backoff
// (base 1 s, cap 30 s). Idempotency sentinel errors (ErrCycleInProgress,
// ErrDuplicateCycle) are not retried — they are expected no-ops.
package scheduler

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// CycleRunner is the minimal interface the Scheduler needs from usecase.Cycle.
// Defined here (not in export_test.go) so it is available in production builds.
// *usecase.Cycle satisfies it; tests supply a fake.
type CycleRunner interface {
	Run(ctx context.Context, tenantID, requestKey string) error
}

const (
	// tickInterval is the resolution of the scheduler.
	tickInterval = time.Hour

	// maxRetries is the maximum number of attempts for a failed cycle.
	maxRetries = 3

	baseBackoff = time.Second
	maxBackoff  = 30 * time.Second
)

// Scheduler runs the proof cycle for each known tenant on a cadence driven by
// the tenant's billing plan. It calls TenantRepo on every tick so newly
// provisioned tenants are picked up without a restart.
type Scheduler struct {
	cycleRunner CycleRunner
	tenants     usecase.TenantRepo
	log         zerolog.Logger
	now         func() time.Time
	sleep       func(time.Duration)
}

// New builds a Scheduler for production use.
func New(
	cycle *usecase.Cycle,
	tenants usecase.TenantRepo,
	log zerolog.Logger,
) *Scheduler {
	return &Scheduler{
		cycleRunner: cycle,
		tenants:     tenants,
		log:         log,
		now:         time.Now,
		sleep:       time.Sleep,
	}
}

// Run ticks until ctx is cancelled. On each hourly tick it lists all active
// tenants, decides which are due (based on plan cadence), and runs their
// cycle, retrying with backoff on transient failure.
func (s *Scheduler) Run(ctx context.Context) {
	ticker := time.NewTicker(tickInterval)
	defer ticker.Stop()

	s.log.Info().Msg("scheduler started")

	for {
		select {
		case <-ctx.Done():
			s.log.Info().Msg("scheduler stopped")
			return
		case tick := <-ticker.C:
			s.tick(ctx, tick.UTC())
		}
	}
}

// tick fires for all tenants that are due at t.
func (s *Scheduler) tick(ctx context.Context, t time.Time) {
	tenants, err := s.tenants.ListTenants(ctx)
	if err != nil {
		s.log.Error().Err(err).Msg("scheduler: list tenants failed")
		return
	}

	for _, tenant := range tenants {
		if !s.isDue(tenant.Plan, t) {
			continue
		}
		s.runWithRetry(ctx, tenant.ID, tenant.Plan, t)
	}
}

// isDue returns true when a tenant with plan p should run a cycle at tick t.
// Pro tenants run every hour (always due). Free tenants run once per day
// (due on the first tick of a UTC day, i.e. hour == 0).
func (s *Scheduler) isDue(plan string, t time.Time) bool {
	hourly, _ := usecase.CadenceForPlan(plan)
	if hourly {
		return true
	}
	return t.Hour() == 0
}

// runWithRetry calls cycleRunner.Run with exponential backoff on transient
// failures. Each attempt carries a unique request key so the Postgres
// idempotency claim does not block genuine retries.
func (s *Scheduler) runWithRetry(ctx context.Context, tenantID, plan string, tick time.Time) {
	window := tick.Truncate(tickInterval).Format(time.RFC3339)

	for attempt := 0; attempt < maxRetries; attempt++ {
		requestKey := fmt.Sprintf("scheduled:%s:%s:attempt%d", tenantID, window, attempt)

		err := s.cycleRunner.Run(ctx, tenantID, requestKey)
		switch {
		case err == nil:
			s.log.Info().
				Str("tenant", tenantID).
				Str("plan", plan).
				Int("attempt", attempt).
				Msg("scheduled cycle complete")
			return

		case errors.Is(err, usecase.ErrCycleInProgress),
			errors.Is(err, usecase.ErrDuplicateCycle):
			s.log.Debug().
				Err(err).
				Str("tenant", tenantID).
				Msg("scheduler: cycle skipped by idempotency guard")
			return

		default:
			delay := backoffDelay(attempt)
			s.log.Error().
				Err(err).
				Str("tenant", tenantID).
				Int("attempt", attempt+1).
				Int("max_retries", maxRetries).
				Dur("retry_in", delay).
				Msg("scheduled cycle failed, retrying with backoff")

			select {
			case <-ctx.Done():
				return
			default:
				s.sleep(delay)
			}
		}
	}

	s.log.Error().
		Str("tenant", tenantID).
		Int("attempts", maxRetries).
		Msg("scheduler: cycle exhausted retries, will retry next tick")
}

// backoffDelay returns base * 2^attempt, capped at maxBackoff.
func backoffDelay(attempt int) time.Duration {
	exp := math.Pow(2, float64(attempt))
	d := time.Duration(float64(baseBackoff) * exp)
	if d > maxBackoff {
		return maxBackoff
	}
	return d
}
