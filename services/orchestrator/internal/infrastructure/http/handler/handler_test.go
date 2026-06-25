package handler_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jes-labs/solva/services/orchestrator/internal/domain/proof"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/http/handler"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

func init() {
	gin.SetMode(gin.TestMode)
}

type fakeRepo struct {
	latest      *proof.Proof
	byID        map[string]*proof.Proof
	byInclusion map[string]*proof.Proof
}

func (r *fakeRepo) Latest(_ string) (*proof.Proof, error) {
	if r.latest == nil {
		return nil, proof.ErrNotFound
	}
	return r.latest, nil
}

func (r *fakeRepo) ByID(id string) (*proof.Proof, error) {
	p, ok := r.byID[id]
	if !ok {
		return nil, proof.ErrNotFound
	}
	return p, nil
}

func (r *fakeRepo) ByInclusionRef(ref string) (*proof.Proof, error) {
	p, ok := r.byInclusion[ref]
	if !ok {
		return nil, proof.ErrNotFound
	}
	return p, nil
}

func (r *fakeRepo) Save(_ *proof.Proof) error { return nil }

type errRepo struct{}

func (errRepo) Latest(_ string) (*proof.Proof, error)         { return nil, errors.New("db down") }
func (errRepo) ByID(_ string) (*proof.Proof, error)           { return nil, errors.New("db down") }
func (errRepo) ByInclusionRef(_ string) (*proof.Proof, error) { return nil, errors.New("db down") }
func (errRepo) Save(_ *proof.Proof) error                     { return errors.New("db down") }

func sampleProof(id string) *proof.Proof {
	return &proof.Proof{
		ID:             id,
		TenantID:       "tenant-1",
		CycleSeq:       1,
		ReserveTotal:   "1000000",
		LiabilityTotal: "800000",
		MerkleRoot:     "0xdeadbeef",
		CreatedAt:      time.Now(),
	}
}

func proofHandlers(repo proof.Repository) *handler.ProofHandler {
	return handler.NewProofHandler(
		usecase.NewGetLatestProof(repo),
		usecase.NewGetProofByID(repo),
		usecase.NewGetProofByInclusionRef(repo),
	)
}

// -- GET /v1/proofs/latest
func TestGetLatest_success(t *testing.T) {
	h := proofHandlers(&fakeRepo{latest: sampleProof("proof-1")})

	r := gin.New()
	r.GET("/v1/proofs/latest", h.GetLatest)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/latest?tenant_id=tenant-1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var p proof.Proof
	if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if p.ID != "proof-1" {
		t.Errorf("expected proof-1, got %s", p.ID)
	}
}

func TestGetLatest_notFound(t *testing.T) {
	h := proofHandlers(&fakeRepo{})

	r := gin.New()
	r.GET("/v1/proofs/latest", h.GetLatest)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/latest?tenant_id=tenant-1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestGetLatest_missingTenantID(t *testing.T) {
	h := proofHandlers(&fakeRepo{})

	r := gin.New()
	r.GET("/v1/proofs/latest", h.GetLatest)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/latest", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGetLatest_internalError(t *testing.T) {
	h := proofHandlers(errRepo{})

	r := gin.New()
	r.GET("/v1/proofs/latest", h.GetLatest)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/latest?tenant_id=t", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// -- GET /v1/proofs/{id}
func TestGetByID_success(t *testing.T) {
	h := proofHandlers(&fakeRepo{byID: map[string]*proof.Proof{"proof-42": sampleProof("proof-42")}})

	r := gin.New()
	r.GET("/v1/proofs/:id", h.GetByID)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/proof-42", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var p proof.Proof
	if err := json.Unmarshal(w.Body.Bytes(), &p); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if p.ID != "proof-42" {
		t.Errorf("expected proof-42, got %s", p.ID)
	}
}

func TestGetByID_notFound(t *testing.T) {
	h := proofHandlers(&fakeRepo{byID: map[string]*proof.Proof{}})

	r := gin.New()
	r.GET("/v1/proofs/:id", h.GetByID)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/does-not-exist", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

// -- GET /v1/proofs/inclusion/{ref}
func TestGetByInclusionRef_success(t *testing.T) {
	h := proofHandlers(&fakeRepo{byInclusion: map[string]*proof.Proof{"acc-123": sampleProof("proof-7")}})

	r := gin.New()
	r.GET("/v1/proofs/inclusion/:ref", h.GetByInclusionRef)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/inclusion/acc-123", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestGetByInclusionRef_notFound(t *testing.T) {
	h := proofHandlers(&fakeRepo{byInclusion: map[string]*proof.Proof{}})

	r := gin.New()
	r.GET("/v1/proofs/inclusion/:ref", h.GetByInclusionRef)

	req := httptest.NewRequest(http.MethodGet, "/v1/proofs/inclusion/unknown", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

// -- POST /v1/cycles
func TestTriggerCycle_success(t *testing.T) {
	h := handler.NewCycleHandler(usecase.NewTriggerCycle())

	r := gin.New()
	r.POST("/v1/cycles", h.Trigger)

	req := httptest.NewRequest(http.MethodPost, "/v1/cycles", strings.NewReader("{}"))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", w.Code)
	}

	var result usecase.CycleTriggerResult
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.Status != "accepted" {
		t.Errorf("expected accepted, got %s", result.Status)
	}
}

// -- GET /health
func TestLiveness(t *testing.T) {
	h := handler.NewHealthHandler()

	r := gin.New()
	r.GET("/health", h.Liveness)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), `"ok"`) {
		t.Errorf("expected ok in body, got %s", w.Body.String())
	}
}
