// export_test.go exposes package-private functions to the grpc_test package.
// This file is only compiled during testing.
package grpc

import (
	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/infrastructure/grpc/proverpb"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// BuildRequestForTest exposes buildRequest for white-box unit tests.
func BuildRequestForTest(
	reserves []entity.Reserve,
	liabilities []usecase.Liability,
	prevReserves string,
) *proverpb.ProveRequest {
	return buildRequest(reserves, liabilities, prevReserves)
}

// ZeroizeRequestForTest exposes zeroizeRequest for white-box unit tests.
func ZeroizeRequestForTest(req *proverpb.ProveRequest) {
	zeroizeRequest(req)
}
