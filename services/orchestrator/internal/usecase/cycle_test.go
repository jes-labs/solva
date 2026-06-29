package usecase

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// fakeDeps implements every port the Cycle needs with one struct, so a single
// value can stand in for all six dependencies and record the call order across
// them. Behaviour is tuned with the lockAcquired and claimOK fields.
type fakeDeps struct {
	calls []string

	lockAcquired bool
	claimOK      bool

	auditEvent   string
	auditPayload []byte

	// tenantContract is what ResolveTenantContract returns; publishedContract
	// records the contract id PublishProof was actually called with. resolveErr,
	// when set, makes ResolveTenantContract fail (an unprovisioned tenant).
	tenantContract    entity.TenantContract
	publishedContract string
	resolveErr        error
}

func (f *fakeDeps) record(name string) { f.calls = append(f.calls, name) }

// --- BankAdapter ---
func (f *fakeDeps) FetchSigned(_ context.Context, tenantID string) (entity.ReserveSnapshot, error) {
	f.record("FetchSigned")
	return entity.ReserveSnapshot{
		TenantID: tenantID,
		Reserves: []entity.Reserve{{SourceID: "acct-anchor", Balance: "1000", Currency: "USD"}},
	}, nil
}

// --- ReserveRepo ---
func (f *fakeDeps) SaveSnapshot(_ context.Context, _ entity.ReserveSnapshot) error {
	f.record("SaveSnapshot")
	return nil
}
func (f *fakeDeps) LatestReserves(_ context.Context, _ string) (string, error) {
	f.record("LatestReserves")
	return "950", nil
}

// --- ProverClient ---
func (f *fakeDeps) Prove(_ context.Context, _ []entity.Reserve, _ []Liability, _ string) (ProveResult, error) {
	f.record("Prove")
	return ProveResult{
		Proof: []byte("proof"),
		PublicInputs: entity.PublicInputs{
			ReservesTotal: "1000", LiabilitiesTotal: "900", RootHash: "0xabc", PrevReserves: "950",
		},
		SerializedTree: []byte("tree"),
	}, nil
}

// --- StellarPublisher ---
func (f *fakeDeps) PublishProof(_ context.Context, target entity.TenantContract, _ []byte, _ entity.PublicInputs) (uint64, error) {
	f.record("PublishProof")
	f.publishedContract = target.ContractID
	return 42, nil
}

// --- ProofRepo ---
func (f *fakeDeps) SaveProof(_ context.Context, _ entity.Proof, _ []byte) error {
	f.record("SaveProof")
	return nil
}
func (f *fakeDeps) LoadLiabilities(_ context.Context, _ string) ([]Liability, error) {
	f.record("LoadLiabilities")
	return []Liability{{CustomerIDHash: "0xhash", Balance: "900"}}, nil
}
func (f *fakeDeps) ClaimCycle(_ context.Context, _, _ string) (bool, error) {
	f.record("ClaimCycle")
	return f.claimOK, nil
}
func (f *fakeDeps) AppendAudit(_ context.Context, _, event string, payload []byte) error {
	f.record("AppendAudit")
	f.auditEvent = event
	f.auditPayload = payload
	return nil
}
func (f *fakeDeps) GetProof(context.Context, string) (entity.Proof, error) {
	return entity.Proof{}, nil
}
func (f *fakeDeps) GetLatestProof(context.Context, string) (entity.Proof, error) {
	return entity.Proof{}, nil
}
func (f *fakeDeps) GetInclusion(context.Context, string) (entity.InclusionRef, error) {
	return entity.InclusionRef{}, nil
}
func (f *fakeDeps) ResolveTenantContract(context.Context, string) (entity.TenantContract, error) {
	f.record("ResolveTenantContract")
	if f.resolveErr != nil {
		return entity.TenantContract{}, f.resolveErr
	}
	if f.tenantContract.ContractID == "" {
		return entity.TenantContract{ContractID: "CDEFAULTCONTRACT", Network: "testnet"}, nil
	}
	return f.tenantContract, nil
}

// --- Cache ---
func (f *fakeDeps) AcquireCycleLock(_ context.Context, _ string) (bool, error) {
	f.record("AcquireCycleLock")
	return f.lockAcquired, nil
}
func (f *fakeDeps) ReleaseCycleLock(_ context.Context, _ string) error {
	f.record("ReleaseCycleLock")
	return nil
}
func (f *fakeDeps) SetLatest(_ context.Context, _, _ string) error {
	f.record("SetLatest")
	return nil
}
func (f *fakeDeps) GetLatest(context.Context, string) (string, error) { return "", nil }

func newCycleWith(f *fakeDeps) *Cycle {
	return NewCycle(f, f, f, f, f, f, zerolog.Nop())
}

// A successful cycle runs every port in the PRD order and ends by writing one
// audit entry and releasing the lock.
func TestRunHappyPathCallOrder(t *testing.T) {
	f := &fakeDeps{lockAcquired: true, claimOK: true}
	if err := newCycleWith(f).Run(context.Background(), "tenant-1", "key-1"); err != nil {
		t.Fatalf("Run: %v", err)
	}

	want := []string{
		"AcquireCycleLock", "ClaimCycle", "FetchSigned", "SaveSnapshot",
		"LoadLiabilities", "LatestReserves", "Prove", "ResolveTenantContract",
		"PublishProof", "SaveProof", "SetLatest", "AppendAudit", "ReleaseCycleLock",
	}
	if !reflect.DeepEqual(f.calls, want) {
		t.Errorf("call order:\n got %v\nwant %v", f.calls, want)
	}
	if f.auditEvent != "proof_cycle" {
		t.Errorf("audit event = %q, want proof_cycle", f.auditEvent)
	}
	if len(f.auditPayload) == 0 {
		t.Error("audit payload is empty")
	}
}

// A cycle publishes to the tenant's own contract, the one ResolveTenantContract
// returned, not a global default.
func TestRunPublishesToTenantContract(t *testing.T) {
	f := &fakeDeps{
		lockAcquired:   true,
		claimOK:        true,
		tenantContract: entity.TenantContract{ContractID: "CTENANTAONCHAIN", Network: "testnet"},
	}
	if err := newCycleWith(f).Run(context.Background(), "tenant-a", "key-a"); err != nil {
		t.Fatalf("Run: %v", err)
	}
	if f.publishedContract != "CTENANTAONCHAIN" {
		t.Errorf("published to %q, want the tenant's contract CTENANTAONCHAIN", f.publishedContract)
	}
}

// An unprovisioned tenant fails the cycle clearly instead of publishing. The
// repo decides which error means "not provisioned"; the cycle just propagates it
// and stops before publishing.
var errNotProvisioned = errors.New("tenant has no contract")

func TestRunUnprovisionedTenantFails(t *testing.T) {
	f := &fakeDeps{lockAcquired: true, claimOK: true, resolveErr: errNotProvisioned}
	err := newCycleWith(f).Run(context.Background(), "tenant-x", "key-x")
	if !errors.Is(err, errNotProvisioned) {
		t.Fatalf("err = %v, want errNotProvisioned", err)
	}
	for _, c := range f.calls {
		if c == "PublishProof" {
			t.Fatal("must not publish when the tenant has no contract")
		}
	}
}

// Layer 1: the Redis lock. A held lock stops the cycle before any work, and
// before the claim is even attempted.
func TestRunRejectedByRedisLock(t *testing.T) {
	f := &fakeDeps{lockAcquired: false}
	err := newCycleWith(f).Run(context.Background(), "tenant-1", "key-1")
	if !errors.Is(err, ErrCycleInProgress) {
		t.Fatalf("err = %v, want ErrCycleInProgress", err)
	}
	if want := []string{"AcquireCycleLock"}; !reflect.DeepEqual(f.calls, want) {
		t.Errorf("calls = %v, want %v (no work past the lock)", f.calls, want)
	}
}

// Layer 2: the Postgres claim. A duplicate request key is rejected after the
// lock, and the lock is still released on the way out.
func TestRunRejectedByDuplicateKey(t *testing.T) {
	f := &fakeDeps{lockAcquired: true, claimOK: false}
	err := newCycleWith(f).Run(context.Background(), "tenant-1", "key-1")
	if !errors.Is(err, ErrDuplicateCycle) {
		t.Fatalf("err = %v, want ErrDuplicateCycle", err)
	}
	want := []string{"AcquireCycleLock", "ClaimCycle", "ReleaseCycleLock"}
	if !reflect.DeepEqual(f.calls, want) {
		t.Errorf("calls = %v, want %v (claim rejects, lock still released)", f.calls, want)
	}
}
