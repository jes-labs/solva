package grpc

import (
	"errors"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// isInsolvent must single out the prover's R < L rejection and nothing else, so
// the orchestrator can report it as an expected outcome rather than a failure.
func TestIsInsolvent(t *testing.T) {
	if !isInsolvent(status.Error(codes.InvalidArgument, "insolvent: reserves 5 < liabilities 9")) {
		t.Fatal("insolvent rejection not detected")
	}
	if isInsolvent(status.Error(codes.InvalidArgument, "at most 8 leaves supported")) {
		t.Fatal("a different InvalidArgument must not read as insolvent")
	}
	if isInsolvent(status.Error(codes.Internal, "insolvent: ...")) {
		t.Fatal("only InvalidArgument should read as insolvent")
	}
	if isInsolvent(errors.New("plain error")) {
		t.Fatal("a non-status error must not read as insolvent")
	}
}
