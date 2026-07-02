// Package handler contains the HTTP handlers for the orchestrator REST API.
// Each handler calls exactly one use case and translates its result into JSON.
// No business logic lives here.
package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jes-labs/solva/services/orchestrator/internal/domain/proof"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// ProofHandler handles the /v1/proofs family of routes.
type ProofHandler struct {
	getLatest      *usecase.GetLatestProof
	getByID        *usecase.GetProofByID
	getByInclusion *usecase.GetProofByInclusionRef
}

func NewProofHandler(
	getLatest *usecase.GetLatestProof,
	getByID *usecase.GetProofByID,
	getByInclusion *usecase.GetProofByInclusionRef,
) *ProofHandler {
	return &ProofHandler{
		getLatest:      getLatest,
		getByID:        getByID,
		getByInclusion: getByInclusion,
	}
}

// GetLatest handles GET /v1/proofs/latest.
func (h *ProofHandler) GetLatest(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	if tenantID == "" {
		writeError(c, http.StatusBadRequest, "tenant_id query parameter is required")
		return
	}

	p, err := h.getLatest.Execute(tenantID)
	if err != nil {
		if errors.Is(err, proof.ErrNotFound) {
			writeError(c, http.StatusNotFound, "no proof found for tenant")
			return
		}
		writeError(c, http.StatusInternalServerError, "internal error")
		return
	}

	c.JSON(http.StatusOK, p)
}

// GetByID handles GET /v1/proofs/:id.
func (h *ProofHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		writeError(c, http.StatusBadRequest, "proof id is required")
		return
	}

	p, err := h.getByID.Execute(id)
	if err != nil {
		if errors.Is(err, proof.ErrNotFound) {
			writeError(c, http.StatusNotFound, "proof not found")
			return
		}
		writeError(c, http.StatusInternalServerError, "internal error")
		return
	}

	c.JSON(http.StatusOK, p)
}

// GetByInclusionRef handles GET /v1/proofs/inclusion/:ref.
func (h *ProofHandler) GetByInclusionRef(c *gin.Context) {
	ref := c.Param("ref")
	if ref == "" {
		writeError(c, http.StatusBadRequest, "inclusion ref is required")
		return
	}

	p, err := h.getByInclusion.Execute(ref)
	if err != nil {
		if errors.Is(err, proof.ErrNotFound) {
			writeError(c, http.StatusNotFound, "no proof found for inclusion ref")
			return
		}
		writeError(c, http.StatusInternalServerError, "internal error")
		return
	}

	c.JSON(http.StatusOK, p)
}

// CycleHandler handles the /v1/cycles routes.
type CycleHandler struct {
	triggerCycle *usecase.TriggerCycle
}

func NewCycleHandler(triggerCycle *usecase.TriggerCycle) *CycleHandler {
	return &CycleHandler{triggerCycle: triggerCycle}
}

// Trigger handles POST /v1/cycles.
func (h *CycleHandler) Trigger(c *gin.Context) {
	result, err := h.triggerCycle.Execute()
	if err != nil {
		writeError(c, http.StatusInternalServerError, "failed to trigger cycle")
		return
	}

	c.JSON(http.StatusAccepted, result)
}

// HealthHandler handles GET /health.
type HealthHandler struct{}

func NewHealthHandler() *HealthHandler { return &HealthHandler{} }

type healthResponse struct {
	Status string `json:"status"`
}

func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, healthResponse{Status: "ok"})
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeError(c *gin.Context, status int, msg string) {
	c.AbortWithStatusJSON(status, errorResponse{Error: msg})
}
