package main

import (
	"context"
	"crypto/tls"
	"fmt"

	"github.com/rs/zerolog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"github.com/jes-labs/solva/services/orchestrator/internal/config"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/banks"
	grpcprover "github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/grpc"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/stellar"
	"github.com/jes-labs/solva/services/orchestrator/internal/repo"
)

// deps holds the concrete adapters the use cases run on. They are exposed only
// to main, which assembles the use cases from them.
type deps struct {
	postgres *repo.Postgres
	cache    *repo.RedisCache
	prover   *grpcprover.ProverClient
	stellar  *stellar.Publisher
	banks    *banks.Adapter
}

// buildDeps connects every backing store and adapter. It returns a cleanup
// function that closes them in reverse order. A failure to reach Postgres or
// Redis is a hard boot failure, since the orchestrator cannot run a cycle or
// serve proofs without them.
func buildDeps(ctx context.Context, cfg config.Config, log zerolog.Logger) (deps, func(), error) {
	pg, err := repo.NewPostgres(ctx, cfg.PostgresURL)
	if err != nil {
		return deps{}, nil, fmt.Errorf("connect postgres: %w", err)
	}

	cache, err := repo.NewRedisCache(ctx, cfg.RedisURL)
	if err != nil {
		pg.Close()
		return deps{}, nil, fmt.Errorf("connect redis: %w", err)
	}

	// When the prover sits behind a TLS endpoint (e.g. Cloud Run on host:443),
	// override the plaintext default with TLS transport credentials. gRPC applies
	// the later WithTransportCredentials option, so this wins over the insecure
	// default that NewProverClient sets.
	var proverOpts []grpc.DialOption
	if cfg.ProverTLS {
		proverOpts = append(proverOpts,
			grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})))
	}
	if cfg.ProverToken != "" {
		proverOpts = append(proverOpts, grpc.WithPerRPCCredentials(bearerToken{cfg.ProverToken}))
	}
	prover, err := grpcprover.NewProverClient(cfg.ProverAddr, proverOpts...)
	if err != nil {
		_ = cache.Close()
		pg.Close()
		return deps{}, nil, fmt.Errorf("dial prover: %w", err)
	}

	publisher, err := stellar.NewPublisher(stellar.Config{
		RPCURL:            cfg.StellarRPCURL,
		NetworkPassphrase: cfg.StellarNetworkPassphrase,
		SignerSecret:      cfg.StellarSignerSecret,
	})
	if err != nil {
		_ = prover.Close()
		_ = cache.Close()
		pg.Close()
		return deps{}, nil, fmt.Errorf("build stellar publisher: %w", err)
	}

	pubKey, err := banks.ParsePublicKey([]byte(cfg.BankPublicKeyPEM))
	if err != nil {
		// The sandbox public key is required to trust bank balances. Without
		// it the cycle cannot verify signatures, so refuse to boot.
		_ = prover.Close()
		_ = cache.Close()
		pg.Close()
		return deps{}, nil, fmt.Errorf("parse bank public key: %w", err)
	}
	bankAdapter := banks.NewAdapter(banks.Config{
		BaseURL:  cfg.BankBaseURL,
		Accounts: cfg.BankAccounts,
		PubKey:   pubKey,
		ClientID: cfg.BankClientID,
	})

	cleanup := func() {
		_ = prover.Close()
		_ = cache.Close()
		pg.Close()
	}

	return deps{
		postgres: pg,
		cache:    cache,
		prover:   prover,
		stellar:  publisher,
		banks:    bankAdapter,
	}, cleanup, nil
}

// bearerToken sends the prover API token as gRPC per-RPC metadata. It permits
// plaintext transport since a local prover runs without TLS.
type bearerToken struct{ token string }

func (b bearerToken) GetRequestMetadata(context.Context, ...string) (map[string]string, error) {
	return map[string]string{"authorization": "Bearer " + b.token}, nil
}

func (bearerToken) RequireTransportSecurity() bool { return false }
