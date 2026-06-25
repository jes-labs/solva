// Package router wires the HTTP routes for the orchestrator REST API.
package router

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/http/handler"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/http/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// New builds and returns the root http.Handler for the orchestrator service.
func New(
	proofH *handler.ProofHandler,
	cycleH *handler.CycleHandler,
	healthH *handler.HealthHandler,
	logger *slog.Logger,
) http.Handler {
	// Set Gin production mode if needed via environment variables elsewhere,
	// or leave to default gin.DebugMode for local development.
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()

	// Add global middleware
	r.Use(middleware.Logger(logger))
	r.Use(gin.Recovery())

	// Handlers and Routing
	r.POST("/v1/cycles", cycleH.Trigger)
	r.GET("/v1/proofs/latest", proofH.GetLatest)
	r.GET("/v1/proofs/inclusion/:ref", proofH.GetByInclusionRef)
	r.GET("/v1/proofs/:id", proofH.GetByID)
	r.GET("/health", healthH.Liveness)

	// Wrapping custom standard standard library handlers into Gin routes
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	return r
}
