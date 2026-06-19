// Package stellar publishes verified proofs to the Soroban proof-registry
// contract. It implements usecase.StellarPublisher using the Stellar Go SDK.
package stellar

import (
	"context"
	"errors"
	"fmt"

	"github.com/stellar/go/keypair"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// errNotImplemented marks the contract invoke path that is still pending.
var errNotImplemented = errors.New("stellar: publish_proof invoke not implemented")

// Config holds what the publisher needs to reach Soroban and sign as the proof
// owner.
type Config struct {
	// RPCURL is the Soroban RPC endpoint.
	RPCURL string
	// ContractID is the deployed proof-registry contract address.
	ContractID string
	// NetworkPassphrase selects testnet or mainnet.
	NetworkPassphrase string
	// SignerSecret is the publisher key. In production this comes from KMS,
	// never a checked-in secret.
	SignerSecret string
}

// Publisher invokes publish_proof on the proof-registry contract.
type Publisher struct {
	cfg    Config
	signer *keypair.Full
}

// NewPublisher builds a publisher from config. It parses the signer secret so
// a bad key fails at startup, not on the first cycle.
func NewPublisher(cfg Config) (*Publisher, error) {
	if cfg.SignerSecret == "" {
		// Allow boot without a signer for local skeleton runs. PublishProof
		// will return errNotImplemented until the invoke path and signer land.
		return &Publisher{cfg: cfg}, nil
	}
	kp, err := keypair.ParseFull(cfg.SignerSecret)
	if err != nil {
		return nil, fmt.Errorf("parse signer secret: %w", err)
	}
	return &Publisher{cfg: cfg, signer: kp}, nil
}

// PublishProof submits the proof and public inputs to the contract and returns
// the monotonic on-chain proof id.
//
// TODO: build the Soroban InvokeHostFunction operation for publish_proof:
//  1. encode proof bytes and PubInputs (R, L, root_h, R_prev) as ScVal args,
//  2. simulate against the RPC to get the footprint and resource fee,
//  3. assemble, sign with the owner keypair (passkey smart-wallet account),
//  4. submit and poll for success,
//  5. read the returned u64 id from the contract result.
func (p *Publisher) PublishProof(ctx context.Context, proof []byte, pub entity.PublicInputs) (uint64, error) {
	_ = ctx
	_ = proof
	_ = pub
	return 0, errNotImplemented
}

// Ensure Publisher satisfies the usecase port.
var _ usecase.StellarPublisher = (*Publisher)(nil)
