package repo

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// testDSN resolves the test database connection. CI and other machines can
// override it; the default matches infra/docker-compose.yml.
func testDSN() string {
	if dsn := os.Getenv("TEST_DATABASE_URL"); dsn != "" {
		return dsn
	}
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		return dsn
	}
	return "postgres://solva:solva@localhost:5432/solva"
}

// newTestStore connects to the test database and truncates it for a clean slate.
// When Postgres is not reachable the test is skipped, not failed, so a plain
// `go test ./...` still passes on a machine without the database running.
func newTestStore(t *testing.T) *Postgres {
	t.Helper()
	ctx := context.Background()
	store, err := NewPostgres(ctx, testDSN())
	if err != nil {
		t.Skipf("postgres not reachable at %s; start it with "+
			"`docker compose -f infra/docker-compose.yml up -d postgres`: %v", testDSN(), err)
	}
	t.Cleanup(store.Close)
	// CASCADE clears every child table (proofs, customers, liabilities, ...).
	if _, err := store.pool.Exec(ctx, `TRUNCATE tenants CASCADE`); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	return store
}

func TestProofRoundTrip(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	q := New(store.pool)

	tenantID, err := q.CreateTenant(ctx, CreateTenantParams{Name: "Meridian Bank", Plan: "growth"})
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	tid := fromUUID(tenantID)

	want := entity.Proof{
		TenantID:         tid,
		ChainProofID:     7,
		RootHash:         "0xabc123",
		ReservesTotal:    "1000000",
		LiabilitiesTotal: "950000",
		Blob:             []byte{0x01, 0x02, 0x03},
	}
	if err := store.SaveProof(ctx, want, []byte(`{"nodes":[]}`)); err != nil {
		t.Fatalf("save proof: %v", err)
	}

	got, err := store.GetLatestProof(ctx, tid)
	if err != nil {
		t.Fatalf("get latest proof: %v", err)
	}
	if got.ReservesTotal != want.ReservesTotal || got.LiabilitiesTotal != want.LiabilitiesTotal {
		t.Errorf("totals: got R=%s L=%s, want R=%s L=%s",
			got.ReservesTotal, got.LiabilitiesTotal, want.ReservesTotal, want.LiabilitiesTotal)
	}
	if got.RootHash != want.RootHash || got.ChainProofID != want.ChainProofID {
		t.Errorf("got root=%s chain=%d, want root=%s chain=%d",
			got.RootHash, got.ChainProofID, want.RootHash, want.ChainProofID)
	}
	if len(got.Blob) != len(want.Blob) {
		t.Errorf("blob len = %d, want %d", len(got.Blob), len(want.Blob))
	}
	if got.PublishedAt.IsZero() {
		t.Error("published_at should be set by the database default")
	}

	// GetProof by id returns the same row as GetLatestProof.
	byID, err := store.GetProof(ctx, got.ID)
	if err != nil {
		t.Fatalf("get proof by id: %v", err)
	}
	if byID.ID != got.ID {
		t.Errorf("get-by-id mismatch: %s vs %s", byID.ID, got.ID)
	}

	// LatestReserves reflects the proof we just saved.
	rPrev, err := store.LatestReserves(ctx, tid)
	if err != nil {
		t.Fatalf("latest reserves: %v", err)
	}
	if rPrev != want.ReservesTotal {
		t.Errorf("latest reserves = %s, want %s", rPrev, want.ReservesTotal)
	}
}

func TestLoadLiabilities(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	q := New(store.pool)

	tenantID, err := q.CreateTenant(ctx, CreateTenantParams{Name: "Meridian Bank", Plan: "growth"})
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	custID, err := q.CreateCustomer(ctx, CreateCustomerParams{
		TenantID: tenantID, ExternalRef: "cust-001", IDHash: "0xhash001",
	})
	if err != nil {
		t.Fatalf("create customer: %v", err)
	}
	balance, err := toNumeric("500000")
	if err != nil {
		t.Fatalf("numeric: %v", err)
	}
	if err := q.CreateLiability(ctx, CreateLiabilityParams{
		TenantID: tenantID, CustomerID: custID, Balance: balance,
	}); err != nil {
		t.Fatalf("create liability: %v", err)
	}

	got, err := store.LoadLiabilities(ctx, fromUUID(tenantID))
	if err != nil {
		t.Fatalf("load liabilities: %v", err)
	}
	if len(got) != 1 {
		t.Fatalf("got %d liabilities, want 1", len(got))
	}
	if got[0].CustomerIDHash != "0xhash001" || got[0].Balance != "500000" {
		t.Errorf("liability = %+v, want hash=0xhash001 balance=500000", got[0])
	}
}

func TestGetProofNotFound(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	_, err := store.GetProof(ctx, "00000000-0000-0000-0000-000000000000")
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("want ErrNotFound, got %v", err)
	}
}

// TestClaimCycle exercises the durable idempotency layer against the real
// unique constraint: the first claim of a key succeeds, a replay is rejected,
// and a different key claims independently.
func TestClaimCycle(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	q := New(store.pool)

	tenantID, err := q.CreateTenant(ctx, CreateTenantParams{Name: "Meridian Bank", Plan: "growth"})
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	tid := fromUUID(tenantID)

	if ok, err := store.ClaimCycle(ctx, tid, "key-1"); err != nil || !ok {
		t.Fatalf("first claim: ok=%v err=%v, want ok=true", ok, err)
	}
	// Replaying the same key hits the unique constraint and is rejected, not errored.
	if ok, err := store.ClaimCycle(ctx, tid, "key-1"); err != nil || ok {
		t.Fatalf("replayed claim: ok=%v err=%v, want ok=false", ok, err)
	}
	// A distinct key is independent and claims cleanly.
	if ok, err := store.ClaimCycle(ctx, tid, "key-2"); err != nil || !ok {
		t.Fatalf("second key claim: ok=%v err=%v, want ok=true", ok, err)
	}
}
