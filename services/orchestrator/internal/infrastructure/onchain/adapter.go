package onchain

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/stellar/go/strkey"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

const (
	defaultMaxAttempts = 3
	defaultBaseBackoff = 200 * time.Millisecond
	defaultHTTPTimeout = 10 * time.Second
	stroopScale        = 7
)

type transientError struct{ err error }

func (e transientError) Error() string { return e.err.Error() }
func (e transientError) Unwrap() error { return e.err }

type Holding struct {
	Tenant  string
	Address string
	Code    string
	Issuer  string
}

type Config struct {
	HorizonURL  string
	Holdings    []Holding
	MaxAttempts int
	BaseBackoff time.Duration
	HTTPTimeout time.Duration
}

type Adapter struct {
	horizonURL  string
	holdings    []Holding
	http        *http.Client
	maxAttempts int
	baseBackoff time.Duration
}

func ParseHoldings(specs []string) ([]Holding, error) {
	holdings := make([]Holding, 0, len(specs))
	for _, spec := range specs {
		tenant, holding, found := strings.Cut(spec, "=")
		tenant = strings.TrimSpace(tenant)
		if !found || tenant == "" {
			return nil, fmt.Errorf("onchain: holding %q must start with a tenant id: TENANT=ADDRESS", spec)
		}
		parts := strings.Split(holding, "|")
		h := Holding{Tenant: tenant, Address: strings.TrimSpace(parts[0])}
		switch len(parts) {
		case 1:
		case 3:
			h.Code = strings.TrimSpace(parts[1])
			h.Issuer = strings.TrimSpace(parts[2])
			if h.Code == "" || h.Issuer == "" {
				return nil, fmt.Errorf("onchain: holding %q needs both an asset code and an issuer", spec)
			}
			if !strkey.IsValidEd25519PublicKey(h.Issuer) {
				return nil, fmt.Errorf("onchain: holding %q has an invalid issuer address", spec)
			}
		default:
			return nil, fmt.Errorf("onchain: holding %q must be ADDRESS or ADDRESS|CODE|ISSUER", spec)
		}
		if !strkey.IsValidEd25519PublicKey(h.Address) {
			return nil, fmt.Errorf("onchain: holding %q has an invalid account address", spec)
		}
		holdings = append(holdings, h)
	}
	return holdings, nil
}

func NewAdapter(c Config) (*Adapter, error) {
	if strings.TrimSpace(c.HorizonURL) == "" {
		return nil, errors.New("onchain: horizon url is required")
	}
	if len(c.Holdings) == 0 {
		return nil, errors.New("onchain: no holdings configured")
	}
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
		horizonURL:  strings.TrimRight(c.HorizonURL, "/"),
		holdings:    c.Holdings,
		http:        &http.Client{Timeout: timeout},
		maxAttempts: maxAttempts,
		baseBackoff: baseBackoff,
	}, nil
}

func (a *Adapter) HasTenant(tenantID string) bool {
	return len(a.holdingsFor(tenantID)) > 0
}

func (a *Adapter) holdingsFor(tenantID string) []Holding {
	var holdings []Holding
	for _, h := range a.holdings {
		if h.Tenant == tenantID {
			holdings = append(holdings, h)
		}
	}
	return holdings
}

func (a *Adapter) FetchSigned(ctx context.Context, tenantID string) (entity.ReserveSnapshot, error) {
	holdings := a.holdingsFor(tenantID)
	if len(holdings) == 0 {
		return entity.ReserveSnapshot{}, fmt.Errorf("onchain: no holdings for tenant %s", tenantID)
	}

	reserves := make([]entity.Reserve, len(holdings))
	group, groupCtx := errgroup.WithContext(ctx)
	for i, holding := range holdings {
		group.Go(func() error {
			reserve, err := a.fetchWithRetry(groupCtx, holding)
			if err != nil {
				return fmt.Errorf("holding %s: %w", holding.Address, err)
			}
			reserves[i] = reserve
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

func (a *Adapter) fetchWithRetry(ctx context.Context, h Holding) (entity.Reserve, error) {
	backoff := a.baseBackoff
	var lastErr error
	for attempt := 1; attempt <= a.maxAttempts; attempt++ {
		reserve, err := a.fetchBalance(ctx, h)
		if err == nil {
			return reserve, nil
		}
		lastErr = err

		var transient transientError
		if !errors.As(err, &transient) {
			return entity.Reserve{}, err
		}
		if attempt == a.maxAttempts {
			break
		}
		select {
		case <-ctx.Done():
			return entity.Reserve{}, ctx.Err()
		case <-time.After(backoff):
		}
		backoff *= 2
	}
	return entity.Reserve{}, fmt.Errorf("after %d attempts: %w", a.maxAttempts, lastErr)
}

type horizonAccount struct {
	Balances []horizonBalance `json:"balances"`
}

type horizonBalance struct {
	Balance     string `json:"balance"`
	AssetType   string `json:"asset_type"`
	AssetCode   string `json:"asset_code"`
	AssetIssuer string `json:"asset_issuer"`
}

func (a *Adapter) fetchBalance(ctx context.Context, h Holding) (entity.Reserve, error) {
	endpoint := fmt.Sprintf("%s/accounts/%s", a.horizonURL, h.Address)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return entity.Reserve{}, fmt.Errorf("build account request: %w", err)
	}

	res, err := a.http.Do(req)
	if err != nil {
		return entity.Reserve{}, transientError{fmt.Errorf("fetch account: %w", err)}
	}
	defer res.Body.Close()
	if res.StatusCode >= 500 {
		return entity.Reserve{}, transientError{fmt.Errorf("account request status %d", res.StatusCode)}
	}
	if res.StatusCode != http.StatusOK {
		return entity.Reserve{}, fmt.Errorf("account request status %d", res.StatusCode)
	}

	var acct horizonAccount
	if err := json.NewDecoder(res.Body).Decode(&acct); err != nil {
		return entity.Reserve{}, fmt.Errorf("decode account: %w", err)
	}

	balance, currency, err := selectBalance(acct, h)
	if err != nil {
		return entity.Reserve{}, err
	}
	stroops, err := toStroops(balance)
	if err != nil {
		return entity.Reserve{}, fmt.Errorf("balance %q: %w", balance, err)
	}

	sourceID := h.Address
	if h.Code != "" {
		sourceID = h.Address + ":" + h.Code
	}
	return entity.Reserve{SourceID: sourceID, Balance: stroops, Currency: currency}, nil
}

func selectBalance(acct horizonAccount, h Holding) (balance, currency string, err error) {
	for _, b := range acct.Balances {
		if h.Code == "" {
			if b.AssetType == "native" {
				return b.Balance, "XLM", nil
			}
			continue
		}
		if strings.HasPrefix(b.AssetType, "credit_alphanum") && b.AssetCode == h.Code && b.AssetIssuer == h.Issuer {
			return b.Balance, h.Code, nil
		}
	}
	if h.Code == "" {
		return "", "", fmt.Errorf("account %s has no native balance", h.Address)
	}
	return "", "", fmt.Errorf("account %s does not hold %s issued by %s", h.Address, h.Code, h.Issuer)
}

func toStroops(dec string) (string, error) {
	dec = strings.TrimSpace(dec)
	if dec == "" {
		return "", errors.New("empty balance")
	}
	if strings.HasPrefix(dec, "-") {
		return "", fmt.Errorf("negative balance %q", dec)
	}
	intPart, frac, _ := strings.Cut(dec, ".")
	if intPart == "" {
		intPart = "0"
	}
	if len(frac) > stroopScale {
		frac = frac[:stroopScale]
	}
	frac += strings.Repeat("0", stroopScale-len(frac))

	combined, ok := new(big.Int).SetString(intPart+frac, 10)
	if !ok {
		return "", fmt.Errorf("invalid decimal balance %q", dec)
	}
	return combined.String(), nil
}

var _ usecase.ReserveSource = (*Adapter)(nil)
