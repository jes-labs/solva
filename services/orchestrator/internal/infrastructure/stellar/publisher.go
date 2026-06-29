// Package stellar publishes verified proofs to the Soroban proof-registry
// contract. It implements usecase.StellarPublisher using the Stellar Go SDK.
package stellar

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	rpcclient "github.com/stellar/go/clients/rpcclient"
	"github.com/stellar/go/keypair"
	protocol "github.com/stellar/go/protocols/rpc"
	"github.com/stellar/go/strkey"
	"github.com/stellar/go/txnbuild"
	"github.com/stellar/go/xdr"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
	"github.com/jes-labs/solva/services/orchestrator/internal/usecase"
)

// contractFunction is the entry point invoked on the proof-registry contract.
const contractFunction = "publish_proof"

// Defaults for submission retry and result polling. They mirror the bank
// adapter's transient-failure handling so the orchestrator behaves the same way
// across its outbound integrations.
const (
	defaultMaxAttempts  = 4
	defaultBaseBackoff  = 500 * time.Millisecond
	defaultPollInterval = 1 * time.Second
	defaultPollTimeout  = 60 * time.Second
	defaultHTTPTimeout  = 30 * time.Second
	// txTimeoutSeconds bounds how long a submitted transaction stays valid. It
	// must comfortably exceed the poll timeout so a slow ledger close does not
	// invalidate a transaction we are still waiting on.
	txTimeoutSeconds = 120
	// baseFee is the inclusion fee per operation, in stroops. The far larger
	// Soroban resource fee comes from simulation; this only covers the classic
	// ledger inclusion cost, set above the network minimum for headroom.
	baseFee = 1000
)

var (
	// ErrNotConfigured means the publisher cannot invoke the contract: it has no
	// signer or RPC client, or the target contract id is empty.
	ErrNotConfigured = errors.New("stellar: publisher not configured (missing signer, rpc, or target contract id)")
	// ErrUnexpectedReturn means the contract result was not the u64 proof id the
	// registry is documented to return.
	ErrUnexpectedReturn = errors.New("stellar: publish_proof did not return a u64 proof id")
)

// transientError marks an RPC failure worth retrying (network blips, RPC 5xx).
// Application-level failures, such as an invalid proof or an insolvent bound,
// are permanent and never wrapped in it.
type transientError struct{ err error }

func (e transientError) Error() string { return e.err.Error() }
func (e transientError) Unwrap() error { return e.err }

// sorobanRPC is the slice of the Stellar RPC client the publisher uses. Defining
// it as an interface lets the tests inject a fake without a live network.
type sorobanRPC interface {
	LoadAccount(ctx context.Context, address string) (txnbuild.Account, error)
	SimulateTransaction(ctx context.Context, req protocol.SimulateTransactionRequest) (protocol.SimulateTransactionResponse, error)
	SendTransaction(ctx context.Context, req protocol.SendTransactionRequest) (protocol.SendTransactionResponse, error)
	GetTransaction(ctx context.Context, req protocol.GetTransactionRequest) (protocol.GetTransactionResponse, error)
}

// Config holds what the publisher needs to reach Soroban and sign as the proof
// owner. The target contract is not here: it is per tenant and passed to
// PublishProof on each call.
type Config struct {
	// RPCURL is the Soroban RPC endpoint.
	RPCURL string
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
	rpc    sorobanRPC

	maxAttempts  int
	baseBackoff  time.Duration
	pollInterval time.Duration
	pollTimeout  time.Duration
}

// NewPublisher builds a publisher from config. It parses the signer secret so a
// bad key fails at startup, not on the first cycle. A publisher built without a
// signer or RPC URL still constructs (so local skeleton runs can boot) but
// PublishProof then returns ErrNotConfigured.
func NewPublisher(cfg Config) (*Publisher, error) {
	p := &Publisher{
		cfg:          cfg,
		maxAttempts:  defaultMaxAttempts,
		baseBackoff:  defaultBaseBackoff,
		pollInterval: defaultPollInterval,
		pollTimeout:  defaultPollTimeout,
	}

	if cfg.SignerSecret != "" {
		kp, err := keypair.ParseFull(cfg.SignerSecret)
		if err != nil {
			return nil, fmt.Errorf("parse signer secret: %w", err)
		}
		p.signer = kp
	}

	if cfg.RPCURL != "" {
		p.rpc = rpcclient.NewClient(cfg.RPCURL, &http.Client{Timeout: defaultHTTPTimeout})
	}

	return p, nil
}

// PublishProof submits the proof and public inputs to the contract and returns
// the monotonic on-chain proof id.
//
// The flow follows the standard Soroban invoke path: encode the arguments,
// simulate to learn the footprint, resource fee, and required authorization,
// then assemble, sign as the owner, submit, and poll for the result. Transient
// network failures are retried with exponential backoff; an invalid proof or an
// insolvent bound is a permanent failure and is returned immediately.
func (p *Publisher) PublishProof(ctx context.Context, target entity.TenantContract, proof []byte, pub entity.PublicInputs) (uint64, error) {
	// The signer (current global owner) and RPC are publisher-wide; the contract
	// is per tenant. Per-tenant owner signing via the passkey smart wallet is #128.
	if p.signer == nil || p.rpc == nil || target.ContractID == "" {
		return 0, ErrNotConfigured
	}

	args, err := encodeArgs(proof, pub)
	if err != nil {
		return 0, fmt.Errorf("encode contract args: %w", err)
	}

	contractAddr, err := contractAddress(target.ContractID)
	if err != nil {
		return 0, fmt.Errorf("decode contract id: %w", err)
	}

	hostFn := xdr.HostFunction{
		Type: xdr.HostFunctionTypeHostFunctionTypeInvokeContract,
		InvokeContract: &xdr.InvokeContractArgs{
			ContractAddress: contractAddr,
			FunctionName:    contractFunction,
			Args:            args,
		},
	}

	id, err := p.invokeWithRetry(ctx, hostFn)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// invokeWithRetry runs the full simulate/submit/poll cycle, retrying only on
// transient errors. Each attempt reloads the account sequence and re-simulates,
// since a retry may follow a partially advanced ledger state.
func (p *Publisher) invokeWithRetry(ctx context.Context, hostFn xdr.HostFunction) (uint64, error) {
	backoff := p.baseBackoff
	var lastErr error
	for attempt := 1; attempt <= p.maxAttempts; attempt++ {
		id, err := p.invokeOnce(ctx, hostFn)
		if err == nil {
			return id, nil
		}

		var transient transientError
		if !errors.As(err, &transient) {
			// Permanent failure (bad proof, insolvent, malformed result): stop.
			return 0, err
		}
		lastErr = err

		if attempt == p.maxAttempts {
			break
		}
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(backoff):
		}
		backoff *= 2
	}
	return 0, fmt.Errorf("publish_proof after %d attempts: %w", p.maxAttempts, lastErr)
}

// invokeOnce performs one simulate, assemble, sign, submit, and poll cycle.
func (p *Publisher) invokeOnce(ctx context.Context, hostFn xdr.HostFunction) (uint64, error) {
	account, err := p.rpc.LoadAccount(ctx, p.signer.Address())
	if err != nil {
		return 0, transientError{fmt.Errorf("load account: %w", err)}
	}
	seq, err := account.GetSequenceNumber()
	if err != nil {
		return 0, fmt.Errorf("read account sequence: %w", err)
	}

	op := &txnbuild.InvokeHostFunction{
		HostFunction:  hostFn,
		SourceAccount: p.signer.Address(),
	}

	// Build an unsigned transaction purely to drive simulation.
	simTx, err := txnbuild.NewTransaction(txnbuild.TransactionParams{
		SourceAccount:        &txnbuild.SimpleAccount{AccountID: p.signer.Address(), Sequence: seq},
		IncrementSequenceNum: true,
		Operations:           []txnbuild.Operation{op},
		BaseFee:              baseFee,
		Preconditions:        txnbuild.Preconditions{TimeBounds: txnbuild.NewTimeout(txTimeoutSeconds)},
	})
	if err != nil {
		return 0, fmt.Errorf("build simulation transaction: %w", err)
	}
	simXDR, err := simTx.Base64()
	if err != nil {
		return 0, fmt.Errorf("encode simulation transaction: %w", err)
	}

	sim, err := p.rpc.SimulateTransaction(ctx, protocol.SimulateTransactionRequest{Transaction: simXDR})
	if err != nil {
		return 0, transientError{fmt.Errorf("simulate: %w", err)}
	}
	if sim.Error != "" {
		// A simulation error reflects the contract rejecting the call (invalid
		// proof, insolvent bound, ...). Retrying cannot help.
		return 0, fmt.Errorf("simulation rejected publish_proof: %s", sim.Error)
	}
	if sim.RestorePreamble != nil {
		return 0, fmt.Errorf("publish_proof requires restoring archived ledger entries before submission")
	}
	if len(sim.Results) == 0 {
		return 0, fmt.Errorf("simulation returned no results")
	}

	if err := applySimulation(op, sim); err != nil {
		return 0, fmt.Errorf("apply simulation: %w", err)
	}

	// Re-assemble with the simulation footprint, resource fee, and auth, then
	// sign as the owner. The fresh account starts at the same sequence so the
	// signed transaction carries seq+1, exactly as simulated.
	tx, err := txnbuild.NewTransaction(txnbuild.TransactionParams{
		SourceAccount:        &txnbuild.SimpleAccount{AccountID: p.signer.Address(), Sequence: seq},
		IncrementSequenceNum: true,
		Operations:           []txnbuild.Operation{op},
		BaseFee:              baseFee,
		Preconditions:        txnbuild.Preconditions{TimeBounds: txnbuild.NewTimeout(txTimeoutSeconds)},
	})
	if err != nil {
		return 0, fmt.Errorf("assemble transaction: %w", err)
	}
	tx, err = tx.Sign(p.cfg.NetworkPassphrase, p.signer)
	if err != nil {
		return 0, fmt.Errorf("sign transaction: %w", err)
	}
	txXDR, err := tx.Base64()
	if err != nil {
		return 0, fmt.Errorf("encode transaction: %w", err)
	}
	hash, err := tx.HashHex(p.cfg.NetworkPassphrase)
	if err != nil {
		return 0, fmt.Errorf("hash transaction: %w", err)
	}

	send, err := p.rpc.SendTransaction(ctx, protocol.SendTransactionRequest{Transaction: txXDR})
	if err != nil {
		return 0, transientError{fmt.Errorf("send transaction: %w", err)}
	}
	switch send.Status {
	case "PENDING":
		// Accepted into the mempool; fall through to polling.
	case "TRY_AGAIN_LATER":
		return 0, transientError{fmt.Errorf("rpc asked to retry submission later")}
	case "DUPLICATE":
		// Already submitted (likely a retry of a transaction that landed). The
		// hash is stable, so poll for its result rather than failing.
	case "ERROR":
		return 0, fmt.Errorf("transaction rejected on submission: %s", decodeError(send.ErrorResultXDR))
	default:
		return 0, fmt.Errorf("unexpected submission status %q", send.Status)
	}

	return p.pollResult(ctx, hash)
}

// pollResult waits for the submitted transaction to land and returns the proof
// id the contract emitted. A NOT_FOUND result means the ledger has not closed
// yet, so it keeps polling until pollTimeout.
func (p *Publisher) pollResult(ctx context.Context, hash string) (uint64, error) {
	deadline := time.Now().Add(p.pollTimeout)
	for {
		got, err := p.rpc.GetTransaction(ctx, protocol.GetTransactionRequest{Hash: hash})
		if err != nil {
			return 0, transientError{fmt.Errorf("get transaction: %w", err)}
		}

		switch got.Status {
		case protocol.TransactionStatusSuccess:
			return parseReturnValue(got.ResultMetaXDR)
		case protocol.TransactionStatusFailed:
			return 0, fmt.Errorf("transaction %s failed on-chain: %s", hash, decodeError(got.ResultXDR))
		case protocol.TransactionStatusNotFound:
			// Not yet in a ledger; keep waiting.
		default:
			return 0, fmt.Errorf("unexpected transaction status %q for %s", got.Status, hash)
		}

		if time.Now().After(deadline) {
			return 0, transientError{fmt.Errorf("timed out after %s waiting for transaction %s", p.pollTimeout, hash)}
		}
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(p.pollInterval):
		}
	}
}

// applySimulation copies the footprint, resource fee, and authorization entries
// returned by simulation onto the operation so the assembled transaction has the
// resources the host requires.
func applySimulation(op *txnbuild.InvokeHostFunction, sim protocol.SimulateTransactionResponse) error {
	var sorobanData xdr.SorobanTransactionData
	if err := xdr.SafeUnmarshalBase64(sim.TransactionDataXDR, &sorobanData); err != nil {
		return fmt.Errorf("decode transaction data: %w", err)
	}
	// The resource fee from simulation is authoritative; use it directly.
	sorobanData.ResourceFee = xdr.Int64(sim.MinResourceFee)
	op.Ext = xdr.TransactionExt{V: 1, SorobanData: &sorobanData}

	// Attach the authorization entries simulation determined are required. For
	// a source-account credential these are satisfied by the transaction
	// signature; the registry owner authorizes the call this way.
	if auth := sim.Results[0].AuthXDR; auth != nil {
		entries := make([]xdr.SorobanAuthorizationEntry, 0, len(*auth))
		for _, raw := range *auth {
			var entry xdr.SorobanAuthorizationEntry
			if err := xdr.SafeUnmarshalBase64(raw, &entry); err != nil {
				return fmt.Errorf("decode auth entry: %w", err)
			}
			entries = append(entries, entry)
		}
		op.Auth = entries
	}
	return nil
}

// encodeArgs builds the ScVal argument list for publish_proof: the raw proof
// bytes followed by the PubInputs struct.
func encodeArgs(proof []byte, pub entity.PublicInputs) (xdr.ScVec, error) {
	proofBytes := xdr.ScBytes(proof)
	pubInputs, err := encodePubInputs(pub)
	if err != nil {
		return nil, err
	}
	return xdr.ScVec{
		{Type: xdr.ScValTypeScvBytes, Bytes: &proofBytes},
		pubInputs,
	}, nil
}

// encodePubInputs serializes entity.PublicInputs into the ScMap the contract's
// PubInputs #[contracttype] expects. Soroban requires struct maps keyed by
// symbol in lexicographic order: liabilities_total, prev_reserves,
// reserves_total, root_hash.
func encodePubInputs(pub entity.PublicInputs) (xdr.ScVal, error) {
	liabilities, err := u128FromDecimal(pub.LiabilitiesTotal)
	if err != nil {
		return xdr.ScVal{}, fmt.Errorf("liabilities_total: %w", err)
	}
	prev, err := u128FromDecimal(pub.PrevReserves)
	if err != nil {
		return xdr.ScVal{}, fmt.Errorf("prev_reserves: %w", err)
	}
	reserves, err := u128FromDecimal(pub.ReservesTotal)
	if err != nil {
		return xdr.ScVal{}, fmt.Errorf("reserves_total: %w", err)
	}
	root, err := bytes32FromHex(pub.RootHash)
	if err != nil {
		return xdr.ScVal{}, fmt.Errorf("root_hash: %w", err)
	}

	m := &xdr.ScMap{
		{Key: symbolVal("liabilities_total"), Val: u128Val(liabilities)},
		{Key: symbolVal("prev_reserves"), Val: u128Val(prev)},
		{Key: symbolVal("reserves_total"), Val: u128Val(reserves)},
		{Key: symbolVal("root_hash"), Val: bytesVal(root)},
	}
	return xdr.ScVal{Type: xdr.ScValTypeScvMap, Map: &m}, nil
}

// parseReturnValue extracts the u64 proof id from the transaction result meta,
// handling both the V3 and V4 Soroban meta layouts.
func parseReturnValue(metaXDR string) (uint64, error) {
	var meta xdr.TransactionMeta
	if err := xdr.SafeUnmarshalBase64(metaXDR, &meta); err != nil {
		return 0, fmt.Errorf("decode result meta: %w", err)
	}

	var ret xdr.ScVal
	switch {
	case meta.V3 != nil && meta.V3.SorobanMeta != nil:
		ret = meta.V3.SorobanMeta.ReturnValue
	case meta.V4 != nil && meta.V4.SorobanMeta != nil && meta.V4.SorobanMeta.ReturnValue != nil:
		ret = *meta.V4.SorobanMeta.ReturnValue
	default:
		return 0, ErrUnexpectedReturn
	}

	if ret.Type != xdr.ScValTypeScvU64 || ret.U64 == nil {
		return 0, ErrUnexpectedReturn
	}
	return uint64(*ret.U64), nil
}

// contractAddress decodes a C... contract strkey into an ScAddress.
func contractAddress(contractID string) (xdr.ScAddress, error) {
	decoded, err := strkey.Decode(strkey.VersionByteContract, contractID)
	if err != nil {
		return xdr.ScAddress{}, err
	}
	var id xdr.ContractId
	copy(id[:], decoded)
	return xdr.ScAddress{Type: xdr.ScAddressTypeScAddressTypeContract, ContractId: &id}, nil
}

// u128FromDecimal parses a non-negative decimal string of integer minor units
// into the high/low 64-bit halves Soroban uses for a u128.
func u128FromDecimal(s string) (xdr.UInt128Parts, error) {
	v, ok := new(big.Int).SetString(s, 10)
	if !ok {
		return xdr.UInt128Parts{}, fmt.Errorf("%q is not a base-10 integer", s)
	}
	if v.Sign() < 0 {
		return xdr.UInt128Parts{}, fmt.Errorf("%q is negative", s)
	}
	if v.BitLen() > 128 {
		return xdr.UInt128Parts{}, fmt.Errorf("%q exceeds u128", s)
	}
	lo := new(big.Int).And(v, big.NewInt(0).SetUint64(^uint64(0)))
	hi := new(big.Int).Rsh(v, 64)
	return xdr.UInt128Parts{Hi: xdr.Uint64(hi.Uint64()), Lo: xdr.Uint64(lo.Uint64())}, nil
}

// bytes32FromHex decodes a 32-byte hex string (with or without a 0x prefix).
func bytes32FromHex(s string) ([]byte, error) {
	b, err := hex.DecodeString(strings.TrimPrefix(s, "0x"))
	if err != nil {
		return nil, err
	}
	if len(b) != 32 {
		return nil, fmt.Errorf("expected 32 bytes, got %d", len(b))
	}
	return b, nil
}

func symbolVal(s string) xdr.ScVal {
	sym := xdr.ScSymbol(s)
	return xdr.ScVal{Type: xdr.ScValTypeScvSymbol, Sym: &sym}
}

func u128Val(parts xdr.UInt128Parts) xdr.ScVal {
	return xdr.ScVal{Type: xdr.ScValTypeScvU128, U128: &parts}
}

func bytesVal(b []byte) xdr.ScVal {
	sb := xdr.ScBytes(b)
	return xdr.ScVal{Type: xdr.ScValTypeScvBytes, Bytes: &sb}
}

// decodeError renders a base64 TransactionResult XDR into a short string for
// error messages, falling back to the raw value when it cannot be decoded.
func decodeError(resultXDR string) string {
	if resultXDR == "" {
		return "no result detail"
	}
	var result xdr.TransactionResult
	if err := xdr.SafeUnmarshalBase64(resultXDR, &result); err != nil {
		return resultXDR
	}
	return result.Result.Code.String()
}

// Ensure Publisher satisfies the usecase port.
var _ usecase.StellarPublisher = (*Publisher)(nil)
