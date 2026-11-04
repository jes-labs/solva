package http

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/rs/zerolog"
)

func postCycle(t *testing.T, srv *httptest.Server, authorization string) int {
	t.Helper()
	req, err := http.NewRequest(http.MethodPost, srv.URL+"/v1/cycles",
		strings.NewReader(`{"tenant_id":"11111111-1111-1111-1111-111111111111"}`))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	if authorization != "" {
		req.Header.Set("Authorization", authorization)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	return res.StatusCode
}

func TestTriggerCycleRequiresAPIToken(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, "api-s3cr3t", zerolog.Nop()))
	defer srv.Close()

	if got := postCycle(t, srv, ""); got != http.StatusUnauthorized {
		t.Errorf("no token: status %d, want 401", got)
	}
	if got := postCycle(t, srv, "Bearer wrong"); got != http.StatusUnauthorized {
		t.Errorf("wrong token: status %d, want 401", got)
	}
	if got := postCycle(t, srv, "Bearer api-s3cr3t"); got == http.StatusUnauthorized {
		t.Errorf("right token: status %d, want the cycle to run", got)
	}
}

func TestTriggerCycleOpenWhenAPITokenUnset(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, "", zerolog.Nop()))
	defer srv.Close()

	if got := postCycle(t, srv, ""); got == http.StatusUnauthorized {
		t.Errorf("unset token: status %d, want the cycle to run", got)
	}
}

func TestReadsStayPublicWhenAPITokenSet(t *testing.T) {
	h := NewHandler(stubCycle{}, &stubQuery{}, &stubProvision{}, "", zerolog.Nop())
	srv := httptest.NewServer(Router(h, "api-s3cr3t", zerolog.Nop()))
	defer srv.Close()

	res, err := http.Get(srv.URL + "/v1/tenants/11111111-1111-1111-1111-111111111111/contract")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusUnauthorized {
		t.Errorf("tenant contract read: status 401, want public")
	}
}
