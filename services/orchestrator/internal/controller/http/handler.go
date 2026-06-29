package http

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/repo"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// cycleRunner is the slice of the cycle use case the HTTP layer needs.
type cycleRunner interface {
	Run(ctx context.Context, tenantID, requestKey string) error
}

// queryService is the slice of the read use case the HTTP layer needs.
type queryService interface {
	GetLatestProof(ctx context.Context, tenantID string) (entity.Proof, error)
	GetProof(ctx context.Context, id string) (entity.Proof, error)
	GetInclusion(ctx context.Context, ref string) (entity.InclusionRef, error)
	ResolveTenantContract(ctx context.Context, tenantID string) (entity.TenantContract, error)
}

// Handler holds the use cases the routes call.
type Handler struct {
	cycle cycleRunner
	query queryService
	log   zerolog.Logger
}

// NewHandler wires the handler to its use cases.
func NewHandler(cycle cycleRunner, query queryService, log zerolog.Logger) *Handler {
	return &Handler{cycle: cycle, query: query, log: log}
}

// triggerCycleRequest is the body for POST /v1/cycles.
type triggerCycleRequest struct {
	TenantID string `json:"tenant_id"`
}

// TriggerCycle starts a proof cycle for a tenant. An in-progress cycle is
// reported as 409, not an error.
func (h *Handler) TriggerCycle(w http.ResponseWriter, r *http.Request) {
	var req triggerCycleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.TenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id is required")
		return
	}

	// The caller supplies an Idempotency-Key to make a retry safe; without one
	// each trigger gets a fresh key and runs independently.
	requestKey := r.Header.Get("Idempotency-Key")
	if requestKey == "" {
		requestKey = randomRequestKey()
	}

	err := h.cycle.Run(r.Context(), req.TenantID, requestKey)
	switch {
	case errors.Is(err, usecase.ErrCycleInProgress):
		writeError(w, http.StatusConflict, "cycle already in progress")
		return
	case errors.Is(err, usecase.ErrDuplicateCycle):
		// The key already ran: an idempotent no-op, reported as success.
		writeJSON(w, http.StatusOK, map[string]string{"status": "already processed"})
		return
	case err != nil:
		h.log.Error().Err(err).Str("tenant", req.TenantID).Msg("trigger cycle")
		writeError(w, http.StatusNotImplemented, "cycle pipeline not fully implemented")
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "accepted"})
}

// randomRequestKey makes a fallback idempotency key when the caller sends no
// Idempotency-Key header. A client that wants retry-safe behaviour supplies its
// own key so a replay reuses it.
func randomRequestKey() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

// GetLatestProof returns the latest proof for a tenant. The tenant comes from
// the tenant_id query parameter until auth supplies it.
func (h *Handler) GetLatestProof(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id query param is required")
		return
	}
	proof, err := h.query.GetLatestProof(r.Context(), tenantID)
	if err != nil {
		writeError(w, http.StatusNotImplemented, "latest proof lookup not implemented")
		return
	}
	writeJSON(w, http.StatusOK, toProofDTO(proof))
}

// GetProof returns one proof by id.
func (h *Handler) GetProof(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	proof, err := h.query.GetProof(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotImplemented, "proof lookup not implemented")
		return
	}
	writeJSON(w, http.StatusOK, toProofDTO(proof))
}

// GetInclusion returns a customer inclusion proof for a reference.
func (h *Handler) GetInclusion(w http.ResponseWriter, r *http.Request) {
	// chi returns the raw path segment, so the ref's "<id>:<hash>" arrives with
	// the colon still percent-encoded. Decode it before parsing.
	ref, err := url.PathUnescape(chi.URLParam(r, "ref"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid inclusion ref encoding")
		return
	}
	inc, err := h.query.GetInclusion(r.Context(), ref)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeError(w, http.StatusNotFound, "no inclusion path for that proof and customer")
			return
		}
		h.log.Error().Err(err).Str("ref", ref).Msg("get inclusion")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, toInclusionDTO(inc))
}

// GetTenantContract returns the tenant's deployed contract and network so the
// SDK and oracle read from the tenant's own contract. An unknown tenant or one
// with no contract yet is a 404.
func (h *Handler) GetTenantContract(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tc, err := h.query.ResolveTenantContract(r.Context(), id)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) || errors.Is(err, repo.ErrTenantNotProvisioned) {
			writeError(w, http.StatusNotFound, "no contract for that tenant")
			return
		}
		h.log.Error().Err(err).Str("tenant", id).Msg("resolve tenant contract")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, tenantContractDTO{ContractID: tc.ContractID, Network: tc.Network})
}

type tenantContractDTO struct {
	ContractID string `json:"contract_id"`
	Network    string `json:"network"`
}

// Health reports liveness.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// proofDTO is the JSON shape returned for a proof. Money stays a string.
type proofDTO struct {
	ID               string `json:"id"`
	TenantID         string `json:"tenant_id"`
	ChainProofID     uint64 `json:"chain_proof_id"`
	RootHash         string `json:"root_hash"`
	ReservesTotal    string `json:"reserves_total"`
	LiabilitiesTotal string `json:"liabilities_total"`
}

func toProofDTO(p entity.Proof) proofDTO {
	return proofDTO{
		ID:               p.ID,
		TenantID:         p.TenantID,
		ChainProofID:     p.ChainProofID,
		RootHash:         p.RootHash,
		ReservesTotal:    p.ReservesTotal,
		LiabilitiesTotal: p.LiabilitiesTotal,
	}
}

// pathNodeDTO and inclusionDTO are the JSON surface for the inclusion endpoint.
// sibling_is_left matches the contract's PathNode so the SDK maps it straight
// into verify_inclusion. proof_id is the chain proof id verify_inclusion takes.
type pathNodeDTO struct {
	Hash          string `json:"hash"`
	Sum           string `json:"sum"`
	SiblingIsLeft bool   `json:"sibling_is_left"`
}

type inclusionDTO struct {
	ProofID        string        `json:"proof_id"`
	CustomerIDHash string        `json:"customer_id_hash"`
	Balance        string        `json:"balance"`
	RootHash       string        `json:"root_hash"`
	Path           []pathNodeDTO `json:"path"`
}

func toInclusionDTO(inc entity.InclusionRef) inclusionDTO {
	path := make([]pathNodeDTO, len(inc.Path))
	for i, n := range inc.Path {
		path[i] = pathNodeDTO{Hash: n.Hash, Sum: n.Sum, SiblingIsLeft: n.Left}
	}
	return inclusionDTO{
		ProofID:        inc.ProofID,
		CustomerIDHash: inc.CustomerIDHash,
		Balance:        inc.Balance,
		RootHash:       inc.RootHash,
		Path:           path,
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
