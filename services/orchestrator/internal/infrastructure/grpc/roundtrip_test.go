package grpc

import (
	"context"
	"net"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"

	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/grpc/proverpb"
)

// stubProver is a canned prover server. It records the request so the test can
// assert the round-trip carried the fields, and returns a fixed response. The
// real proving lives in the Rust prover and is out of scope for this wiring test.
type stubProver struct {
	proverpb.UnimplementedProverServer
	got *proverpb.ProveRequest
}

func (s *stubProver) Prove(_ context.Context, req *proverpb.ProveRequest) (*proverpb.ProveResponse, error) {
	s.got = req
	return &proverpb.ProveResponse{
		Proof: []byte{0xde, 0xad, 0xbe, 0xef},
		PublicInputs: &proverpb.PublicInputs{
			ReservesTotal:    "16000000",
			LiabilitiesTotal: "9500000",
			RootHash:         "0xroot",
			PrevReserves:     req.GetPrevReserves(),
		},
		SerializedTree: []byte(`{"nodes":[]}`),
	}, nil
}

// TestProveRoundTrip confirms the generated client and server stubs talk over
// gRPC: a ProveRequest reaches the server intact and the ProveResponse comes
// back in the expected shape. It runs entirely in memory via bufconn.
func TestProveRoundTrip(t *testing.T) {
	lis := bufconn.Listen(1024 * 1024)
	stub := &stubProver{}
	srv := grpc.NewServer()
	proverpb.RegisterProverServer(srv, stub)
	go func() { _ = srv.Serve(lis) }()
	t.Cleanup(srv.Stop)

	conn, err := grpc.NewClient(
		"passthrough:///bufnet",
		grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) { return lis.DialContext(ctx) }),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { _ = conn.Close() })

	client := proverpb.NewProverClient(conn)
	resp, err := client.Prove(context.Background(), &proverpb.ProveRequest{
		Reserves:     []*proverpb.Reserve{{SourceId: "acct-anchor", Balance: "16000000"}},
		Liabilities:  []*proverpb.Liability{{CustomerIdHash: "0xhash", Balance: "9500000"}},
		PrevReserves: "15000000",
		TreeDepth:    32,
	})
	if err != nil {
		t.Fatalf("Prove: %v", err)
	}

	// Response shape.
	if len(resp.GetProof()) == 0 {
		t.Error("proof is empty")
	}
	if resp.GetPublicInputs() == nil {
		t.Fatal("public_inputs is nil")
	}
	if got := resp.GetPublicInputs().GetPrevReserves(); got != "15000000" {
		t.Errorf("prev_reserves round-trip = %q, want 15000000", got)
	}
	if len(resp.GetSerializedTree()) == 0 {
		t.Error("serialized_tree is empty")
	}

	// Request mapping reached the server intact.
	if got := stub.got.GetReserves()[0].GetSourceId(); got != "acct-anchor" {
		t.Errorf("server got source_id %q, want acct-anchor", got)
	}
	if got := stub.got.GetTreeDepth(); got != 32 {
		t.Errorf("server got tree_depth %d, want 32", got)
	}
}
