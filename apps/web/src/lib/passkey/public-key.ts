import { p256 } from "@noble/curves/nist.js";
import { hexToBytes } from "@noble/hashes/utils";

// The smart-wallet contract stores a 65-byte uncompressed P-256 point
// (0x04 || x || y) as the signer. Authenticators hand us that key in one of two
// shapes (a DER SPKI blob from getPublicKey, or inside authenticatorData), so we
// support both and converge on the same validated point.

const UNCOMPRESSED_POINT_LENGTH = 65;
const UNCOMPRESSED_POINT_PREFIX = 0x04;

// Fixed DER SubjectPublicKeyInfo header for an EC P-256 key. The 65-byte point
// follows it.
const SPKI_P256_HEADER = hexToBytes("3059301306072a8648ce3d020106082a8648ce3d030107034200");

// Extract the signer key from a DER SubjectPublicKeyInfo blob, returned by
// AuthenticatorAttestationResponse.getPublicKey().
export function publicKeyFromSpki(spki: Uint8Array): Uint8Array {
  const expectedLength = SPKI_P256_HEADER.length + UNCOMPRESSED_POINT_LENGTH;
  if (spki.length !== expectedLength) {
    throw new Error(`unexpected SPKI length: got ${spki.length}, expected ${expectedLength}`);
  }
  return validatePoint(spki.subarray(SPKI_P256_HEADER.length));
}

// Extract the signer key from raw authenticator data, used when only the
// attestation object is available.
//   authenticatorData: rpIdHash(32) | flags(1) | signCount(4) | attestedCredentialData
//   attestedCredentialData: aaguid(16) | credIdLen(2 BE) | credentialId | coseKey
export function publicKeyFromAuthenticatorData(authenticatorData: Uint8Array): Uint8Array {
  const FLAGS_OFFSET = 32;
  const CREDENTIAL_ID_LENGTH_OFFSET = 53;
  const CREDENTIAL_ID_OFFSET = 55;
  const ATTESTED_CREDENTIAL_DATA_FLAG = 0x40;

  const flags = byteAt(authenticatorData, FLAGS_OFFSET);
  if ((flags & ATTESTED_CREDENTIAL_DATA_FLAG) === 0) {
    throw new Error("authenticator data has no attested credential data");
  }

  const credentialIdLength =
    (byteAt(authenticatorData, CREDENTIAL_ID_LENGTH_OFFSET) << 8) |
    byteAt(authenticatorData, CREDENTIAL_ID_LENGTH_OFFSET + 1);

  const coseKey = authenticatorData.subarray(CREDENTIAL_ID_OFFSET + credentialIdLength);
  const { x, y } = decodeCoseP256Key(coseKey);

  const point = new Uint8Array(UNCOMPRESSED_POINT_LENGTH);
  point[0] = UNCOMPRESSED_POINT_PREFIX;
  point.set(x, 1);
  point.set(y, 33);
  return validatePoint(point);
}

function validatePoint(point: Uint8Array): Uint8Array {
  if (point.length !== UNCOMPRESSED_POINT_LENGTH || point[0] !== UNCOMPRESSED_POINT_PREFIX) {
    throw new Error("expected a 65-byte uncompressed P-256 point");
  }
  // Throws if the point is not on the curve.
  p256.Point.fromHex(point);
  return Uint8Array.from(point);
}

// Minimal CBOR reader scoped to COSE_Key maps. A COSE EC2 key is a small map of
// integer labels to integers and byte strings; we only need labels -2 (x) and
// -3 (y). A full CBOR library would be overkill and a larger attack surface.
function decodeCoseP256Key(cose: Uint8Array): { x: Uint8Array; y: Uint8Array } {
  let pos = 0;

  const readLength = (info: number): number => {
    if (info < 24) return info;
    if (info === 24) return byteAt(cose, pos++);
    if (info === 25) {
      const value = (byteAt(cose, pos) << 8) | byteAt(cose, pos + 1);
      pos += 2;
      return value;
    }
    throw new Error("unsupported CBOR length encoding in COSE key");
  };

  const readItem = (): number | Uint8Array => {
    const head = byteAt(cose, pos++);
    const majorType = head >> 5;
    const info = head & 0x1f;
    switch (majorType) {
      case 0:
        return readLength(info);
      case 1:
        return -1 - readLength(info);
      case 2:
      case 3: {
        const length = readLength(info);
        const slice = cose.subarray(pos, pos + length);
        pos += length;
        return slice;
      }
      default:
        throw new Error(`unsupported CBOR major type ${majorType} in COSE key`);
    }
  };

  const mapHead = byteAt(cose, pos++);
  if (mapHead >> 5 !== 5) throw new Error("COSE key is not a CBOR map");
  const entryCount = mapHead & 0x1f;

  let x: Uint8Array | undefined;
  let y: Uint8Array | undefined;
  for (let i = 0; i < entryCount; i++) {
    const label = readItem();
    const value = readItem();
    if (label === -2 && value instanceof Uint8Array) x = value;
    else if (label === -3 && value instanceof Uint8Array) y = value;
  }

  if (!x || !y || x.length !== 32 || y.length !== 32) {
    throw new Error("COSE key is missing valid P-256 coordinates");
  }
  return { x, y };
}

function byteAt(buffer: Uint8Array, index: number): number {
  const value = buffer[index];
  if (value === undefined) throw new Error(`unexpected end of buffer at index ${index}`);
  return value;
}
