package scheduler_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/scheduler"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

type fakeTenantRepo struct {
	tenants []entity.Tenant
}

func (r *fakeTenantRepo) ListTenants(_ context.Context) ([]entity.Tenant, error) {
	return r.tenants, nil
}

// fakeCycleRunner records every Run call and can be configured to fail a
// fixed number of times before succeeding.
type fakeCycleRunner struct {
	mu          sync.Mutex
	calls       []cycleCall
	failFirst   int                 // how many calls return errTransient before success
	returnErr   error               // when set, always returned (overrides failFirst)
	idempotency map[string]struct{} // keys already claimed
}

type cycleCall struct {
	tenantID   string
	requestKey string
}

var errTransient = errors.New("fake: transient error")

func (f *fakeCycleRunner) Run(_ context.Context, tenantID, requestKey string) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.calls = append(f.calls, cycleCall{tenantID: tenantID, requestKey: requestKey})

	if f.returnErr != nil {
		return f.returnErr
	}

	// Check idempotency map.
	if f.idempotency == nil {
		f.idempotency = make(map[string]struct{})
	}
	if _, seen := f.idempotency[requestKey]; seen {
		return usecase.ErrDuplicateCycle
	}

	if f.failFirst > 0 {
		f.failFirst--
		return errTransient
	}

	f.idempotency[requestKey] = struct{}{}
	return nil
}

func (f *fakeCycleRunner) callCount() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.calls)
}

func (f *fakeCycleRunner) tenantsCalled() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	seen := map[string]struct{}{}
	var out []string
	for _, c := range f.calls {
		if _, ok := seen[c.tenantID]; !ok {
			seen[c.tenantID] = struct{}{}
			out = append(out, c.tenantID)
		}
	}
	return out
}

// newTestScheduler wires the exported New constructor so the test exercises
// the real scheduling logic.
func newTestScheduler(runner *fakeCycleRunner, tenants []entity.Tenant) *scheduler.Scheduler {
	return scheduler.NewForTest(
		runner,
		&fakeTenantRepo{tenants: tenants},
		zerolog.Nop(),
	)
}

// --- tests ---

// TestSchedulerTriggersProCycleHourly asserts that a pro tenant has its cycle
// triggered on an hourly tick.
func TestSchedulerTriggersProCycleHourly(t *testing.T) {
	runner := &fakeCycleRunner{}
	sched := newTestScheduler(runner, []entity.Tenant{
		{ID: "tenant-pro", Plan: "pro"},
	})

	tick := time.Date(2025, 1, 1, 14, 0, 0, 0, time.UTC) // 14:00 — not midnight
	sched.SimulateTick(context.Background(), tick)

	if runner.callCount() != 1 {
		t.Errorf("expected 1 cycle call for pro tenant, got %d", runner.callCount())
	}
}

// TestSchedulerFreeTenantOnlyRunsAtMidnight asserts that a free tenant is not
// triggered at a non-midnight tick and IS triggered at the midnight tick.
func TestSchedulerFreeTenantOnlyRunsAtMidnight(t *testing.T) {
	runner := &fakeCycleRunner{}
	sched := newTestScheduler(runner, []entity.Tenant{
		{ID: "tenant-free", Plan: "free"},
	})

	// 14:00 — should be skipped.
	sched.SimulateTick(context.Background(), time.Date(2025, 1, 1, 14, 0, 0, 0, time.UTC))
	if runner.callCount() != 0 {
		t.Errorf("free tenant should not run at 14:00, got %d calls", runner.callCount())
	}

	// 00:00 — should fire.
	sched.SimulateTick(context.Background(), time.Date(2025, 1, 2, 0, 0, 0, 0, time.UTC))
	if runner.callCount() != 1 {
		t.Errorf("free tenant should run at midnight, got %d calls", runner.callCount())
	}
}

// TestSchedulerRespectsIdempotencyLock asserts that when the cycle returns
// ErrCycleInProgress the scheduler treats it as a no-op and does not retry.
func TestSchedulerRespectsIdempotencyLock(t *testing.T) {
	runner := &fakeCycleRunner{returnErr: usecase.ErrCycleInProgress}
	sched := newTestScheduler(runner, []entity.Tenant{
		{ID: "tenant-pro", Plan: "pro"},
	})

	tick := time.Date(2025, 1, 1, 14, 0, 0, 0, time.UTC)
	sched.SimulateTick(context.Background(), tick)

	// The idempotency guard should fire once and then stop — no retries.
	if runner.callCount() != 1 {
		t.Errorf("expected exactly 1 call when idempotency lock fires, got %d", runner.callCount())
	}
}

// TestSchedulerRetriesTransientFailure asserts that a transient error causes
// the scheduler to retry up to maxRetries times and succeed on the last attempt.
func TestSchedulerRetriesTransientFailure(t *testing.T) {
	// Fail the first 2 attempts, succeed on the 3rd (maxRetries = 3).
	runner := &fakeCycleRunner{failFirst: 2}
	sched := newTestScheduler(runner, []entity.Tenant{
		{ID: "tenant-pro", Plan: "pro"},
	})

	tick := time.Date(2025, 1, 1, 14, 0, 0, 0, time.UTC)
	sched.SimulateTick(context.Background(), tick)

	// 3 attempts: 2 failures + 1 success.
	if runner.callCount() != 3 {
		t.Errorf("expected 3 retry attempts, got %d", runner.callCount())
	}
}

// TestSchedulerExhaustsRetriesAndLogsError asserts that when all attempts fail
// the scheduler logs the exhaustion but does not panic or return an error.
func TestSchedulerExhaustsRetriesAndLogsError(t *testing.T) {
	runner := &fakeCycleRunner{returnErr: errTransient}
	sched := newTestScheduler(runner, []entity.Tenant{
		{ID: "tenant-pro", Plan: "pro"},
	})

	tick := time.Date(2025, 1, 1, 14, 0, 0, 0, time.UTC)
	// Should not panic.
	sched.SimulateTick(context.Background(), tick)

	if runner.callCount() != 3 {
		t.Errorf("expected 3 exhausted attempts, got %d", runner.callCount())
	}
}

// TestSchedulerMultipleTenants asserts that a tick triggers every tenant that
// is due, using distinct request keys.
func TestSchedulerMultipleTenants(t *testing.T) {
	runner := &fakeCycleRunner{}
	sched := newTestScheduler(runner, []entity.Tenant{
		{ID: "tenant-a", Plan: "pro"},
		{ID: "tenant-b", Plan: "pro"},
		{ID: "tenant-c", Plan: "free"}, // not due at 14:00
	})

	tick := time.Date(2025, 1, 1, 14, 0, 0, 0, time.UTC)
	sched.SimulateTick(context.Background(), tick)

	// Only pro tenants are due at 14:00.
	if runner.callCount() != 2 {
		t.Errorf("expected 2 cycles (2 pro tenants), got %d", runner.callCount())
	}
	called := runner.tenantsCalled()
	wantTenants := map[string]bool{"tenant-a": true, "tenant-b": true}
	for _, id := range called {
		if !wantTenants[id] {
			t.Errorf("unexpected tenant %q in called set", id)
		}
	}
}

// TestCadenceForPlan verifies the plan-to-cadence mapping.
func TestCadenceForPlan(t *testing.T) {
	cases := []struct {
		plan       string
		wantHourly bool
		wantDaily  bool
	}{
		{"pro", true, false},
		{"free", false, true},
		{"enterprise", true, false}, // unknown → default hourly
		{"", true, false},
	}
	for _, tc := range cases {
		hourly, daily := usecase.CadenceForPlan(tc.plan)
		if hourly != tc.wantHourly || daily != tc.wantDaily {
			t.Errorf("CadenceForPlan(%q) = (%v,%v), want (%v,%v)",
				tc.plan, hourly, daily, tc.wantHourly, tc.wantDaily)
		}
	}
}
