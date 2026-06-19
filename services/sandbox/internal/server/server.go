// Package server wires the sandbox HTTP API: OAuth consent, signed balance
// reads, and the admin scenario seeder. Each concern stays in its own handler
// method so the surfaces are independent.
package server

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"

	"github.com/jes-labs/solva/services/sandbox/internal/bank"
	"github.com/jes-labs/solva/services/sandbox/internal/oauth"
	"github.com/jes-labs/solva/services/sandbox/internal/signer"
)

// Server holds the sandbox dependencies the routes need.
type Server struct {
	registry *bank.Registry
	oauth    *oauth.Server
	signer   *signer.Signer
	log      zerolog.Logger
}

// New builds the server.
func New(registry *bank.Registry, oauthSrv *oauth.Server, sgn *signer.Signer, log zerolog.Logger) *Server {
	return &Server{registry: registry, oauth: oauthSrv, signer: sgn, log: log}
}

// Router mounts every route.
func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)

	r.Get("/oauth/authorize", s.authorize)
	r.Post("/oauth/token", s.token)

	r.Route("/v1", func(r chi.Router) {
		r.Get("/accounts/{id}/balance", s.balance)
	})

	r.Post("/admin/scenarios/{name}", s.seedScenario)
	r.Get("/health", s.health)
	r.Get("/.well-known/solva-signing-key.pem", s.publicKey)

	return r
}

// authorize issues an authorization code for the client_id. A real consent UI
// would prompt the user; the sandbox grants immediately.
func (s *Server) authorize(w http.ResponseWriter, r *http.Request) {
	clientID := r.URL.Query().Get("client_id")
	if clientID == "" {
		writeError(w, http.StatusBadRequest, "client_id is required")
		return
	}
	code, err := s.oauth.Authorize(clientID)
	if err != nil {
		s.log.Error().Err(err).Msg("authorize")
		writeError(w, http.StatusInternalServerError, "could not issue code")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"code": code})
}

// tokenResponse follows the OAuth 2.0 token response shape.
type tokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// token exchanges an authorization code for a bearer token.
func (s *Server) token(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		writeError(w, http.StatusBadRequest, "invalid form body")
		return
	}
	code := r.Form.Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "code is required")
		return
	}

	access, ttl, err := s.oauth.Exchange(code)
	if errors.Is(err, oauth.ErrBadCode) {
		writeError(w, http.StatusBadRequest, "invalid or expired code")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}
	writeJSON(w, http.StatusOK, tokenResponse{
		AccessToken: access,
		TokenType:   "Bearer",
		ExpiresIn:   int(ttl.Seconds()),
	})
}

// balanceResponse is the signed payload the orchestrator verifies. Signature is
// base64 over the DER ECDSA signature of the canonical payload.
type balanceResponse struct {
	SourceID  string `json:"source_id"`
	Balance   string `json:"balance"`
	Currency  string `json:"currency"`
	AsOf      string `json:"as_of"`
	Signature string `json:"signature"`
}

// balance returns a signed balance for an account. It requires a valid bearer
// token, then signs the canonical payload with the sandbox key.
func (s *Server) balance(w http.ResponseWriter, r *http.Request) {
	if err := s.requireToken(r); err != nil {
		writeError(w, http.StatusUnauthorized, "missing or invalid access token")
		return
	}

	accountID := chi.URLParam(r, "id")
	acct, err := s.registry.Get(accountID)
	if errors.Is(err, bank.ErrUnknownAccount) {
		writeError(w, http.StatusNotFound, "unknown account")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not read account")
		return
	}

	asOf := time.Now().UTC().Format(time.RFC3339)
	payload, err := bank.CanonicalPayload(acct.AccountID, acct.Balance, acct.Currency, asOf)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not build payload")
		return
	}
	sig, err := s.signer.Sign(payload)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not sign payload")
		return
	}

	writeJSON(w, http.StatusOK, balanceResponse{
		SourceID:  acct.AccountID,
		Balance:   acct.Balance,
		Currency:  acct.Currency,
		AsOf:      asOf,
		Signature: base64.StdEncoding.EncodeToString(sig),
	})
}

// seedScenario sets all balances to a named scenario for deterministic demos.
func (s *Server) seedScenario(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	err := s.registry.Seed(name)
	if errors.Is(err, bank.ErrUnknownScenario) {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"error":     "unknown scenario",
			"available": bank.Scenarios(),
		})
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not seed scenario")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"scenario": name, "status": "seeded"})
}

// publicKey serves the PEM public key so the orchestrator can be configured to
// verify the sandbox's signatures.
func (s *Server) publicKey(w http.ResponseWriter, r *http.Request) {
	pem, err := s.signer.PublicKeyPEM()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not export public key")
		return
	}
	w.Header().Set("Content-Type", "application/x-pem-file")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pem)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// requireToken pulls the bearer token from the Authorization header and checks
// it against the OAuth server.
func (s *Server) requireToken(r *http.Request) error {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return oauth.ErrBadToken
	}
	access := strings.TrimPrefix(header, "Bearer ")
	return s.oauth.Validate(access)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
