// Command app is the orchestrator entrypoint. It loads config, builds the
// logger, wires the layers, and serves the REST API.
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

	"github.com/jes-labs/solva/services/orchestrator/internal/config"
	controllerhttp "github.com/jes-labs/solva/services/orchestrator/internal/controller/http"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		// No logger yet, so write the boot failure plainly and exit.
		panic(err)
	}

	log := newLogger(cfg.LogLevel)

	if err := run(cfg, log); err != nil {
		log.Fatal().Err(err).Msg("orchestrator exited with error")
	}
}

// run wires dependencies and serves until a signal arrives. Infrastructure
// adapters are constructed here; the use cases below depend only on their
// interfaces. The dependency wiring is staged so the service can boot and
// serve health and metrics before every backing store is reachable.
func run(cfg config.Config, log zerolog.Logger) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	deps, cleanup, err := buildDeps(ctx, cfg, log)
	if err != nil {
		return err
	}
	defer cleanup()

	cycle := usecase.NewCycle(
		deps.banks,
		deps.prover,
		deps.stellar,
		deps.postgres,
		deps.postgres,
		deps.cache,
		log,
	)
	query := usecase.NewQuery(deps.postgres, deps.cache)

	handler := controllerhttp.NewHandler(cycle, query, log)
	router := controllerhttp.Router(handler, log)

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	serveErr := make(chan error, 1)
	go func() {
		log.Info().Str("addr", cfg.HTTPAddr).Msg("orchestrator listening")
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
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
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	return nil
}

// newLogger builds a zerolog logger at the configured level, defaulting to info
// on a bad value rather than failing to boot.
func newLogger(level string) zerolog.Logger {
	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.InfoLevel
	}
	return zerolog.New(os.Stdout).Level(lvl).With().Timestamp().Str("service", "orchestrator").Logger()
}
