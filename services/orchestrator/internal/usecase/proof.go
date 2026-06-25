// Package usecase implements the application use cases for the orchestrator
// REST API. Each use case wraps exactly one operation on the proof repository.
// No business logic lives in the HTTP handlers; handlers call use cases only.
package usecase

import (
	"github.com/jes-labs/solva/services/orchestrator/internal/domain/proof"
)

// GetLatestProof returns the most recent proof for the given tenant.
type GetLatestProof struct {
	repo proof.Repository
}

func NewGetLatestProof(repo proof.Repository) *GetLatestProof {
	return &GetLatestProof{repo: repo}
}

func (uc *GetLatestProof) Execute(tenantID string) (*proof.Proof, error) {
	return uc.repo.Latest(tenantID)
}

// GetProofByID returns the proof identified by id.
type GetProofByID struct {
	repo proof.Repository
}

func NewGetProofByID(repo proof.Repository) *GetProofByID {
	return &GetProofByID{repo: repo}
}

func (uc *GetProofByID) Execute(id string) (*proof.Proof, error) {
	return uc.repo.ByID(id)
}

// GetProofByInclusionRef returns the proof whose tree contains the given
// customer inclusion reference.
type GetProofByInclusionRef struct {
	repo proof.Repository
}

func NewGetProofByInclusionRef(repo proof.Repository) *GetProofByInclusionRef {
	return &GetProofByInclusionRef{repo: repo}
}

func (uc *GetProofByInclusionRef) Execute(ref string) (*proof.Proof, error) {
	return uc.repo.ByInclusionRef(ref)
}

// TriggerCycle is the REST entry point that enqueues a manual cycle.
// The full cycle logic lives in the scheduler package (separate issue).
type TriggerCycle struct{}

func NewTriggerCycle() *TriggerCycle { return &TriggerCycle{} }

// CycleTriggerResult is the response returned by TriggerCycle.Execute.
type CycleTriggerResult struct {
	CycleID string `json:"cycle_id"`
	Status  string `json:"status"`
}

func (uc *TriggerCycle) Execute() (*CycleTriggerResult, error) {
	// TODO: hand off to the scheduler once it exists.
	return &CycleTriggerResult{CycleID: "pending", Status: "accepted"}, nil
}
