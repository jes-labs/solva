//go:build integration

// Integration test that drives the real publisher against Stellar Testnet.
//
// It is excluded from the normal `go test` run by the integration build tag and
// skips unless the signer secret is provided. Run it with:
//
//	ORCH_STELLAR_SIGNER_SECRET=$(stellar keys show solva-spike) \
//	  go test -tags integration -run TestPublishProofTestnet -v \
//	  ./internal/infrastructure/stellar/...
//
// It publishes the bundled solvency sample proof to the deployed proof-registry
// and asserts the contract returns a monotonic id, exercising the full
// simulate/sign/submit/poll path over the live network.
package stellar

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/stellar/go/network"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

const (
	testnetContractID = "CAYWB2IMDG753S3YF7DKVNLD7WBROYSP3JP5HEJET77W53UBWRD7ZX3Z"
	// The public inputs the bundled sample proof commits to (R = 400, L = 360,
	// R_prev = 400, and the Poseidon2 sum-tree root for the sample leaves).
	sampleRootHash = "0e36888d7cade7e79309cd7e58109611104c225f2fcd5a158c662debb173572f"
)

func TestPublishProofTestnet(t *testing.T) {
	secret := os.Getenv("ORCH_STELLAR_SIGNER_SECRET")
	if secret == "" {
		t.Skip("set ORCH_STELLAR_SIGNER_SECRET (owner: solva-spike) to run the testnet integration test")
	}

	contractID := os.Getenv("ORCH_STELLAR_CONTRACT_ID")
	if contractID == "" {
		contractID = testnetContractID
	}
	rpcURL := os.Getenv("ORCH_STELLAR_RPC_URL")
	if rpcURL == "" {
		rpcURL = "https://soroban-testnet.stellar.org"
	}

	pub, err := NewPublisher(Config{
		RPCURL:            rpcURL,
		NetworkPassphrase: network.TestNetworkPassphrase,
		SignerSecret:      secret,
	})
	if err != nil {
		t.Fatalf("NewPublisher: %v", err)
	}

	proof := readSampleProof(t)

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	target := entity.TenantContract{ContractID: contractID, Network: "testnet"}
	id, err := pub.PublishProof(ctx, target, proof, entity.PublicInputs{
		ReservesTotal:    "400",
		LiabilitiesTotal: "360",
		PrevReserves:     "400",
		RootHash:         sampleRootHash,
	})
	if err != nil {
		t.Fatalf("PublishProof on testnet: %v", err)
	}
	if id < 1 {
		t.Fatalf("returned proof id = %d, want >= 1", id)
	}
	t.Logf("published sample proof to %s, on-chain proof id = %d", contractID, id)
}

// readSampleProof loads the bundled UltraHonk sample proof, resolving its path
// relative to this source file so the test works from any working directory.
func readSampleProof(t *testing.T) []byte {
	t.Helper()
	if p := os.Getenv("ORCH_STELLAR_TEST_PROOF_PATH"); p != "" {
		b, err := os.ReadFile(p)
		if err != nil {
			t.Fatalf("read proof from ORCH_STELLAR_TEST_PROOF_PATH: %v", err)
		}
		return b
	}
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot resolve test source path")
	}
	// services/orchestrator/internal/infrastructure/stellar -> repo root is five up.
	repoRoot := filepath.Join(filepath.Dir(thisFile), "..", "..", "..", "..", "..")
	path := filepath.Join(repoRoot, "contracts", "proof-registry", "src", "testdata", "solvency_proof.bin")
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read sample proof at %s: %v", path, err)
	}
	return b
}
