package onchain

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stellar/go/keypair"
)

func horizonStub(t *testing.T, bodies map[string]string, status map[string]int) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		addr := strings.TrimPrefix(r.URL.Path, "/accounts/")
		if code, ok := status[addr]; ok {
			w.WriteHeader(code)
			return
		}
		body, ok := bodies[addr]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
}

func nativeBody(balance string) string {
	return fmt.Sprintf(`{"balances":[{"balance":%q,"asset_type":"native"}]}`, balance)
}

func TestFetchSignedNativeAndCredit(t *testing.T) {
	const (
		acctA  = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
		acctB  = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
		issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
	)
	creditBody := fmt.Sprintf(
		`{"balances":[{"balance":"250.0000000","asset_type":"credit_alphanum4","asset_code":"USDC","asset_issuer":%q},{"balance":"1.5000000","asset_type":"native"}]}`,
		issuer,
	)
	srv := horizonStub(t, map[string]string{
		acctA: nativeBody("100.0000000"),
		acctB: creditBody,
	}, nil)
	defer srv.Close()

	adapter, err := NewAdapter(Config{
		HorizonURL: srv.URL,
		Holdings: []Holding{
			{Tenant: "tenant-1", Address: acctA},
			{Tenant: "tenant-1", Address: acctB, Code: "USDC", Issuer: issuer},
		},
	})
	if err != nil {
		t.Fatalf("NewAdapter: %v", err)
	}

	snap, err := adapter.FetchSigned(context.Background(), "tenant-1")
	if err != nil {
		t.Fatalf("FetchSigned: %v", err)
	}
	if snap.TenantID != "tenant-1" {
		t.Errorf("tenant = %q, want tenant-1", snap.TenantID)
	}
	if len(snap.Reserves) != 2 {
		t.Fatalf("got %d reserves, want 2", len(snap.Reserves))
	}

	native := snap.Reserves[0]
	if native.Balance != "1000000000" || native.Currency != "XLM" || native.SourceID != acctA {
		t.Errorf("native reserve = %+v", native)
	}
	credit := snap.Reserves[1]
	if credit.Balance != "2500000000" || credit.Currency != "USDC" || credit.SourceID != acctB+":USDC" {
		t.Errorf("credit reserve = %+v", credit)
	}
}

func TestFetchSignedAccountNotFound(t *testing.T) {
	const acct = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
	srv := horizonStub(t, nil, map[string]int{acct: http.StatusNotFound})
	defer srv.Close()

	adapter, _ := NewAdapter(Config{HorizonURL: srv.URL, Holdings: []Holding{{Tenant: "t", Address: acct}}})
	if _, err := adapter.FetchSigned(context.Background(), "t"); err == nil {
		t.Fatal("expected error for a missing account, got nil")
	}
}

func TestFetchSignedAssetNotHeld(t *testing.T) {
	const acct = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
	const issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
	srv := horizonStub(t, map[string]string{acct: nativeBody("10.0000000")}, nil)
	defer srv.Close()

	adapter, _ := NewAdapter(Config{
		HorizonURL: srv.URL,
		Holdings:   []Holding{{Tenant: "t", Address: acct, Code: "USDC", Issuer: issuer}},
	})
	_, err := adapter.FetchSigned(context.Background(), "t")
	if err == nil || !strings.Contains(err.Error(), "does not hold") {
		t.Fatalf("expected asset-not-held error, got %v", err)
	}
}

func TestFetchSignedTransientExhausted(t *testing.T) {
	const acct = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
	srv := horizonStub(t, nil, map[string]int{acct: http.StatusBadGateway})
	defer srv.Close()

	adapter, _ := NewAdapter(Config{
		HorizonURL:  srv.URL,
		Holdings:    []Holding{{Tenant: "t", Address: acct}},
		MaxAttempts: 2,
		BaseBackoff: time.Millisecond,
	})
	if _, err := adapter.FetchSigned(context.Background(), "t"); err == nil {
		t.Fatal("expected error after exhausting retries on 502, got nil")
	}
}

func TestToStroops(t *testing.T) {
	cases := []struct {
		in, want string
		wantErr  bool
	}{
		{in: "100.0000000", want: "1000000000"},
		{in: "100", want: "1000000000"},
		{in: "0.5", want: "5000000"},
		{in: "0.0000001", want: "1"},
		{in: "0", want: "0"},
		{in: "12345.6789012", want: "123456789012"},
		{in: "-5", wantErr: true},
		{in: "abc", wantErr: true},
		{in: "", wantErr: true},
	}
	for _, c := range cases {
		got, err := toStroops(c.in)
		if c.wantErr {
			if err == nil {
				t.Errorf("toStroops(%q) = %q, want error", c.in, got)
			}
			continue
		}
		if err != nil {
			t.Errorf("toStroops(%q): unexpected error %v", c.in, err)
			continue
		}
		if got != c.want {
			t.Errorf("toStroops(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestFetchSignedReadsOnlyTheCallingTenant(t *testing.T) {
	const (
		acctA = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
		acctB = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
	)
	srv := horizonStub(t, map[string]string{
		acctA: nativeBody("7.0000000"),
		acctB: nativeBody("9.0000000"),
	}, nil)
	defer srv.Close()

	adapter, err := NewAdapter(Config{
		HorizonURL: srv.URL,
		Holdings: []Holding{
			{Tenant: "harbor", Address: acctA},
			{Tenant: "other", Address: acctB},
		},
	})
	if err != nil {
		t.Fatalf("NewAdapter: %v", err)
	}

	snap, err := adapter.FetchSigned(context.Background(), "harbor")
	if err != nil {
		t.Fatalf("FetchSigned: %v", err)
	}
	if len(snap.Reserves) != 1 || snap.Reserves[0].SourceID != acctA || snap.Reserves[0].Balance != "70000000" {
		t.Fatalf("reserves = %+v, want only harbor's holding", snap.Reserves)
	}
}

func TestFetchSignedFailsForATenantWithoutHoldings(t *testing.T) {
	const acct = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
	srv := horizonStub(t, map[string]string{acct: nativeBody("1.0000000")}, nil)
	defer srv.Close()

	adapter, _ := NewAdapter(Config{HorizonURL: srv.URL, Holdings: []Holding{{Tenant: "harbor", Address: acct}}})
	_, err := adapter.FetchSigned(context.Background(), "someone-else")
	if err == nil || !strings.Contains(err.Error(), "no holdings for tenant someone-else") {
		t.Fatalf("expected a no-holdings error, got %v", err)
	}
}

func TestHasTenant(t *testing.T) {
	adapter, _ := NewAdapter(Config{
		HorizonURL: "https://horizon.test",
		Holdings:   []Holding{{Tenant: "harbor", Address: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"}},
	})
	if !adapter.HasTenant("harbor") || adapter.HasTenant("other") {
		t.Fatal("HasTenant should report only tenants with holdings")
	}
}

func TestParseHoldings(t *testing.T) {
	addr := keypair.MustRandom().Address()
	issuer := keypair.MustRandom().Address()

	holdings, err := ParseHoldings([]string{"t1=" + addr, " t2 = " + addr + "|USDC|" + issuer})
	if err != nil {
		t.Fatalf("ParseHoldings: %v", err)
	}
	if len(holdings) != 2 {
		t.Fatalf("got %d holdings, want 2", len(holdings))
	}
	if holdings[0].Tenant != "t1" || holdings[1].Tenant != "t2" {
		t.Errorf("tenants = %q, %q, want t1, t2", holdings[0].Tenant, holdings[1].Tenant)
	}
	if holdings[0].Code != "" {
		t.Errorf("first holding should be native, got code %q", holdings[0].Code)
	}
	if holdings[1].Code != "USDC" || holdings[1].Issuer != issuer {
		t.Errorf("second holding = %+v", holdings[1])
	}

	bad := [][]string{
		{addr},
		{"=" + addr},
		{"t=not-an-address"},
		{"t=" + addr + "|USDC"},
		{"t=" + addr + "|USDC|not-an-issuer"},
		{"t=" + addr + "|USDC|" + issuer + "|x"},
	}
	for _, specs := range bad {
		if _, err := ParseHoldings(specs); err == nil {
			t.Errorf("ParseHoldings(%v) should have failed", specs)
		}
	}
}
