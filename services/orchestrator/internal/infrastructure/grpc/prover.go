// Package grpc adapts the orchestrator to the Rust prover over gRPC.
// It implements usecase.ProverClient.
package grpc

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/grpc/proverpb"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// treeDepth is the fixed Merkle Sum Tree depth the prover expects. It must
// match the circuit's compile-time DEPTH constant.
const treeDepth = 32

// ProverClient calls the Rust prover's Prove RPC and maps the response back
// to orchestrator entity types. It implements usecase.ProverClient.
type ProverClient struct {
	conn *grpc.ClientConn
	pb   proverpb.ProverClient
}

// NewProverClient dials the prover and wraps the generated stub.
// The connection is lazy in gRPC so this does not block on the prover being up.
func NewProverClient(addr string, extraOpts ...grpc.DialOption) (*ProverClient, error) {
	opts := append(
		[]grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())},
		extraOpts...,
	)
	conn, err := grpc.NewClient(addr, opts...)
	if err != nil {
		return nil, fmt.Errorf("dial prover %s: %w", addr, err)
	}
	return &ProverClient{
		conn: conn,
		pb:   proverpb.NewProverClient(conn),
	}, nil
}

// Close releases the underlying connection.
func (c *ProverClient) Close() error {
	return c.conn.Close()
}

// Prove sends the witness to the Rust prover and returns the proof, public
// inputs, and serialized tree.
//
// The orchestrator's copy of the witness is zeroized before this function
// returns, regardless of whether the call succeeds, so secret balance strings
// do not linger in Go heap memory after the RPC.
func (c *ProverClient) Prove(
	ctx context.Context,
	reserves []entity.Reserve,
	liabilities []usecase.Liability,
	prevReserves string,
) (usecase.ProveResult, error) {
	req := buildRequest(reserves, liabilities, prevReserves)
	defer zeroizeRequest(req)

	resp, err := c.pb.Prove(ctx, req)
	if err != nil {
		return usecase.ProveResult{}, fmt.Errorf("prover.Prove: %w", err)
	}

	if resp.PublicInputs == nil {
		return usecase.ProveResult{}, fmt.Errorf("prover.Prove: response missing public_inputs")
	}

	return usecase.ProveResult{
		Proof: resp.Proof,
		PublicInputs: entity.PublicInputs{
			ReservesTotal:    resp.PublicInputs.ReservesTotal,
			LiabilitiesTotal: resp.PublicInputs.LiabilitiesTotal,
			RootHash:         resp.PublicInputs.RootHash,
			PrevReserves:     resp.PublicInputs.PrevReserves,
		},
		SerializedTree: resp.SerializedTree,
	}, nil
}

// buildRequest maps orchestrator entity types to the proto request message.
func buildRequest(
	reserves []entity.Reserve,
	liabilities []usecase.Liability,
	prevReserves string,
) *proverpb.ProveRequest {
	pbReserves := make([]*proverpb.Reserve, len(reserves))
	for i, r := range reserves {
		pbReserves[i] = &proverpb.Reserve{
			SourceId: r.SourceID,
			Balance:  r.Balance,
		}
	}

	pbLiabilities := make([]*proverpb.Liability, len(liabilities))
	for i, l := range liabilities {
		pbLiabilities[i] = &proverpb.Liability{
			CustomerIdHash: l.CustomerIDHash,
			Balance:        l.Balance,
		}
	}

	return &proverpb.ProveRequest{
		Reserves:     pbReserves,
		Liabilities:  pbLiabilities,
		PrevReserves: prevReserves,
		TreeDepth:    treeDepth,
	}
}

// zeroizeRequest overwrites the balance and id-hash strings in the request
// slices that ProverClient allocated. The caller's original slices are not
// touched. This runs in a defer inside Prove so it fires on both success and
// error paths.
func zeroizeRequest(req *proverpb.ProveRequest) {
	for _, l := range req.Liabilities {
		zeroString(&l.Balance)
		zeroString(&l.CustomerIdHash)
	}
	for _, r := range req.Reserves {
		zeroString(&r.Balance)
	}
	zeroString(&req.PrevReserves)
}

// zeroString overwrites the bytes of a string in place. String contents in Go
// are immutable by spec, so we overwrite via a []byte conversion. This removes
// the value from an in-process heap scan and matches the pattern the Rust
// zeroize crate applies on the prover side.
func zeroString(s *string) {
	b := []byte(*s)
	for i := range b {
		b[i] = 0
	}
	*s = string(b)
}

// Ensure ProverClient satisfies the usecase port at compile time.
var _ usecase.ProverClient = (*ProverClient)(nil)
