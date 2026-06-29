package stellar

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/stellar/go/keypair"
	"github.com/stellar/go/network"
	protocol "github.com/stellar/go/protocols/rpc"
	"github.com/stellar/go/strkey"
	"github.com/stellar/go/txnbuild"
	"github.com/stellar/go/xdr"

	"github.com/jes-labs/solva/services/orchestrator/internal/entity"
)

// fakeRPC is a scripted Soroban RPC used to drive the publisher without a live
// network. Each method either returns its canned response or, when a hook is
// set, defers to the hook so a test can fail a call on demand.
type fakeRPC struct {
	account txnbuild.Account

	simulate     protocol.SimulateTransactionResponse
	send         protocol.SendTransactionResponse
	get          protocol.GetTransactionResponse
	simulateErr  error
	sendHook     func(call int) (protocol.SendTransactionResponse, error)
	getHook      func(call int) (protocol.GetTransactionResponse, error)
	loadCalls    int
	sendCalls    int
	getCalls     int
	simulateCall int
}

func (f *fakeRPC) LoadAccount(_ context.Context, _ string) (txnbuild.Account, error) {
	f.loadCalls++
	return f.account, nil
}

func (f *fakeRPC) SimulateTransaction(_ context.Context, _ protocol.SimulateTransactionRequest) (protocol.SimulateTransactionResponse, error) {
	f.simulateCall++
	if f.simulateErr != nil {
		return protocol.SimulateTransactionResponse{}, f.simulateErr
	}
	return f.simulate, nil
}

func (f *fakeRPC) SendTransaction(_ context.Context, _ protocol.SendTransactionRequest) (protocol.SendTransactionResponse, error) {
	f.sendCalls++
	if f.sendHook != nil {
		return f.sendHook(f.sendCalls)
	}
	return f.send, nil
}

func (f *fakeRPC) GetTransaction(_ context.Context, _ protocol.GetTransactionRequest) (protocol.GetTransactionResponse, error) {
	f.getCalls++
	if f.getHook != nil {
		return f.getHook(f.getCalls)
	}
	return f.get, nil
}

// testContractID returns a syntactically valid C... contract strkey.
func testContractID(t *testing.T) string {
	t.Helper()
	id, err := strkey.Encode(strkey.VersionByteContract, make([]byte, 32))
	if err != nil {
		t.Fatalf("encode contract id: %v", err)
	}
	return id
}

// metaWithProofID marshals a V3 result meta whose Soroban return value is the
// given u64 proof id.
func metaWithProofID(t *testing.T, id uint64) string {
	t.Helper()
	u := xdr.Uint64(id)
	meta := xdr.TransactionMeta{
		V: 3,
		V3: &xdr.TransactionMetaV3{
			SorobanMeta: &xdr.SorobanTransactionMeta{
				ReturnValue: xdr.ScVal{Type: xdr.ScValTypeScvU64, U64: &u},
			},
		},
	}
	b64, err := xdr.MarshalBase64(meta)
	if err != nil {
		t.Fatalf("marshal meta: %v", err)
	}
	return b64
}

// sorobanDataXDR marshals a minimal SorobanTransactionData for the simulation
// response.
func sorobanDataXDR(t *testing.T) string {
	t.Helper()
	b64, err := xdr.MarshalBase64(xdr.SorobanTransactionData{})
	if err != nil {
		t.Fatalf("marshal soroban data: %v", err)
	}
	return b64
}

func newTestPublisher(t *testing.T, rpc sorobanRPC) *Publisher {
	t.Helper()
	signer, err := keypair.Random()
	if err != nil {
		t.Fatalf("random keypair: %v", err)
	}
	return &Publisher{
		cfg: Config{
			NetworkPassphrase: network.TestNetworkPassphrase,
		},
		signer:       signer,
		rpc:          rpc,
		maxAttempts:  4,
		baseBackoff:  time.Millisecond,
		pollInterval: time.Millisecond,
		pollTimeout:  time.Second,
	}
}

// sampleTarget is the tenant contract the publish is aimed at in tests.
func sampleTarget(t *testing.T) entity.TenantContract {
	return entity.TenantContract{ContractID: testContractID(t), Network: "testnet"}
}

func samplePublicInputs() entity.PublicInputs {
	return entity.PublicInputs{
		ReservesTotal:    "1000000",
		LiabilitiesTotal: "950000",
		PrevReserves:     "900000",
		RootHash:         strings.Repeat("ab", 32),
	}
}

func successFake(t *testing.T, proofID uint64) *fakeRPC {
	t.Helper()
	return &fakeRPC{
		account:  &txnbuild.SimpleAccount{AccountID: "", Sequence: 100},
		simulate: protocol.SimulateTransactionResponse{TransactionDataXDR: sorobanDataXDR(t), MinResourceFee: 12345, Results: []protocol.SimulateHostFunctionResult{{}}},
		send:     protocol.SendTransactionResponse{Status: "PENDING"},
		get:      protocol.GetTransactionResponse{TransactionDetails: protocol.TransactionDetails{Status: protocol.TransactionStatusSuccess, ResultMetaXDR: metaWithProofID(t, proofID)}},
	}
}

func TestPublishProofSuccess(t *testing.T) {
	fake := successFake(t, 7)
	// The signer address must match the loaded account so signing lines up.
	pub := newTestPublisher(t, fake)
	fake.account = &txnbuild.SimpleAccount{AccountID: pub.signer.Address(), Sequence: 100}

	id, err := pub.PublishProof(context.Background(), sampleTarget(t), []byte{0x01, 0x02}, samplePublicInputs())
	if err != nil {
		t.Fatalf("PublishProof: %v", err)
	}
	if id != 7 {
		t.Fatalf("proof id = %d, want 7", id)
	}
	if fake.simulateCall != 1 || fake.sendCalls != 1 {
		t.Fatalf("expected one simulate and one send, got simulate=%d send=%d", fake.simulateCall, fake.sendCalls)
	}
}

func TestPublishProofRetriesTransient(t *testing.T) {
	fake := successFake(t, 9)
	pub := newTestPublisher(t, fake)
	fake.account = &txnbuild.SimpleAccount{AccountID: pub.signer.Address(), Sequence: 100}

	// Fail the first submission with a network error, then succeed.
	fake.sendHook = func(call int) (protocol.SendTransactionResponse, error) {
		if call == 1 {
			return protocol.SendTransactionResponse{}, errors.New("connection reset")
		}
		return protocol.SendTransactionResponse{Status: "PENDING"}, nil
	}

	id, err := pub.PublishProof(context.Background(), sampleTarget(t), []byte{0x01}, samplePublicInputs())
	if err != nil {
		t.Fatalf("PublishProof: %v", err)
	}
	if id != 9 {
		t.Fatalf("proof id = %d, want 9", id)
	}
	if fake.sendCalls != 2 {
		t.Fatalf("expected two send attempts, got %d", fake.sendCalls)
	}
}

func TestPublishProofRetriesTryAgainLater(t *testing.T) {
	fake := successFake(t, 3)
	pub := newTestPublisher(t, fake)
	fake.account = &txnbuild.SimpleAccount{AccountID: pub.signer.Address(), Sequence: 100}

	fake.sendHook = func(call int) (protocol.SendTransactionResponse, error) {
		if call == 1 {
			return protocol.SendTransactionResponse{Status: "TRY_AGAIN_LATER"}, nil
		}
		return protocol.SendTransactionResponse{Status: "PENDING"}, nil
	}

	id, err := pub.PublishProof(context.Background(), sampleTarget(t), []byte{0x01}, samplePublicInputs())
	if err != nil {
		t.Fatalf("PublishProof: %v", err)
	}
	if id != 3 {
		t.Fatalf("proof id = %d, want 3", id)
	}
	if fake.sendCalls != 2 {
		t.Fatalf("expected two send attempts, got %d", fake.sendCalls)
	}
}

func TestPublishProofSimulationErrorIsPermanent(t *testing.T) {
	fake := successFake(t, 1)
	fake.simulate = protocol.SimulateTransactionResponse{Error: "HostError: proof invalid"}
	pub := newTestPublisher(t, fake)
	fake.account = &txnbuild.SimpleAccount{AccountID: pub.signer.Address(), Sequence: 100}

	_, err := pub.PublishProof(context.Background(), sampleTarget(t), []byte{0x01}, samplePublicInputs())
	if err == nil {
		t.Fatal("expected error on simulation rejection")
	}
	if fake.simulateCall != 1 {
		t.Fatalf("simulation error must not retry, got %d simulate calls", fake.simulateCall)
	}
	if fake.sendCalls != 0 {
		t.Fatalf("must not submit after a failed simulation, got %d send calls", fake.sendCalls)
	}
}

func TestPublishProofFailedOnChainIsPermanent(t *testing.T) {
	fake := successFake(t, 1)
	fake.get = protocol.GetTransactionResponse{TransactionDetails: protocol.TransactionDetails{Status: protocol.TransactionStatusFailed}}
	pub := newTestPublisher(t, fake)
	fake.account = &txnbuild.SimpleAccount{AccountID: pub.signer.Address(), Sequence: 100}

	_, err := pub.PublishProof(context.Background(), sampleTarget(t), []byte{0x01}, samplePublicInputs())
	if err == nil {
		t.Fatal("expected error on failed transaction")
	}
	if fake.sendCalls != 1 {
		t.Fatalf("a FAILED transaction must not be resubmitted, got %d send calls", fake.sendCalls)
	}
}

func TestPublishProofPollsUntilLanded(t *testing.T) {
	fake := successFake(t, 5)
	pub := newTestPublisher(t, fake)
	fake.account = &txnbuild.SimpleAccount{AccountID: pub.signer.Address(), Sequence: 100}

	// Two NOT_FOUND polls, then success.
	fake.getHook = func(call int) (protocol.GetTransactionResponse, error) {
		if call < 3 {
			return protocol.GetTransactionResponse{TransactionDetails: protocol.TransactionDetails{Status: protocol.TransactionStatusNotFound}}, nil
		}
		return protocol.GetTransactionResponse{TransactionDetails: protocol.TransactionDetails{Status: protocol.TransactionStatusSuccess, ResultMetaXDR: metaWithProofID(t, 5)}}, nil
	}

	id, err := pub.PublishProof(context.Background(), sampleTarget(t), []byte{0x01}, samplePublicInputs())
	if err != nil {
		t.Fatalf("PublishProof: %v", err)
	}
	if id != 5 {
		t.Fatalf("proof id = %d, want 5", id)
	}
	if fake.getCalls != 3 {
		t.Fatalf("expected three getTransaction polls, got %d", fake.getCalls)
	}
}

func TestPublishProofNotConfigured(t *testing.T) {
	p, err := NewPublisher(Config{})
	if err != nil {
		t.Fatalf("NewPublisher: %v", err)
	}
	_, err = p.PublishProof(context.Background(), sampleTarget(t), []byte{0x01}, samplePublicInputs())
	if !errors.Is(err, ErrNotConfigured) {
		t.Fatalf("err = %v, want ErrNotConfigured", err)
	}
}

func TestEncodePubInputsMapOrderAndTypes(t *testing.T) {
	val, err := encodePubInputs(samplePublicInputs())
	if err != nil {
		t.Fatalf("encodePubInputs: %v", err)
	}
	if val.Type != xdr.ScValTypeScvMap || val.Map == nil {
		t.Fatalf("expected an ScMap, got type %v", val.Type)
	}
	m := **val.Map

	wantKeys := []string{"liabilities_total", "prev_reserves", "reserves_total", "root_hash"}
	if len(m) != len(wantKeys) {
		t.Fatalf("map has %d entries, want %d", len(m), len(wantKeys))
	}
	for i, want := range wantKeys {
		if m[i].Key.Sym == nil || string(*m[i].Key.Sym) != want {
			t.Fatalf("entry %d key = %v, want %q (Soroban requires sorted symbol keys)", i, m[i].Key.Sym, want)
		}
	}

	// reserves_total = 1000000 should land in the low 64 bits.
	reserves := m[2].Val
	if reserves.Type != xdr.ScValTypeScvU128 || reserves.U128 == nil {
		t.Fatalf("reserves_total is not a u128")
	}
	if reserves.U128.Hi != 0 || reserves.U128.Lo != 1000000 {
		t.Fatalf("reserves_total = (%d,%d), want (0,1000000)", reserves.U128.Hi, reserves.U128.Lo)
	}

	root := m[3].Val
	if root.Type != xdr.ScValTypeScvBytes || root.Bytes == nil || len(*root.Bytes) != 32 {
		t.Fatalf("root_hash is not 32 bytes")
	}
}

func TestU128FromDecimal(t *testing.T) {
	// 2^64 should split cleanly across the hi/lo halves.
	parts, err := u128FromDecimal("18446744073709551616")
	if err != nil {
		t.Fatalf("u128FromDecimal: %v", err)
	}
	if parts.Hi != 1 || parts.Lo != 0 {
		t.Fatalf("2^64 = (%d,%d), want (1,0)", parts.Hi, parts.Lo)
	}

	if _, err := u128FromDecimal("-1"); err == nil {
		t.Fatal("expected error on negative value")
	}
	if _, err := u128FromDecimal("notanumber"); err == nil {
		t.Fatal("expected error on non-numeric value")
	}
	// 2^128 is one past the u128 ceiling.
	if _, err := u128FromDecimal("340282366920938463463374607431768211456"); err == nil {
		t.Fatal("expected overflow error at 2^128")
	}
}
