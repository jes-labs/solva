// Package oauth implements a minimal OAuth 2.0 authorization-code flow for the
// sandbox. It is a mock consent surface: the authorize endpoint issues a code,
// the token endpoint exchanges it for a bearer token. It is not a production
// authorization server and does no real user authentication.
package oauth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

// ErrBadCode means the authorization code is unknown, used, or expired.
var ErrBadCode = errors.New("oauth: invalid or expired authorization code")

// ErrBadToken means the bearer token is unknown or expired.
var ErrBadToken = errors.New("oauth: invalid or expired access token")

const (
	codeTTL  = 5 * time.Minute
	tokenTTL = time.Hour
)

// grant is an issued authorization code waiting to be exchanged.
type grant struct {
	clientID  string
	expiresAt time.Time
}

// token is an issued access token.
type token struct {
	clientID  string
	expiresAt time.Time
}

// Server tracks issued codes and tokens in memory. It is safe for concurrent
// use.
type Server struct {
	mu     sync.Mutex
	grants map[string]grant
	tokens map[string]token
}

// NewServer builds an empty OAuth server.
func NewServer() *Server {
	return &Server{
		grants: make(map[string]grant),
		tokens: make(map[string]token),
	}
}

// Authorize records consent for a client and returns an authorization code.
func (s *Server) Authorize(clientID string) (string, error) {
	code, err := randomToken()
	if err != nil {
		return "", err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.grants[code] = grant{clientID: clientID, expiresAt: time.Now().Add(codeTTL)}
	return code, nil
}

// Exchange swaps a one-time authorization code for an access token. The code is
// consumed on success so it cannot be replayed.
func (s *Server) Exchange(code string) (string, time.Duration, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	g, ok := s.grants[code]
	if !ok || time.Now().After(g.expiresAt) {
		delete(s.grants, code)
		return "", 0, ErrBadCode
	}
	delete(s.grants, code)

	access, err := randomToken()
	if err != nil {
		return "", 0, err
	}
	s.tokens[access] = token{clientID: g.clientID, expiresAt: time.Now().Add(tokenTTL)}
	return access, tokenTTL, nil
}

// Validate reports whether an access token is currently valid.
func (s *Server) Validate(access string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.tokens[access]
	if !ok || time.Now().After(t.expiresAt) {
		return ErrBadToken
	}
	return nil
}

func randomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
