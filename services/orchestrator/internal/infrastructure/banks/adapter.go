package banks

import (
	"context"
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// Default retry and timeout settings, used when Config leaves them zero.
const (
	defaultMaxAttempts = 3
	defaultBaseBackoff = 200 * time.Millisecond
	defaultHTTPTimeout = 10 * time.Second
)

// balanceResponse is the sandbox's signed balance payload. Signature covers the
// canonical JSON of the embedded fields, base64 over DER. The orchestrator
// verifies it with the configured public key before trusting the figure.
type balanceResponse struct {
	SourceID  string `json:"source_id"`
	Balance   string `json:"balance"`
	Currency  string `json:"currency"`
	AsOf      string `json:"as_of"`
	Signature string `json:"signature"`
}

// transientError marks a failure worth retrying: a network error or a 5xx from
// the source. Permanent failures, above all a bad signature, are returned bare
// so the retry loop stops at once. We never retry a forged response.
type transientError struct{ err error }

func (e transientError) Error() string { return e.err.Error() }
func (e transientError) Unwrap() error { return e.err }

// Config builds an Adapter. PubKey verifies every source's signature; in the
// sandbox one key signs all accounts. Accounts is the set of reserve sources to
// read. The retry and timeout fields fall back to sensible defaults when zero.
type Config struct {
	BaseURL     string
	Accounts    []string
	PubKey      *ecdsa.PublicKey
	MaxAttempts int
	BaseBackoff time.Duration
	HTTPTimeout time.Duration
}

// Adapter fetches signed balances from the sandbox Open Banking API and verifies
// each ECDSA signature before the figure is trusted. Resolving a tenant's
// sources from reserve_sources in Postgres is a later step; for now the source
// set is configured directly.
type Adapter struct {
	baseURL     string
	accounts    []string
	pubKey      *ecdsa.PublicKey
	http        *http.Client
	maxAttempts int
	baseBackoff time.Duration
}

// NewAdapter builds the adapter, applying defaults for any unset retry/timeout.
func NewAdapter(c Config) *Adapter {
	maxAttempts := c.MaxAttempts
	if maxAttempts <= 0 {
		maxAttempts = defaultMaxAttempts
	}
	baseBackoff := c.BaseBackoff
	if baseBackoff <= 0 {
		baseBackoff = defaultBaseBackoff
	}
	timeout := c.HTTPTimeout
	if timeout <= 0 {
		timeout = defaultHTTPTimeout
	}
	return &Adapter{
		baseURL:     c.BaseURL,
		accounts:    c.Accounts,
		pubKey:      c.PubKey,
		http:        &http.Client{Timeout: timeout},
		maxAttempts: maxAttempts,
		baseBackoff: baseBackoff,
	}
}

// FetchSigned reads every configured source in parallel, verifies each
// signature, and returns one ReserveSnapshot. The first failure, whether a bad
// signature or an exhausted retry, cancels the rest and fails the whole fetch:
// a partial, unverified snapshot is never returned.
func (a *Adapter) FetchSigned(ctx context.Context, tenantID string) (entity.ReserveSnapshot, error) {
	if len(a.accounts) == 0 {
		return entity.ReserveSnapshot{}, errors.New("banks: no reserve sources configured")
	}

	// One slot per source. Each goroutine writes its own index, so no lock is
	// needed; the indices never alias.
	reserves := make([]entity.Reserve, len(a.accounts))
	group, groupCtx := errgroup.WithContext(ctx)
	for i, account := range a.accounts {
		group.Go(func() error {
			resp, err := a.fetchWithRetry(groupCtx, account)
			if err != nil {
				return fmt.Errorf("source %s: %w", account, err)
			}
			reserves[i] = entity.Reserve{
				SourceID: resp.SourceID,
				Balance:  resp.Balance,
				Currency: resp.Currency,
			}
			return nil
		})
	}
	if err := group.Wait(); err != nil {
		return entity.ReserveSnapshot{}, err
	}

	return entity.ReserveSnapshot{
		TenantID:   tenantID,
		Reserves:   reserves,
		CapturedAt: time.Now().UTC(),
	}, nil
}

// fetchWithRetry calls one source, retrying transient failures with exponential
// backoff. Permanent failures return immediately. A cancelled context stops the
// retries at once.
func (a *Adapter) fetchWithRetry(ctx context.Context, account string) (balanceResponse, error) {
	backoff := a.baseBackoff
	var lastErr error
	for attempt := 1; attempt <= a.maxAttempts; attempt++ {
		resp, err := a.fetchBalance(ctx, account)
		if err == nil {
			return resp, nil
		}
		lastErr = err

		// Only network errors and 5xx are worth another try. Anything else,
		// especially a failed signature, is final.
		var transient transientError
		if !errors.As(err, &transient) {
			return balanceResponse{}, err
		}
		if attempt == a.maxAttempts {
			break
		}
		select {
		case <-ctx.Done():
			return balanceResponse{}, ctx.Err()
		case <-time.After(backoff):
		}
		backoff *= 2
	}
	return balanceResponse{}, fmt.Errorf("after %d attempts: %w", a.maxAttempts, lastErr)
}

// fetchBalance calls one balance endpoint and verifies the signature over the
// canonical payload. Network errors and 5xx are wrapped as transient; a bad
// signature or a 4xx is permanent.
func (a *Adapter) fetchBalance(ctx context.Context, account string) (balanceResponse, error) {
	url := fmt.Sprintf("%s/v1/accounts/%s/balance", a.baseURL, account)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return balanceResponse{}, fmt.Errorf("build balance request: %w", err)
	}

	res, err := a.http.Do(req)
	if err != nil {
		// Connection refused, timeout, DNS: worth retrying.
		return balanceResponse{}, transientError{fmt.Errorf("fetch balance: %w", err)}
	}
	defer res.Body.Close()
	if res.StatusCode >= 500 {
		return balanceResponse{}, transientError{fmt.Errorf("balance request status %d", res.StatusCode)}
	}
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
