package http

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/repo"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
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

type stubCycle struct{ err error }

func (s stubCycle) Run(context.Context, string, string) error { return s.err }

// stubProvision is a no-op control-plane stub. createErr and setErr let a test
// force a failure path.
type stubProvision struct {
	createErr error
	setErr    error
	gotName   string
	gotPlan   string
}

func (s *stubProvision) CreateTenant(_ context.Context, name, plan string) (entity.Tenant, error) {
	s.gotName, s.gotPlan = name, plan
	if s.createErr != nil {
		return entity.Tenant{}, s.createErr
	}
	return entity.Tenant{ID: "tenant-1", Name: name, Plan: plan}, nil
}

func (s *stubProvision) SetTenantContract(_ context.Context, _, _, _ string) error {
	return s.setErr
}

func (s *stubProvision) SetTenantWallet(_ context.Context, _, _ string) error {
	return s.setErr
}

// The SDK percent-encodes the ref, so the colon arrives as %3A. The handler must
// decode it so "<proof-id>:<id-hash>" parses, not 404.
func TestGetInclusionDecodesEncodedRef(t *testing.T) {
	q := &stubQuery{}
	h := NewHandler(stubCycle{}, q, &stubProvision{}, "", zerolog.Nop())
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
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
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
	h := NewHandler(stubCycle{}, &stubQuery{resolveErr: repo.ErrTenantNotProvisioned}, &stubProvision{}, "", zerolog.Nop())
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

// POST /v1/tenants creates a tenant and returns it. No admin token configured
// means the dev-mode "no auth" path is exercised.
func TestCreateTenant(t *testing.T) {
	p := &stubProvision{}
	h := NewHandler(stubCycle{}, &stubQuery{}, p, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	res, err := http.Post(srv.URL+"/v1/tenants", "application/json",
		strings.NewReader(`{"name":"Meridian Bank","plan":"growth"}`))
	if err != nil {
		t.Fatalf("POST: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", res.StatusCode)
	}
	if p.gotName != "Meridian Bank" || p.gotPlan != "growth" {
		t.Fatalf("provision got name=%q plan=%q", p.gotName, p.gotPlan)
	}
}

// POST /v1/tenants requires the configured admin bearer token.
func TestCreateTenantRequiresAdminToken(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "s3cr3t", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	// No Authorization header: rejected.
	res, err := http.Post(srv.URL+"/v1/tenants", "application/json", strings.NewReader(`{"name":"X"}`))
	if err != nil {
		t.Fatalf("POST: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}

	// Correct bearer token: accepted.
	req, _ := http.NewRequest(http.MethodPost, srv.URL+"/v1/tenants", strings.NewReader(`{"name":"X"}`))
	req.Header.Set("Authorization", "Bearer s3cr3t")
	req.Header.Set("Content-Type", "application/json")
	res2, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST with token: %v", err)
	}
	defer res2.Body.Close()
	if res2.StatusCode != http.StatusCreated {
		t.Fatalf("status with token = %d, want 201", res2.StatusCode)
	}
}

// PUT /v1/tenants/{id}/contract records the contract once deployed.
func TestSetTenantContract(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/v1/tenants/tenant-1/contract",
		strings.NewReader(`{"contract_id":"CTENANTCONTRACT","network":"testnet"}`))
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
}

// An invalid network is rejected with a 400, not silently recorded.
func TestSetTenantContractInvalidNetwork(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{setErr: usecase.ErrInvalidNetwork}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/v1/tenants/tenant-1/contract",
		strings.NewReader(`{"contract_id":"CTENANTCONTRACT","network":"devnet"}`))
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

// PUT /v1/tenants/{id}/wallet records the tenant's passkey smart-wallet account.
func TestSetTenantWallet(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/v1/tenants/tenant-1/wallet",
		strings.NewReader(`{"wallet_address":"CBX5EJPO6Y4SL3LEAKCZBT4QKWBPFI4LMOUUFQ5KDY4YQ3RA6PPUFU7J"}`))
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
}

// A non-contract wallet is rejected with a 400.
func TestSetTenantWalletInvalid(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{setErr: usecase.ErrInvalidWallet}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/v1/tenants/tenant-1/wallet",
		strings.NewReader(`{"wallet_address":"GDTTUZQEBRZGR5WTYWS77ENBEM6YSWY5LAGOYU4V4NRUM5AUMXCWVD6G"}`))
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

// A cycle the prover refuses for R < L returns HTTP 422, not a generic error, so
// callers can tell insolvency apart from a real failure (#179).
func TestTriggerCycleInsolvent(t *testing.T) {
	h := NewHandler(stubCycle{err: usecase.ErrInsolvent}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, zerolog.Nop()))
	defer srv.Close()

	res, err := http.Post(srv.URL+"/v1/cycles", "application/json",
		strings.NewReader(`{"tenant_id":"tenant-1"}`))
	if err != nil {
		t.Fatalf("POST: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", res.StatusCode)
	}
}
