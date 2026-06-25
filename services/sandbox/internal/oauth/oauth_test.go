package oauth

import (
	"errors"
	"testing"
)

// The happy path: a code exchanges for a token that validates.
func TestAuthorizeExchangeValidate(t *testing.T) {
	s := NewServer()

	code, err := s.Authorize("client-1")
	if err != nil {
		t.Fatalf("authorize: %v", err)
	}

	access, ttl, err := s.Exchange(code)
	if err != nil {
		t.Fatalf("exchange: %v", err)
	}
	if access == "" || ttl <= 0 {
		t.Fatalf("token=%q ttl=%v, want a token and positive ttl", access, ttl)
	}
	if err := s.Validate(access); err != nil {
		t.Errorf("validate fresh token: %v", err)
	}
}

// An authorization code is single-use: the first exchange consumes it, a replay
// is rejected. This stops a leaked code from minting more tokens.
func TestExchangeIsOneTime(t *testing.T) {
	s := NewServer()
	code, _ := s.Authorize("client-1")

	if _, _, err := s.Exchange(code); err != nil {
		t.Fatalf("first exchange: %v", err)
	}
	if _, _, err := s.Exchange(code); !errors.Is(err, ErrBadCode) {
		t.Errorf("replayed code err = %v, want ErrBadCode", err)
	}
}

func TestExchangeRejectsUnknownCode(t *testing.T) {
	s := NewServer()
	if _, _, err := s.Exchange("not-a-code"); !errors.Is(err, ErrBadCode) {
		t.Errorf("err = %v, want ErrBadCode", err)
	}
}

func TestValidateRejectsUnknownToken(t *testing.T) {
	s := NewServer()
	if err := s.Validate("not-a-token"); !errors.Is(err, ErrBadToken) {
		t.Errorf("err = %v, want ErrBadToken", err)
	}
}
