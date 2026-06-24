package banks

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// testSigner mirrors the sandbox signing scheme exactly: P-256, SHA-256 over the
// canonical payload, ASN.1 DER signature. Tests sign with it so the verify path
// runs against real signatures, not fixtures.
type testSigner struct{ priv *ecdsa.PrivateKey }

func newTestSigner(t *testing.T) *testSigner {
	t.Helper()
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	return &testSigner{priv: priv}
}

func (s *testSigner) pub() *ecdsa.PublicKey { return &s.priv.PublicKey }

// pemPub returns the PKIX PEM public key, the same form the sandbox publishes
// and deps.go parses with ParsePublicKey.
func (s *testSigner) pemPub(t *testing.T) []byte {
	t.Helper()
	der, err := x509.MarshalPKIXPublicKey(s.pub())
	if err != nil {
		t.Fatalf("marshal public key: %v", err)
	}
	return pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der})
}

// sign returns the base64 DER signature over the canonical payload, matching the
// sandbox's signer.Sign.
func (s *testSigner) sign(t *testing.T, b balanceResponse) string {
	t.Helper()
	canonical, err := canonicalPayload(b)
	if err != nil {
		t.Fatalf("canonical: %v", err)
	}
	digest := sha256.Sum256(canonical)
	sig, err := ecdsa.SignASN1(rand.Reader, s.priv, digest[:])
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return base64.StdEncoding.EncodeToString(sig)
}

// writeSignedBalance writes a signed balanceResponse for the given account.
func writeSignedBalance(t *testing.T, w http.ResponseWriter, s *testSigner, sourceID, balance string) {
	t.Helper()
	body := balanceResponse{
		SourceID: sourceID,
		Balance:  balance,
		Currency: "NGN",
		AsOf:     time.Now().UTC().Format(time.RFC3339),
	}
	body.Signature = s.sign(t, body)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(body)
}

// accountFromPath pulls {id} out of /v1/accounts/{id}/balance.
func accountFromPath(p string) string {
	parts := strings.Split(strings.Trim(p, "/"), "/")
	if len(parts) >= 3 {
		return parts[2]
	}
	return ""
}

// Acceptance: a sandbox-signed payload verifies, and a tampered one is rejected.
func TestVerifySignatureRoundTripAndTamper(t *testing.T) {
	s := newTestSigner(t)

	// Parse the public key back from PEM, exercising ParsePublicKey too.
	pub, err := ParsePublicKey(s.pemPub(t))
	if err != nil {
		t.Fatalf("parse public key: %v", err)
	}

	body := balanceResponse{SourceID: "acct-anchor", Balance: "8000000", Currency: "NGN", AsOf: "2026-06-24T00:00:00Z"}
	canonical, err := canonicalPayload(body)
	if err != nil {
		t.Fatalf("canonical: %v", err)
	}
	digest := sha256.Sum256(canonical)
	sig, err := ecdsa.SignASN1(rand.Reader, s.priv, digest[:])
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	if err := VerifySignature(pub, canonical, sig); err != nil {
		t.Fatalf("a valid signature should verify: %v", err)
	}

	// Flip the balance: the same signature must no longer verify.
	tampered, err := canonicalPayload(balanceResponse{SourceID: "acct-anchor", Balance: "99999999", Currency: "NGN", AsOf: "2026-06-24T00:00:00Z"})
	if err != nil {
		t.Fatalf("canonical: %v", err)
	}
	if err := VerifySignature(pub, tampered, sig); !errors.Is(err, ErrBadSignature) {
		t.Errorf("tampered payload: want ErrBadSignature, got %v", err)
	}
}

// Acceptance: the fetch runs in parallel. A barrier makes every request wait for
// all of its siblings; a sequential fetch would deadlock and hit the deadline.
func TestFetchSignedRunsInParallel(t *testing.T) {
	s := newTestSigner(t)
	accounts := []string{"acct-anchor", "acct-beacon", "acct-cedar"}

	var arrived sync.WaitGroup
	arrived.Add(len(accounts))
	allHere := make(chan struct{})
	var once sync.Once
	releaseAll := func() { once.Do(func() { close(allHere) }) }
	t.Cleanup(releaseAll) // free any stuck handler so srv.Close() returns

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		arrived.Done()
		select {
		case <-allHere:
		case <-r.Context().Done():
			return
		}
		writeSignedBalance(t, w, s, accountFromPath(r.URL.Path), "1000000")
	}))
	defer srv.Close()

	// Open the barrier once every request is in flight.
	go func() { arrived.Wait(); releaseAll() }()

	a := NewAdapter(Config{BaseURL: srv.URL, Accounts: accounts, PubKey: s.pub(), MaxAttempts: 1})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	snap, err := a.FetchSigned(ctx, "tenant-1")
	if err != nil {
		t.Fatalf("parallel fetch failed (a sequential fetch would deadlock and hit the deadline): %v", err)
	}
	if len(snap.Reserves) != len(accounts) {
		t.Fatalf("got %d reserves, want %d", len(snap.Reserves), len(accounts))
	}
	if snap.TenantID != "tenant-1" {
		t.Errorf("tenant id = %q, want tenant-1", snap.TenantID)
	}
}

// Acceptance: transient failures (5xx) are retried with backoff.
func TestFetchSignedRetriesTransient(t *testing.T) {
	s := newTestSigner(t)
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if atomic.AddInt32(&calls, 1) < 3 {
			http.Error(w, "try later", http.StatusServiceUnavailable) // two 503s, then success
			return
		}
		writeSignedBalance(t, w, s, accountFromPath(r.URL.Path), "1000000")
	}))
	defer srv.Close()

	a := NewAdapter(Config{
		BaseURL: srv.URL, Accounts: []string{"acct-anchor"}, PubKey: s.pub(),
		MaxAttempts: 3, BaseBackoff: time.Millisecond,
	})
	snap, err := a.FetchSigned(context.Background(), "tenant-1")
	if err != nil {
		t.Fatalf("should succeed after retries: %v", err)
	}
	if got := atomic.LoadInt32(&calls); got != 3 {
		t.Errorf("calls = %d, want 3 (two 503s then success)", got)
	}
	if len(snap.Reserves) != 1 || snap.Reserves[0].Balance != "1000000" {
		t.Errorf("reserve = %+v", snap.Reserves)
	}
}

// Acceptance: an unverified signature aborts the cycle with a clear error, and
// is never retried (a forgery is permanent, not transient).
func TestFetchSignedRejectsBadSignature(t *testing.T) {
	s := newTestSigner(t)
	wrongKey := newTestSigner(t) // signs with a key the adapter does not trust
	var calls int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		writeSignedBalance(t, w, wrongKey, accountFromPath(r.URL.Path), "1000000")
	}))
	defer srv.Close()

	a := NewAdapter(Config{
		BaseURL: srv.URL, Accounts: []string{"acct-anchor"}, PubKey: s.pub(),
		MaxAttempts: 3, BaseBackoff: time.Millisecond,
	})
	_, err := a.FetchSigned(context.Background(), "tenant-1")
	if !errors.Is(err, ErrBadSignature) {
		t.Fatalf("want ErrBadSignature, got %v", err)
	}
	if got := atomic.LoadInt32(&calls); got != 1 {
		t.Errorf("a bad signature must not be retried: calls = %d, want 1", got)
	}
}

// A missing source set is a configuration error, not a silent empty snapshot.
func TestFetchSignedNoSources(t *testing.T) {
	a := NewAdapter(Config{BaseURL: "http://unused", PubKey: newTestSigner(t).pub()})
	if _, err := a.FetchSigned(context.Background(), "tenant-1"); err == nil {
		t.Error("expected an error when no sources are configured")
	}
}
