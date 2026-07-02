import { Buffer } from "buffer";
import { xdr } from "@stellar/stellar-sdk";

// The signature layout the passkey-kit smart-wallet __check_auth deserializes:
//
//   Signatures: Map<SignerKey, Signature>
//     SignerKey::Secp256r1(Bytes)  -- the credential id
//     Signature::Secp256r1(Secp256r1Signature)
//       { authenticator_data, client_data_json, signature }
//
// Soroban encodes enum variants as Vec[Symbol, value] and structs as Maps with
// symbol keys in lexicographic order. Byte layout confirmed against the Rust SDK.
export interface WebAuthnSignatureParts {
  credentialId: Uint8Array;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  // Compact 64-byte low-S signature.
  signature: Uint8Array;
}

export function passkeyKitSignatureScVal(parts: WebAuthnSignatureParts): xdr.ScVal {
  const signerKey = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Secp256r1"),
    xdr.ScVal.scvBytes(Buffer.from(parts.credentialId)),
  ]);

  const signatureStruct = xdr.ScVal.scvMap([
    mapEntry("authenticator_data", parts.authenticatorData),
    mapEntry("client_data_json", parts.clientDataJSON),
    mapEntry("signature", parts.signature),
  ]);
  const signature = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Secp256r1"),
    signatureStruct,
  ]);

  // Signatures is a one-field tuple struct, which Soroban encodes as a Vec of
  // its fields, so the map rides inside a Vec.
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvMap([new xdr.ScMapEntry({ key: signerKey, val: signature })]),
  ]);
}

// Apply an encoded signature to the entry's address credentials, in place.
export function attachSignatureToEntry(
  entry: xdr.SorobanAuthorizationEntry,
  signature: xdr.ScVal,
): void {
  entry.credentials().address().signature(signature);
}

function mapEntry(symbol: string, bytes: Uint8Array): xdr.ScMapEntry {
  return new xdr.ScMapEntry({
    key: xdr.ScVal.scvSymbol(symbol),
    val: xdr.ScVal.scvBytes(Buffer.from(bytes)),
  });
}
