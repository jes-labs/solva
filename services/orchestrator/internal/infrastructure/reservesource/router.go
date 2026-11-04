package reservesource

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

type Kind string

const (
	Attested Kind = "attested"
	OnChain  Kind = "onchain"
)

var ErrNoOnChainSource = errors.New("reservesource: a tenant uses onchain but no on-chain holdings are configured")

type OnChainSource interface {
	usecase.ReserveSource
	HasTenant(tenantID string) bool
}

func ParseSources(specs []string) (map[string]Kind, error) {
	sources := make(map[string]Kind, len(specs))
	for _, spec := range specs {
		tenant, kind, found := strings.Cut(spec, "=")
		tenant, kind = strings.TrimSpace(tenant), strings.TrimSpace(kind)
		if !found || tenant == "" {
			return nil, fmt.Errorf("reservesource: %q must be TENANT_ID=attested or TENANT_ID=onchain", spec)
		}
		if Kind(kind) != Attested && Kind(kind) != OnChain {
			return nil, fmt.Errorf("reservesource: %q names an unknown source %q", spec, kind)
		}
		if _, seen := sources[tenant]; seen {
			return nil, fmt.Errorf("reservesource: tenant %s is listed twice", tenant)
		}
		sources[tenant] = Kind(kind)
	}
	return sources, nil
}

type Router struct {
	attested usecase.ReserveSource
	onchain  usecase.ReserveSource
	sources  map[string]Kind
}

func NewRouter(attested usecase.ReserveSource, onchain OnChainSource, sources map[string]Kind) (*Router, error) {
	router := &Router{attested: attested, sources: sources}
	for tenant, kind := range sources {
		if kind != OnChain {
			continue
		}
		if onchain == nil {
			return nil, ErrNoOnChainSource
		}
		if !onchain.HasTenant(tenant) {
			return nil, fmt.Errorf("reservesource: tenant %s uses onchain but has no holdings", tenant)
		}
		router.onchain = onchain
	}
	return router, nil
}

func (r *Router) FetchSigned(ctx context.Context, tenantID string) (entity.ReserveSnapshot, error) {
	if r.sources[tenantID] == OnChain {
		return r.onchain.FetchSigned(ctx, tenantID)
	}
	return r.attested.FetchSigned(ctx, tenantID)
}

var _ usecase.ReserveSource = (*Router)(nil)
