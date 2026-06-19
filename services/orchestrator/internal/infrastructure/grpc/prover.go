// Package grpc adapts the orchestrator to the Rust prover over gRPC. It
// implements usecase.ProverClient.
package grpc

import (
	"context"
	"errors"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// treeDepth is the fixed Merkle Sum Tree depth the prover expects. It must
// match the circuit's compile-time DEPTH.
const treeDepth = 32

// errStubsNotGenerated is returned until `just proto` generates the proverpb
// stubs. The wiring below is correct; only the generated call is pending.
var errStubsNotGenerated = errors.New("grpc: proverpb stubs not generated, run `just proto`")

// ProverClient calls the Rust prover's Prove RPC.
type ProverClient struct {
	conn *grpc.ClientConn
	// pb proverpb.ProverClient // set once proverpb is generated.
}

// NewProverClient dials the prover. The connection is lazy in gRPC, so this
// does not block on the prover being up.
func NewProverClient(addr string) (*ProverClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("dial prover %s: %w", addr, err)
	}
	return &ProverClient{conn: conn}, nil
}

// Close releases the underlying connection.
func (c *ProverClient) Close() error {
	return c.conn.Close()
}

// Prove sends the witness to the prover and returns the proof, public inputs,
// and serialized tree.
//
// Once proverpb is generated, the body becomes a direct mapping:
//
//	req := &proverpb.ProveRequest{
//	    Reserves:     toPBReserves(reserves),
//	    Liabilities:  toPBLiabilities(liabilities),
//	    PrevReserves: prevReserves,
//	    TreeDepth:    treeDepth,
//	}
//	resp, err := c.pb.Prove(ctx, req)
//	...
//	return usecase.ProveResult{
//	    Proof: resp.Proof,
//	    PublicInputs: entity.PublicInputs{
//	        ReservesTotal:    resp.PublicInputs.ReservesTotal,
//	        LiabilitiesTotal: resp.PublicInputs.LiabilitiesTotal,
//	        RootHash:         resp.PublicInputs.RootHash,
//	        PrevReserves:     resp.PublicInputs.PrevReserves,
//	    },
//	    SerializedTree: resp.SerializedTree,
//	}, nil
func (c *ProverClient) Prove(
	ctx context.Context,
	reserves []entity.Reserve,
	liabilities []usecase.Liability,
	prevReserves string,
) (usecase.ProveResult, error) {
	_ = ctx
	_ = reserves
	_ = liabilities
	_ = prevReserves
	_ = treeDepth
	return usecase.ProveResult{}, errStubsNotGenerated
}

// Ensure ProverClient satisfies the usecase port.
var _ usecase.ProverClient = (*ProverClient)(nil)
