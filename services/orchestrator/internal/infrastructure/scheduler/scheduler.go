// Package scheduler triggers a proof cycle per tenant on a fixed interval. It
// is a ticker skeleton: a production build would read tenants from the repo and
// stagger their schedules.
package scheduler

import (
	"context"
	"errors"
	"time"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// Scheduler runs the cycle use case for each known tenant on every tick.
type Scheduler struct {
	cycle    *usecase.Cycle
	interval time.Duration
	tenants  []string
	log      zerolog.Logger
}

// New builds a scheduler. The tenant list is static here; wire it to the repo
// to schedule live tenants.
func New(cycle *usecase.Cycle, interval time.Duration, tenants []string, log zerolog.Logger) *Scheduler {
	return &Scheduler{
		cycle:    cycle,
		interval: interval,
		tenants:  tenants,
		log:      log,
	}
}

// Run ticks until the context is cancelled. Each tick fires one cycle per
// tenant. A failed cycle is logged and does not stop the schedule, since the
// idempotency lock keeps a slow cycle from overlapping the next tick.
func (s *Scheduler) Run(ctx context.Context) {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.log.Info().Msg("scheduler stopped")
			return
		case tick := <-ticker.C:
			// One key per tick. A duplicated tick for a tenant is deduped by the
			// Postgres claim; distinct ticks each carry a distinct key and run.
			requestKey := "scheduled:" + tick.UTC().Format(time.RFC3339)
			for _, tenantID := range s.tenants {
				err := s.cycle.Run(ctx, tenantID, requestKey)
				switch {
				case err == nil,
					errors.Is(err, usecase.ErrCycleInProgress),
					errors.Is(err, usecase.ErrDuplicateCycle):
					// Ran, or an idempotency guard tripped: both expected.
				default:
					s.log.Error().Err(err).Str("tenant", tenantID).Msg("scheduled cycle failed")
				}
			}
		}
	}
}
