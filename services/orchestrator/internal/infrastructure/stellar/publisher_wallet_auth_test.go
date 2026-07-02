package stellar

import (
	"bytes"
	"crypto/ed25519"
	"testing"

	"github.com/stellar/go/keypair"
	"github.com/stellar/go/network"
	"github.com/stellar/go/strkey"
	"github.com/stellar/go/xdr"
)

// signWalletAuth must produce an Ed25519 signature that verifies over the exact
// authorization payload the wallet contract re-derives, wrapped in the
// Signatures layout its __check_auth expects.
func TestSignWalletAuth(t *testing.T) {
	kp, err := keypair.Random()
	if err != nil {
		t.Fatalf("keypair: %v", err)
	}
	p := &Publisher{cfg: Config{NetworkPassphrase: network.TestNetworkPassphrase}, signer: kp}

	var contractID xdr.ContractId
	nonce := xdr.Int64(987654321)
	entry := xdr.SorobanAuthorizationEntry{
		Credentials: xdr.SorobanCredentials{
			Type: xdr.SorobanCredentialsTypeSorobanCredentialsAddress,
			Address: &xdr.SorobanAddressCredentials{
				Address: xdr.ScAddress{Type: xdr.ScAddressTypeScAddressTypeContract, ContractId: &contractID},
				Nonce:   nonce,
			},
		},
		RootInvocation: xdr.SorobanAuthorizedInvocation{
			Function: xdr.SorobanAuthorizedFunction{
				Type: xdr.SorobanAuthorizedFunctionTypeSorobanAuthorizedFunctionTypeContractFn,
				ContractFn: &xdr.InvokeContractArgs{
					ContractAddress: xdr.ScAddress{Type: xdr.ScAddressTypeScAddressTypeContract, ContractId: &contractID},
					FunctionName:    "publish_proof",
				},
			},
		},
	}

	const expiration = 5000
	if err := p.signWalletAuth(&entry, expiration); err != nil {
		t.Fatalf("signWalletAuth: %v", err)
	}

	addr := entry.Credentials.Address
	if addr.SignatureExpirationLedger != expiration {
		t.Fatalf("expiration = %d, want %d", addr.SignatureExpirationLedger, expiration)
	}

	// Recompute the payload independently, then check the produced signature.
	payload, err := authPayloadHash(network.TestNetworkPassphrase, nonce, expiration, entry.RootInvocation)
	if err != nil {
		t.Fatalf("payload: %v", err)
	}
	pubKey, sig := ed25519SignatureParts(t, addr.Signature)

	want, err := strkey.Decode(strkey.VersionByteAccountID, kp.Address())
	if err != nil {
		t.Fatalf("decode pubkey: %v", err)
	}
	if !bytes.Equal(pubKey, want) {
		t.Fatalf("signer key in Signatures does not match the signer")
	}
	if len(sig) != ed25519.SignatureSize {
		t.Fatalf("signature length = %d, want %d", len(sig), ed25519.SignatureSize)
	}
	if !ed25519.Verify(pubKey, payload, sig) {
		t.Fatalf("signature does not verify over the authorization payload")
	}
}

// ed25519SignatureParts pulls the signer key and signature bytes out of the
// Signatures ScVal: Vec[Map{ Vec[Sym,Bytes] -> Vec[Sym,Bytes] }].
func ed25519SignatureParts(t *testing.T, v xdr.ScVal) (pubKey, sig []byte) {
	t.Helper()
	outer, ok := asVec(v)
	if !ok || len(outer) != 1 {
		t.Fatalf("Signatures is not a single-element vec")
	}
	m, ok := asMap(outer[0])
	if !ok || len(m) != 1 {
		t.Fatalf("Signatures does not wrap a single-entry map")
	}
	return ed25519Variant(t, m[0].Key), ed25519Variant(t, m[0].Val)
}

func ed25519Variant(t *testing.T, v xdr.ScVal) []byte {
	t.Helper()
	vec, ok := asVec(v)
	if !ok || len(vec) != 2 {
		t.Fatalf("variant is not a [symbol, bytes] vec")
	}
	if sym, ok := asSym(vec[0]); !ok || sym != "Ed25519" {
		t.Fatalf("variant symbol = %q, want Ed25519", sym)
	}
	b, ok := asBytes(vec[1])
	if !ok {
		t.Fatalf("variant value is not bytes")
	}
	return b
}

func asVec(v xdr.ScVal) (xdr.ScVec, bool) {
	if v.Type != xdr.ScValTypeScvVec || v.Vec == nil || *v.Vec == nil {
		return nil, false
	}
	return **v.Vec, true
}

func asMap(v xdr.ScVal) (xdr.ScMap, bool) {
	if v.Type != xdr.ScValTypeScvMap || v.Map == nil || *v.Map == nil {
		return nil, false
	}
	return **v.Map, true
}

func asSym(v xdr.ScVal) (string, bool) {
	if v.Type != xdr.ScValTypeScvSymbol || v.Sym == nil {
		return "", false
	}
	return string(*v.Sym), true
}

func asBytes(v xdr.ScVal) ([]byte, bool) {
	if v.Type != xdr.ScValTypeScvBytes || v.Bytes == nil {
		return nil, false
	}
	return []byte(*v.Bytes), true
}
