// Command app is the sandbox entrypoint. It builds the signer, the mock bank
// registry, the OAuth server, and serves the HTTP API.
package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/sandbox/internal/bank"
	"github.com/jes-labs/solva/services/sandbox/internal/config"
	"github.com/jes-labs/solva/services/sandbox/internal/oauth"
	"github.com/jes-labs/solva/services/sandbox/internal/server"
	"github.com/jes-labs/solva/services/sandbox/internal/signer"
)

func main() {
	cfg := config.Load()
	log := newLogger(cfg.LogLevel)

	if err := run(cfg, log); err != nil {
		log.Fatal().Err(err).Msg("sandbox exited with error")
	}
}

func run(cfg config.Config, log zerolog.Logger) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	sgn, err := buildSigner(cfg, log)
	if err != nil {
		return err
	}

	registry := bank.NewRegistry()
	oauthSrv := oauth.NewServer()
	srv := server.New(registry, oauthSrv, sgn, log)

	httpServer := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           srv.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	serveErr := make(chan error, 1)
	go func() {
		log.Info().Str("addr", cfg.HTTPAddr).Msg("sandbox listening")
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serveErr <- err
			return
		}
		serveErr <- nil
	}()

	select {
	case <-ctx.Done():
		log.Info().Msg("shutdown signal received")
	case err := <-serveErr:
		if err != nil {
			return err
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return httpServer.Shutdown(shutdownCtx)
}

// buildSigner loads a pinned key when configured, otherwise generates an
// ephemeral one and logs its public PEM so the orchestrator can match it.
func buildSigner(cfg config.Config, log zerolog.Logger) (*signer.Signer, error) {
	if cfg.SigningKeyPEM != "" {
		sgn, err := signer.FromPEM([]byte(cfg.SigningKeyPEM))
		if err != nil {
			return nil, err
		}
		return sgn, nil
	}

	sgn, err := signer.New()
	if err != nil {
		return nil, err
	}
	pub, err := sgn.PublicKeyPEM()
	if err != nil {
		return nil, err
	}
	log.Warn().
		Str("public_key_pem", string(pub)).
		Msg("no signing key configured, generated ephemeral key, configure orchestrator with this public key")
	return sgn, nil
}

func newLogger(level string) zerolog.Logger {
	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.InfoLevel
	}
	return zerolog.New(os.Stdout).Level(lvl).With().Timestamp().Str("service", "sandbox").Logger()
}
