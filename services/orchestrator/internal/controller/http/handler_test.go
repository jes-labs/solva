package http

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/repo"
)

// stubQuery records the ref GetInclusion is called with so a test can assert the
// handler decoded the path param before parsing.
type stubQuery struct {
	gotRef     string
	resolveErr error
}

func (s *stubQuery) GetLatestProof(context.Context, string) (entity.Proof, error) {
	return entity.Proof{}, nil
}

func (s *stubQuery) GetProof(context.Context, string) (entity.Proof, error) {
	return entity.Proof{}, nil
}

func (s *stubQuery) GetInclusion(_ context.Context, ref string) (entity.InclusionRef, error) {
	s.gotRef = ref
	return entity.InclusionRef{ProofID: "4", CustomerIDHash: "0x01", Balance: "10"}, nil
}

func (s *stubQuery) ResolveTenantContract(_ context.Context, _ string) (entity.TenantContract, error) {
	if s.resolveErr != nil {
		return entity.TenantContract{}, s.resolveErr
	}
	return entity.TenantContract{ContractID: "CTENANTCONTRACT", Network: "testnet"}, nil
}

type stubCycle struct{}

func (stubCycle) Run(context.Context, string, string) error { return nil }

// The SDK percent-encodes the ref, so the colon arrives as %3A. The handler must
// decode it so "<proof-id>:<id-hash>" parses, not 404.
func TestGetInclusionDecodesEncodedRef(t *testing.T) {
	q := &stubQuery{}
	h := NewHandler(stubCycle{}, q, zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	uuid := "ab31f400-d433-4af0-bbda-80e26a2a1a05"
	idHash := "0000000000000000000000000000000000000000000000000000000000000001"
	// Encoded colon, exactly as encodeURIComponent produces in the SDK.
	url := srv.URL + "/v1/proofs/inclusion/" + uuid + "%3A" + idHash

	res, err := http.Get(url)
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	want := uuid + ":" + idHash
	if q.gotRef != want {
		t.Fatalf("handler received ref %q, want decoded %q", q.gotRef, want)
	}
}

// The tenant-contract endpoint returns the resolved contract, and a 404 when the
// tenant has no contract yet.
func TestGetTenantContract(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	res, err := http.Get(srv.URL + "/v1/tenants/tenant-1/contract")
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
}

func TestGetTenantContractNotProvisioned(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{resolveErr: repo.ErrTenantNotProvisioned}, zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	res, err := http.Get(srv.URL + "/v1/tenants/tenant-1/contract")
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
}
