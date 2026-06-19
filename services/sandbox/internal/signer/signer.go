// Package signer produces ECDSA signatures over bank balance payloads. The
// orchestrator verifies them with the matching public key. The scheme is fixed:
// P-256, SHA-256 over the canonical JSON payload, ASN.1 DER signature. It must
// stay in lockstep with the orchestrator's banks.VerifySignature.
package signer

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
)

// Signer holds the P-256 private key used to sign balance payloads.
type Signer struct {
	priv *ecdsa.PrivateKey
}

// New generates a fresh P-256 key. Use this for local demos where a stable key
// is not needed across restarts.
func New() (*Signer, error) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("generate P-256 key: %w", err)
	}
	return &Signer{priv: priv}, nil
}

// FromPEM loads a signer from a PEM-encoded PKCS#8 or SEC1 private key. Use this
// to pin the key so the orchestrator's configured public key keeps matching.
func FromPEM(pemBytes []byte) (*Signer, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("signer: no PEM block in private key")
	}

	if key, err := x509.ParseECPrivateKey(block.Bytes); err == nil {
		return &Signer{priv: key}, nil
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}
	priv, ok := parsed.(*ecdsa.PrivateKey)
	if !ok {
		return nil, errors.New("signer: private key is not ECDSA")
	}
	return &Signer{priv: priv}, nil
}

// Sign returns the ASN.1 DER ECDSA signature over the SHA-256 digest of payload.
func (s *Signer) Sign(payload []byte) ([]byte, error) {
	digest := sha256.Sum256(payload)
	sig, err := ecdsa.SignASN1(rand.Reader, s.priv, digest[:])
	if err != nil {
		return nil, fmt.Errorf("sign payload: %w", err)
	}
	return sig, nil
}

// PublicKeyPEM returns the PEM-encoded PKIX public key. Configure the
// orchestrator with this exact value so verification succeeds.
func (s *Signer) PublicKeyPEM() ([]byte, error) {
	der, err := x509.MarshalPKIXPublicKey(&s.priv.PublicKey)
	if err != nil {
		return nil, fmt.Errorf("marshal public key: %w", err)
	}
	return pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der}), nil
}
