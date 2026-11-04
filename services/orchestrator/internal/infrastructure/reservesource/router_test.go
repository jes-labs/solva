package reservesource

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

type fakeSource struct {
	name    string
	tenants map[string]bool
}

func (f fakeSource) FetchSigned(_ context.Context, tenantID string) (entity.ReserveSnapshot, error) {
	return entity.ReserveSnapshot{TenantID: tenantID, Reserves: []entity.Reserve{{SourceID: f.name}}}, nil
}

func (f fakeSource) HasTenant(tenantID string) bool { return f.tenants[tenantID] }

func TestParseSources(t *testing.T) {
	got, err := ParseSources([]string{"harbor=onchain", " kestrel = attested "})
	if err != nil {
		t.Fatalf("ParseSources: %v", err)
	}
	if got["harbor"] != OnChain || got["kestrel"] != Attested || len(got) != 2 {
		t.Fatalf("ParseSources = %v", got)
	}

	for _, bad := range [][]string{{"harbor=bank"}, {"harbor"}, {"=onchain"}, {"harbor=onchain", "harbor=attested"}} {
		if _, err := ParseSources(bad); err == nil {
			t.Errorf("ParseSources(%v) should fail", bad)
		}
	}
}

func TestRouterSendsEachTenantToItsSource(t *testing.T) {
	attested := fakeSource{name: "attested"}
	onchain := fakeSource{name: "onchain", tenants: map[string]bool{"harbor": true}}
	router, err := NewRouter(attested, onchain, map[string]Kind{"harbor": OnChain})
	if err != nil {
		t.Fatalf("NewRouter: %v", err)
	}

	cases := map[string]string{"harbor": "onchain", "kestrel": "attested"}
	for tenant, want := range cases {
		snap, err := router.FetchSigned(context.Background(), tenant)
		if err != nil {
			t.Fatalf("FetchSigned(%s): %v", tenant, err)
		}
		if got := snap.Reserves[0].SourceID; got != want {
			t.Errorf("tenant %s read from %s, want %s", tenant, got, want)
		}
	}
}

func TestRouterRefusesAnOnChainTenantWithoutHoldings(t *testing.T) {
	onchain := fakeSource{name: "onchain", tenants: map[string]bool{}}
	_, err := NewRouter(fakeSource{name: "attested"}, onchain, map[string]Kind{"harbor": OnChain})
	if err == nil || !strings.Contains(err.Error(), "harbor") {
		t.Fatalf("expected an error naming harbor, got %v", err)
	}
}

func TestRouterRefusesOnChainTenantsWithoutAnOnChainSource(t *testing.T) {
	_, err := NewRouter(fakeSource{name: "attested"}, nil, map[string]Kind{"harbor": OnChain})
	if !errors.Is(err, ErrNoOnChainSource) {
		t.Fatalf("expected ErrNoOnChainSource, got %v", err)
	}
}
