// Package proof defines the core Proof entity and the repository interface the
// use cases depend on. Nothing in this package imports a database driver or an
// HTTP library; dependencies point inward.
package proof

import "time"

// Proof is the record persisted after a successful solvency cycle.
type Proof struct {
	ID             string    `json:"id"`
	TenantID       string    `json:"tenant_id"`
	CycleSeq       int64     `json:"cycle_seq"`
	ReserveTotal   string    `json:"reserve_total"`
	LiabilityTotal string    `json:"liability_total"`
	MerkleRoot     string    `json:"merkle_root"`
	PublicInputs   []byte    `json:"public_inputs"`
	ProofBytes     []byte    `json:"proof_bytes"`
	ContractID     string    `json:"contract_id"`
	TxHash         string    `json:"tx_hash"`
	CreatedAt      time.Time `json:"created_at"`
}

// Repository is the storage interface used by the use cases. Infrastructure
// implements this; the use case declares it.
type Repository interface {
	// Latest returns the most recent proof for the given tenant.
	// Returns ErrNotFound when no proof exists.
	Latest(tenantID string) (*Proof, error)

	// ByID returns the proof with the given ID.
	// Returns ErrNotFound when the proof does not exist.
	ByID(id string) (*Proof, error)

	// ByInclusionRef returns the proof whose Merkle tree includes the given
	// customer reference (leaf hash or account ref).
	// Returns ErrNotFound when no matching proof exists.
	ByInclusionRef(ref string) (*Proof, error)

	// Save persists a new proof record.
	Save(p *Proof) error
}

// ErrNotFound is returned by Repository when a proof cannot be found.
var ErrNotFound = notFoundError{}

type notFoundError struct{}

func (notFoundError) Error() string { return "proof not found" }
