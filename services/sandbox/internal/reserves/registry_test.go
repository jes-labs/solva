package bank

import (
	"errors"
	"strconv"
	"testing"
)

// demoLiabilityTotal is the fixed liability total the demo assumes (integer
// minor units). Scenario reserve balances are chosen relative to it so each
// scenario lands on a deterministic solvency outcome. The orchestrator seeds
// liabilities to this total for a true end-to-end run.
const demoLiabilityTotal = 9_000_000

// demoAccounts is the set of accounts every scenario seeds.
var demoAccounts = []string{"acct-anchor", "acct-beacon", "acct-cedar"}

// totalReserves sums the seeded account balances.
func totalReserves(t *testing.T, r *Registry) int64 {
	t.Helper()
	var total int64
	for _, id := range demoAccounts {
		acct, err := r.Get(id)
		if err != nil {
			t.Fatalf("get %s: %v", id, err)
		}
		n, err := strconv.ParseInt(acct.Balance, 10, 64)
		if err != nil {
			t.Fatalf("parse balance %q: %v", acct.Balance, err)
		}
		total += n
	}
	return total
}

// Each scenario seeds the exact per-account balances, bank ids, and currency.
func TestScenarioBalances(t *testing.T) {
	want := map[string]map[string]string{
		"solvent":     {"acct-anchor": "8000000", "acct-beacon": "5000000", "acct-cedar": "3000000"},
		"near-breach": {"acct-anchor": "4200000", "acct-beacon": "3100000", "acct-cedar": "2200000"},
		"insolvent":   {"acct-anchor": "2000000", "acct-beacon": "1500000", "acct-cedar": "1000000"},
	}
	for scenario, balances := range want {
		r := NewRegistry()
		if err := r.Seed(scenario); err != nil {
			t.Fatalf("seed %s: %v", scenario, err)
		}
		for id, balance := range balances {
			acct, err := r.Get(id)
			if err != nil {
				t.Fatalf("%s/%s: %v", scenario, id, err)
			}
			if acct.Balance != balance {
				t.Errorf("%s/%s balance = %s, want %s", scenario, id, acct.Balance, balance)
			}
			if acct.BankID != bankOfAccount[id] {
				t.Errorf("%s/%s bank = %s, want %s", scenario, id, acct.BankID, bankOfAccount[id])
			}
			if acct.Currency != "NGN" {
				t.Errorf("%s/%s currency = %s, want NGN", scenario, id, acct.Currency)
			}
		}
	}
}

// Each scenario's reserve total drives the expected solvency outcome against the
// demo liability total: a healthy margin, a thin margin, or a breach.
func TestScenarioOutcomes(t *testing.T) {
	cases := []struct {
		scenario  string
		wantTotal int64
		check     func(total int64) bool
		desc      string
	}{
		{"solvent", 16_000_000, func(r int64) bool { return r > demoLiabilityTotal && (r-demoLiabilityTotal)*100/demoLiabilityTotal >= 25 }, "healthy margin (R > L)"},
		{"near-breach", 9_500_000, func(r int64) bool {
			margin := (r - demoLiabilityTotal) * 100 / demoLiabilityTotal
			return r > demoLiabilityTotal && margin > 0 && margin < 10
		}, "thin margin (R just above L)"},
		{"insolvent", 4_500_000, func(r int64) bool { return r < demoLiabilityTotal }, "breach (R < L)"},
	}
	for _, c := range cases {
		r := NewRegistry()
		if err := r.Seed(c.scenario); err != nil {
			t.Fatalf("seed %s: %v", c.scenario, err)
		}
		total := totalReserves(t, r)
		if total != c.wantTotal {
			t.Errorf("%s total = %d, want %d", c.scenario, total, c.wantTotal)
		}
		if !c.check(total) {
			t.Errorf("%s total %d does not satisfy %q vs L=%d", c.scenario, total, c.desc, demoLiabilityTotal)
		}
	}
}

// Seeding is deterministic: the same scenario yields identical balances every
// time, so demos are reproducible across runs.
func TestSeedIsReproducible(t *testing.T) {
	a := NewRegistry()
	b := NewRegistry()
	if err := a.Seed("near-breach"); err != nil {
		t.Fatalf("seed a: %v", err)
	}
	if err := b.Seed("near-breach"); err != nil {
		t.Fatalf("seed b: %v", err)
	}
	for _, id := range demoAccounts {
		av, _ := a.Get(id)
		bv, _ := b.Get(id)
		if av != bv {
			t.Errorf("%s differs across runs: %+v vs %+v", id, av, bv)
		}
	}
	// Re-seeding the same scenario stays identical.
	if err := a.Seed("near-breach"); err != nil {
		t.Fatalf("re-seed: %v", err)
	}
	for _, id := range demoAccounts {
		av, _ := a.Get(id)
		bv, _ := b.Get(id)
		if av != bv {
			t.Errorf("%s drifted on re-seed: %+v vs %+v", id, av, bv)
		}
	}
}

func TestSeedUnknownScenario(t *testing.T) {
	if err := NewRegistry().Seed("does-not-exist"); !errors.Is(err, ErrUnknownScenario) {
		t.Errorf("err = %v, want ErrUnknownScenario", err)
	}
}

func TestGetUnknownAccount(t *testing.T) {
	if _, err := NewRegistry().Get("acct-nope"); !errors.Is(err, ErrUnknownAccount) {
		t.Errorf("err = %v, want ErrUnknownAccount", err)
	}
}
