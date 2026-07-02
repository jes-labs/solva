package server

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/sandbox/internal/bank"
	"github.com/jes-labs/solva/services/sandbox/internal/oauth"
	"github.com/jes-labs/solva/services/sandbox/internal/signer"
)

// newTestServer builds the full sandbox over httptest, backed by a fresh P-256
// key and the default (solvent) registry.
func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	sgn, err := signer.New()
	if err != nil {
		t.Fatalf("signer: %v", err)
	}
	srv := New(bank.NewRegistry(), oauth.NewServer(), sgn, zerolog.Nop())
	ts := httptest.NewServer(srv.Router())
	t.Cleanup(ts.Close)
	return ts
}

// oauthToken runs the authorize -> token handshake and returns the bearer token.
func oauthToken(t *testing.T, baseURL string) string {
	t.Helper()
	res, err := http.Get(baseURL + "/oauth/authorize?client_id=solva-test")
	if err != nil {
		t.Fatalf("authorize: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("authorize status %d", res.StatusCode)
	}
	var auth struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(res.Body).Decode(&auth); err != nil {
		t.Fatalf("decode authorize: %v", err)
	}

	tr, err := http.PostForm(baseURL+"/oauth/token", url.Values{"code": {auth.Code}})
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	defer tr.Body.Close()
	if tr.StatusCode != http.StatusOK {
		t.Fatalf("token status %d", tr.StatusCode)
	}
	var tok struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(tr.Body).Decode(&tok); err != nil {
		t.Fatalf("decode token: %v", err)
	}
	if tok.AccessToken == "" {
		t.Fatal("empty access token")
	}
	return tok.AccessToken
}

// The balance endpoint refuses an unauthenticated read.
func TestBalanceRequiresToken(t *testing.T) {
	ts := newTestServer(t)
	res, err := http.Get(ts.URL + "/v1/accounts/acct-anchor/balance")
	if err != nil {
		t.Fatalf("get balance: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", res.StatusCode)
	}
}

// The full flow: the OAuth handshake issues a token the balance endpoint
// accepts, and the signed payload verifies under the orchestrator's exact ECDSA
// scheme. A tampered balance must fail that same check.
func TestOAuthFlowAndSignedBalance(t *testing.T) {
	ts := newTestServer(t)
	token := oauthToken(t, ts.URL)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/v1/accounts/acct-anchor/balance", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("balance: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("balance status %d, want 200", res.StatusCode)
	}
	var body balanceResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decode balance: %v", err)
	}
	if body.SourceID != "acct-anchor" || body.Balance == "" || body.Signature == "" {
		t.Fatalf("balance payload incomplete: %+v", body)
	}

	pubPEM := fetchPublicKey(t, ts.URL)
	if err := verifyLikeOrchestrator(pubPEM, body); err != nil {
		t.Errorf("signature did not verify under the orchestrator scheme: %v", err)
	}

	tampered := body
	tampered.Balance = body.Balance + "0"
	if err := verifyLikeOrchestrator(pubPEM, tampered); err == nil {
		t.Error("tampered balance verified, want a verification failure")
	}
}

func fetchPublicKey(t *testing.T, baseURL string) []byte {
	t.Helper()
	res, err := http.Get(baseURL + "/.well-known/solva-signing-key.pem")
	if err != nil {
		t.Fatalf("public key: %v", err)
	}
	defer res.Body.Close()
	pemBytes, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("read public key: %v", err)
	}
	return pemBytes
}

// verifyLikeOrchestrator replicates the orchestrator's banks.VerifySignature:
// parse the PKIX PEM key, SHA-256 the canonical payload, and check the ASN.1 DER
// signature. It is duplicated here because Go's internal/ rules and the separate
// module prevent importing the orchestrator verifier directly; this is the
// cross-service assertion that the two agree on the exact scheme.
func verifyLikeOrchestrator(pubPEM []byte, body balanceResponse) error {
	block, _ := pem.Decode(pubPEM)
	if block == nil {
		return errors.New("no PEM block in public key")
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return fmt.Errorf("parse public key: %w", err)
	}
	pub, ok := parsed.(*ecdsa.PublicKey)
	if !ok {
		return errors.New("public key is not ECDSA")
	}

	canonical, err := bank.CanonicalPayload(body.SourceID, body.Balance, body.Currency, body.AsOf)
	if err != nil {
		return err
	}
	sig, err := base64.StdEncoding.DecodeString(body.Signature)
	if err != nil {
		return fmt.Errorf("decode signature: %w", err)
	}

	digest := sha256.Sum256(canonical)
	if !ecdsa.VerifyASN1(pub, digest[:], sig) {
		return errors.New("signature verification failed")
	}
	return nil
}

// The admin endpoint seeds a named scenario, and the balance endpoint then
// reflects it. An unknown scenario returns 400 with the available list.
func TestSeedScenarioEndpoint(t *testing.T) {
	ts := newTestServer(t)
	token := oauthToken(t, ts.URL)

	res, err := http.Post(ts.URL+"/admin/scenarios/near-breach", "", nil)
	if err != nil {
		t.Fatalf("seed: %v", err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("seed status = %d, want 200", res.StatusCode)
	}

	// The seeded balance is now the near-breach value for acct-anchor.
	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/v1/accounts/acct-anchor/balance", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	br, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("balance: %v", err)
	}
	defer br.Body.Close()
	var body balanceResponse
	if err := json.NewDecoder(br.Body).Decode(&body); err != nil {
		t.Fatalf("decode balance: %v", err)
	}
	if body.Balance != "4200000" {
		t.Errorf("acct-anchor balance = %s, want 4200000 (near-breach)", body.Balance)
	}

	// An unknown scenario is rejected and lists the available scenarios.
	bad, err := http.Post(ts.URL+"/admin/scenarios/nope", "", nil)
	if err != nil {
		t.Fatalf("bad seed: %v", err)
	}
	defer bad.Body.Close()
	if bad.StatusCode != http.StatusBadRequest {
		t.Errorf("bad seed status = %d, want 400", bad.StatusCode)
	}
	var errBody struct {
		Error     string   `json:"error"`
		Available []string `json:"available"`
	}
	if err := json.NewDecoder(bad.Body).Decode(&errBody); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if len(errBody.Available) == 0 {
		t.Error("unknown scenario response should list available scenarios")
	}
}
