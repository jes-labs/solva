package scheduler

import (
	"context"
	"time"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// NewForTest builds a Scheduler with a no-op sleep so tests that call
// SimulateTick do not block on backoff delays.
func NewForTest(
	cycle CycleRunner,
	tenants usecase.TenantRepo,
	log zerolog.Logger,
) *Scheduler {
	s := &Scheduler{
		cycleRunner: cycle,
		tenants:     tenants,
		log:         log,
		now:         time.Now,
		sleep:       func(time.Duration) {}, // no-op in tests
	}
	return s
}

// SimulateTick fires one tick synchronously, used by unit tests to drive the
// scheduler without a real timer.
func (s *Scheduler) SimulateTick(ctx context.Context, t time.Time) {
	s.tick(ctx, t)
}
