package banks

import (
	"context"
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// balanceResponse is the sandbox's signed balance payload. Signature covers the
// canonical JSON of the embedded balance fields, base64 over DER. The orchestrator
// verifies it with the configured public key before trusting the figure.
type balanceResponse struct {
	SourceID  string `json:"source_id"`
	Balance   string `json:"balance"`
	Currency  string `json:"currency"`
	AsOf      string `json:"as_of"`
	Signature string `json:"signature"`
}

// Adapter fetches signed balances from the sandbox Open Banking API. It maps one
// tenant to its set of reserve sources. The source listing is a skeleton: a real
// build loads sources from reserve_sources in Postgres.
type Adapter struct {
	baseURL string
	pubKey  *ecdsa.PublicKey
	http    *http.Client
}

// NewAdapter builds the adapter with the sandbox base URL and the public key
// used to verify responses.
func NewAdapter(baseURL string, pubKey *ecdsa.PublicKey) *Adapter {
	return &Adapter{
		baseURL: baseURL,
		pubKey:  pubKey,
		http:    &http.Client{Timeout: 10 * time.Second},
	}
}

// FetchSigned gathers the tenant's reserves and verifies each signature. A bad
// signature fails the whole fetch; a partial, unverified snapshot is never
// returned.
func (a *Adapter) FetchSigned(ctx context.Context, tenantID string) (entity.ReserveSnapshot, error) {
	// Skeleton: resolve the tenant's accounts from the repo here. For now we
	// query a single illustrative account so the verify path is exercised.
	accountID := tenantID

	resp, err := a.fetchBalance(ctx, accountID)
	if err != nil {
		return entity.ReserveSnapshot{}, err
	}

	reserve := entity.Reserve{
		SourceID: resp.SourceID,
		Balance:  resp.Balance,
		Currency: resp.Currency,
	}
	return entity.ReserveSnapshot{
		TenantID:   tenantID,
		Reserves:   []entity.Reserve{reserve},
		CapturedAt: time.Now().UTC(),
	}, nil
}

// fetchBalance calls one balance endpoint, then verifies the signature over the
// canonical payload.
func (a *Adapter) fetchBalance(ctx context.Context, accountID string) (balanceResponse, error) {
	url := fmt.Sprintf("%s/v1/accounts/%s/balance", a.baseURL, accountID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return balanceResponse{}, fmt.Errorf("build balance request: %w", err)
	}

	res, err := a.http.Do(req)
	if err != nil {
		return balanceResponse{}, fmt.Errorf("fetch balance: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return balanceResponse{}, fmt.Errorf("balance request status %d", res.StatusCode)
	}

	var body balanceResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return balanceResponse{}, fmt.Errorf("decode balance: %w", err)
	}

	sig, err := base64.StdEncoding.DecodeString(body.Signature)
	if err != nil {
		return balanceResponse{}, fmt.Errorf("decode signature: %w", err)
	}

	canonical, err := canonicalPayload(body)
	if err != nil {
		return balanceResponse{}, err
	}
	if err := VerifySignature(a.pubKey, canonical, sig); err != nil {
		return balanceResponse{}, err
	}
	return body, nil
}

// canonicalPayload serializes the signed fields in a fixed order. It must match
// the sandbox signer exactly, or every signature fails. The signature field
// itself is excluded.
func canonicalPayload(b balanceResponse) ([]byte, error) {
	signed := struct {
		AsOf     string `json:"as_of"`
		Balance  string `json:"balance"`
		Currency string `json:"currency"`
		SourceID string `json:"source_id"`
	}{
		AsOf:     b.AsOf,
		Balance:  b.Balance,
		Currency: b.Currency,
		SourceID: b.SourceID,
	}
	out, err := json.Marshal(signed)
	if err != nil {
		return nil, fmt.Errorf("marshal canonical payload: %w", err)
	}
	return out, nil
}

// Ensure Adapter satisfies the usecase port.
var _ usecase.BankAdapter = (*Adapter)(nil)
