import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2";
import { concatBytes } from "@noble/hashes/utils";
import { toBase64Url } from "./bytes";
import { publicKeyFromAuthenticatorData, publicKeyFromSpki } from "./public-key";

// The passkey ceremony: register a credential whose P-256 public key becomes the
// smart-wallet signer, and later assert over a challenge to authorize. Everything
// from the browser is normalized to plain bytes so the rest of the app never
// touches a live PublicKeyCredential.

// ES256 over P-256. The only algorithm the on-chain verifier supports, so the
// only one we request.
const ES256 = -7;
const DEFAULT_TIMEOUT_MS = 60_000;
// Registration does not feed a security check here (the wallet trusts the public
// key, not the attestation), so a fixed challenge is fine.
const REGISTRATION_CHALLENGE = new TextEncoder().encode("solva-passkey-registration");

export interface CreatePasskeyInput {
  rp: { name: string; id?: string };
  user: { id: Uint8Array; name: string; displayName?: string };
  timeoutMs?: number;
}

export interface SignWithPasskeyInput {
  // The payload the contract will verify, passed as the WebAuthn challenge.
  challenge: Uint8Array;
  rpId?: string;
  // Credential ids to allow, for non-discoverable sign-in.
  allowCredentials?: readonly Uint8Array[];
  timeoutMs?: number;
}

export interface CreatePasskeyResult {
  credentialId: Uint8Array;
  credentialIdBase64Url: string;
  // The 65-byte uncompressed P-256 point used as the smart-wallet signer.
  publicKey: Uint8Array;
  residentKey?: boolean;
}

export interface SignWithPasskeyResult {
  credentialId: Uint8Array;
  credentialIdBase64Url: string;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  // Compact 64-byte low-S signature, ready for the smart-wallet contract.
  signature: Uint8Array;
  // The digest the authenticator signed; what the contract re-derives.
  signedDigest: Uint8Array;
}

// The DOM WebAuthn types want an ArrayBuffer-backed view; copy into a fresh
// buffer at the boundary so the option object is detached from caller bytes.
function toBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy;
}

// Run the registration ceremony and pull out the signer key. The browser returns
// the public key either as a DER SPKI blob (getPublicKey) or inside the
// authenticator data; we accept whichever is present.
export async function createPasskey(input: CreatePasskeyInput): Promise<CreatePasskeyResult> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: input.rp.id ? { id: input.rp.id, name: input.rp.name } : { name: input.rp.name },
      user: {
        id: toBufferSource(input.user.id),
        name: input.user.name,
        displayName: input.user.displayName ?? input.user.name,
      },
      challenge: toBufferSource(REGISTRATION_CHALLENGE),
      pubKeyCredParams: [{ type: "public-key", alg: ES256 }],
      authenticatorSelection: {
        residentKey: "preferred",
        requireResidentKey: false,
        userVerification: "preferred",
      },
      attestation: "none",
      extensions: { credProps: true },
      timeout: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("passkey creation was cancelled or returned no credential");

  const response = credential.response as AuthenticatorAttestationResponse;
  const credentialId = new Uint8Array(credential.rawId);

  let publicKey: Uint8Array;
  const spki = response.getPublicKey?.();
  if (spki) {
    publicKey = publicKeyFromSpki(new Uint8Array(spki));
  } else if (typeof response.getAuthenticatorData === "function") {
    publicKey = publicKeyFromAuthenticatorData(new Uint8Array(response.getAuthenticatorData()));
  } else {
    throw new Error("credential exposed no public key; expected getPublicKey or getAuthenticatorData");
  }

  const credProps = credential.getClientExtensionResults?.().credProps;
  const result: CreatePasskeyResult = {
    credentialId,
    credentialIdBase64Url: toBase64Url(credentialId),
    publicKey,
  };
  if (credProps && typeof credProps.rk === "boolean") result.residentKey = credProps.rk;
  return result;
}

// Run the assertion ceremony over the challenge and assemble the pieces the
// smart-wallet contract verifies: the authenticator data, the client data JSON,
// and the signature in the contract's compact low-S form.
export async function signWithPasskey(input: SignWithPasskeyInput): Promise<SignWithPasskeyResult> {
  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge: toBufferSource(input.challenge),
    userVerification: "preferred",
    timeout: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
  if (input.rpId) requestOptions.rpId = input.rpId;
  if (input.allowCredentials && input.allowCredentials.length > 0) {
    requestOptions.allowCredentials = input.allowCredentials.map((id) => ({
      type: "public-key",
      id: toBufferSource(id),
    }));
  }

  const credential = (await navigator.credentials.get({
    publicKey: requestOptions,
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("passkey assertion was cancelled or returned no credential");

  const response = credential.response as AuthenticatorAssertionResponse;
  const credentialId = new Uint8Array(credential.rawId);
  const authenticatorData = new Uint8Array(response.authenticatorData);
  const clientDataJSON = new Uint8Array(response.clientDataJSON);

  return {
    credentialId,
    credentialIdBase64Url: toBase64Url(credentialId),
    authenticatorData,
    clientDataJSON,
    // DER -> canonical 64-byte low-S, the form the contract verifies and the
    // network accepts (high-S is rejected as malleable).
    signature: p256.Signature.fromDER(new Uint8Array(response.signature))
      .normalizeS()
      .toBytes("compact"),
    signedDigest: webauthnSignedDigest(authenticatorData, clientDataJSON),
  };
}

// Reproduce the digest the authenticator signed, which the contract re-derives
// before secp256r1_verify: sha256(authenticatorData || sha256(clientDataJSON)).
// Both sides must agree on this exactly or every signature fails.
export function webauthnSignedDigest(
  authenticatorData: Uint8Array,
  clientDataJSON: Uint8Array,
): Uint8Array {
  return sha256(concatBytes(authenticatorData, sha256(clientDataJSON)));
}
