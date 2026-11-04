// Package banks adapts the orchestrator to Open Banking sources. It fetches
// reserve balances and verifies the ECDSA signature on each response before
// trusting it.
//
// This ECDSA verification is standard signature checking, not circuit hashing.
// It is the one place the Go tier does real cryptography. All Poseidon2 hashing
// that must match the circuit stays in the Rust prover and the Soroban contract.
package banks

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
)

// ErrBadSignature means the response signature did not verify against the
// configured public key. The reserve must be rejected, never used.
var ErrBadSignature = errors.New("banks: ECDSA signature verification failed")

// ParsePublicKey reads a PEM-encoded P-256 public key. The sandbox signs with
// the matching private key, so the two halves must agree.
func ParsePublicKey(pemBytes []byte) (*ecdsa.PublicKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("banks: no PEM block in public key")
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse PKIX public key: %w", err)
	}
	pub, ok := parsed.(*ecdsa.PublicKey)
	if !ok {
		return nil, errors.New("banks: public key is not ECDSA")
	}
	return pub, nil
}

// VerifySignature checks an ECDSA signature over the SHA-256 digest of payload.
// The signature is the ASN.1 DER encoding of (r, s), which is what
// crypto/ecdsa.SignASN1 and the sandbox produce. It returns ErrBadSignature on
// a mismatch so callers handle one clear failure.
func VerifySignature(pub *ecdsa.PublicKey, payload, sig []byte) error {
	if pub == nil {
		return errors.New("banks: nil public key")
	}
	digest := sha256.Sum256(payload)
	if !ecdsa.VerifyASN1(pub, digest[:], sig) {
		return ErrBadSignature
	}
	return nil
}
