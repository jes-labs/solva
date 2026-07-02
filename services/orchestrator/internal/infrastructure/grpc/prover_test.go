package grpc_test

import (
	"context"
	"fmt"
	"net"
	"testing"

	"google.golang.org/grpc"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	grpcinfra "github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/grpc"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/grpc/proverpb"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// fakeProver is an in-process gRPC server that records the request it received
// and returns a canned response.
type fakeProver struct {
	proverpb.UnimplementedProverServer
	capturedReq *proverpb.ProveRequest
	response    *proverpb.ProveResponse
	respondErr  error
}

func (f *fakeProver) Prove(_ context.Context, req *proverpb.ProveRequest) (*proverpb.ProveResponse, error) {
	f.capturedReq = req
	if f.respondErr != nil {
		return nil, f.respondErr
	}
	return f.response, nil
}

// startFakeProver starts an in-process gRPC server and returns a connected
// ProverClient. Call stop() in a defer to shut down cleanly.
func startFakeProver(t *testing.T, fp *fakeProver) (*grpcinfra.ProverClient, func()) {
	t.Helper()

	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}

	srv := grpc.NewServer()
	proverpb.RegisterProverServer(srv, fp)
	go func() { _ = srv.Serve(lis) }()

	client, err := grpcinfra.NewProverClient(lis.Addr().String())
	if err != nil {
		srv.Stop()
		t.Fatalf("NewProverClient: %v", err)
	}

	return client, func() {
		_ = client.Close()
		srv.GracefulStop()
	}
}

// Request and response mapping

func TestProve_RequestMapping(t *testing.T) {
	fp := &fakeProver{
		response: &proverpb.ProveResponse{
			Proof: []byte("proof-bytes"),
			PublicInputs: &proverpb.PublicInputs{
				ReservesTotal:    "5000",
				LiabilitiesTotal: "3000",
				RootHash:         "0xdeadbeef",
				PrevReserves:     "4000",
			},
			SerializedTree: []byte("tree-bytes"),
		},
	}
	client, stop := startFakeProver(t, fp)
	defer stop()

	reserves := []entity.Reserve{
		{SourceID: "bank-a", Balance: "3000", Currency: "USD"},
		{SourceID: "bank-b", Balance: "2000", Currency: "USD"},
	}
	liabilities := []usecase.Liability{
		{CustomerIDHash: "0xaabbcc", Balance: "1500"},
		{CustomerIDHash: "0xddeeff", Balance: "1500"},
	}

	if _, err := client.Prove(context.Background(), reserves, liabilities, "4000"); err != nil {
		t.Fatalf("Prove: %v", err)
	}

	req := fp.capturedReq
	if req == nil {
		t.Fatal("fake prover did not receive a request")
	}

	if got, want := len(req.Reserves), 2; got != want {
		t.Errorf("len(Reserves): got %d, want %d", got, want)
	}
	if got, want := req.Reserves[0].SourceId, "bank-a"; got != want {
		t.Errorf("Reserves[0].SourceId: got %q, want %q", got, want)
	}
	if got, want := req.Reserves[0].Balance, "3000"; got != want {
		t.Errorf("Reserves[0].Balance: got %q, want %q", got, want)
	}
	if got, want := req.Reserves[1].SourceId, "bank-b"; got != want {
		t.Errorf("Reserves[1].SourceId: got %q, want %q", got, want)
	}
	if got, want := len(req.Liabilities), 2; got != want {
		t.Errorf("len(Liabilities): got %d, want %d", got, want)
	}
	if got, want := req.Liabilities[0].CustomerIdHash, "0xaabbcc"; got != want {
		t.Errorf("Liabilities[0].CustomerIdHash: got %q, want %q", got, want)
	}
	if got, want := req.Liabilities[0].Balance, "1500"; got != want {
		t.Errorf("Liabilities[0].Balance: got %q, want %q", got, want)
	}
	if got, want := req.PrevReserves, "4000"; got != want {
		t.Errorf("PrevReserves: got %q, want %q", got, want)
	}
	if got, want := req.TreeDepth, uint32(32); got != want {
		t.Errorf("TreeDepth: got %d, want %d", got, want)
	}
}

func TestProve_ResponseMapping(t *testing.T) {
	fp := &fakeProver{
		response: &proverpb.ProveResponse{
			Proof: []byte("the-proof"),
			PublicInputs: &proverpb.PublicInputs{
				ReservesTotal:    "9000",
				LiabilitiesTotal: "7000",
				RootHash:         "0xrootroot",
				PrevReserves:     "8000",
			},
			SerializedTree: []byte("the-tree"),
		},
	}
	client, stop := startFakeProver(t, fp)
	defer stop()

	result, err := client.Prove(
		context.Background(),
		[]entity.Reserve{{SourceID: "s", Balance: "9000"}},
		[]usecase.Liability{{CustomerIDHash: "0xaa", Balance: "7000"}},
		"8000",
	)
	if err != nil {
		t.Fatalf("Prove: %v", err)
	}

	checks := []struct {
		label string
		got   string
		want  string
	}{
		{"Proof", string(result.Proof), "the-proof"},
		{"ReservesTotal", result.PublicInputs.ReservesTotal, "9000"},
		{"LiabilitiesTotal", result.PublicInputs.LiabilitiesTotal, "7000"},
		{"RootHash", result.PublicInputs.RootHash, "0xrootroot"},
		{"PrevReserves", result.PublicInputs.PrevReserves, "8000"},
		{"SerializedTree", string(result.SerializedTree), "the-tree"},
	}
	for _, c := range checks {
		if c.got != c.want {
			t.Errorf("%s: got %q, want %q", c.label, c.got, c.want)
		}
	}
}

// Zeroization
//
// zeroizeRequest operates on the ProverClient-allocated request struct, not on
// anything that crosses the wire. The fake server receives a deserialized copy
// in its own memory -- checking capturedReq after the call tests the wrong
// allocation. Instead we test zeroization in two complementary ways:
//
//  1. TestZeroizeRequest_DirectUnit: calls the internal helper directly
//     (via the exported shim in export_test.go) and asserts byte-level zeroing.
//
//  2. TestProve_CallerSlicesUntouched: confirms that Prove never mutates the
//     caller's original reserve and liability slices regardless of zeroization.

func TestZeroizeRequest_DirectUnit(t *testing.T) {
	req := grpcinfra.BuildRequestForTest(
		[]entity.Reserve{{SourceID: "src", Balance: "9999", Currency: "USD"}},
		[]usecase.Liability{{CustomerIDHash: "0xsecret", Balance: "4242"}},
		"8888",
	)

	grpcinfra.ZeroizeRequestForTest(req)

	for _, l := range req.Liabilities {
		assertZeroed(t, "Liability.Balance", l.Balance)
		assertZeroed(t, "Liability.CustomerIdHash", l.CustomerIdHash)
	}
	for _, r := range req.Reserves {
		assertZeroed(t, "Reserve.Balance", r.Balance)
	}
	assertZeroed(t, "PrevReserves", req.PrevReserves)
}

func assertZeroed(t *testing.T, label, s string) {
	t.Helper()
	for _, b := range []byte(s) {
		if b != 0 {
			t.Errorf("%s: not zeroed, still contains non-zero byte in %q", label, s)
			return
		}
	}
}

func TestProve_CallerSlicesUntouched(t *testing.T) {
	fp := &fakeProver{
		response: &proverpb.ProveResponse{
			Proof: []byte("p"),
			PublicInputs: &proverpb.PublicInputs{
				ReservesTotal: "100", LiabilitiesTotal: "50",
				RootHash: "0x1", PrevReserves: "90",
			},
			SerializedTree: []byte("t"),
		},
	}
	client, stop := startFakeProver(t, fp)
	defer stop()

	reserves := []entity.Reserve{{SourceID: "s", Balance: "100"}}
	liabilities := []usecase.Liability{{CustomerIDHash: "0xsecret", Balance: "50"}}

	if _, err := client.Prove(context.Background(), reserves, liabilities, "90"); err != nil {
		t.Fatalf("Prove: %v", err)
	}

	if reserves[0].Balance != "100" {
		t.Errorf("caller's reserve mutated: got %q", reserves[0].Balance)
	}
	if liabilities[0].Balance != "50" {
		t.Errorf("caller's liability Balance mutated: got %q", liabilities[0].Balance)
	}
	if liabilities[0].CustomerIDHash != "0xsecret" {
		t.Errorf("caller's CustomerIDHash mutated: got %q", liabilities[0].CustomerIDHash)
	}
}

// Error paths
func TestProve_PropagatesRPCError(t *testing.T) {
	fp := &fakeProver{respondErr: fmt.Errorf("prover crashed")}
	client, stop := startFakeProver(t, fp)
	defer stop()

	_, err := client.Prove(
		context.Background(),
		[]entity.Reserve{{SourceID: "s", Balance: "100"}},
		[]usecase.Liability{{CustomerIDHash: "0xaa", Balance: "50"}},
		"0",
	)
	if err == nil {
		t.Fatal("expected error from RPC failure, got nil")
	}
}

func TestProve_MissingPublicInputsIsError(t *testing.T) {
	fp := &fakeProver{
		response: &proverpb.ProveResponse{
			Proof:          []byte("p"),
			PublicInputs:   nil,
			SerializedTree: []byte("t"),
		},
	}
	client, stop := startFakeProver(t, fp)
	defer stop()

	_, err := client.Prove(
		context.Background(),
		[]entity.Reserve{{SourceID: "s", Balance: "100"}},
		[]usecase.Liability{{CustomerIDHash: "0xaa", Balance: "50"}},
		"0",
	)
	if err == nil {
		t.Fatal("expected error for nil public_inputs, got nil")
	}
}
