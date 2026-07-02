// Package http wires the REST API. Handlers call use cases through their
// interfaces and never touch infrastructure directly. Routes follow PRD 2
// section 13.1.
package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
)

// Router mounts the routes. When apiToken is set, /v1 and /metrics require it;
// /health stays open for liveness probes.
func Router(h *Handler, apiToken string, log zerolog.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	// Gated: sensitive API + metrics.
	r.Group(func(r chi.Router) {
		r.Use(requireToken(apiToken))

		r.Route("/v1", func(r chi.Router) {
			r.Post("/cycles", h.TriggerCycle)
			r.Get("/proofs/latest", h.GetLatestProof)
			r.Get("/proofs/{id}", h.GetProof)
			r.Get("/proofs/inclusion/{ref}", h.GetInclusion)
			r.Get("/tenants/{id}/contract", h.GetTenantContract)
		})

		r.Handle("/metrics", promhttp.Handler())
	})

	// Open for liveness probes.
	r.Get("/health", h.Health)

	return r
}
