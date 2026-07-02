import { Buffer } from "buffer";
import { hash, xdr } from "@stellar/stellar-sdk";

// The payload a passkey signs for a transaction is the hash of the Soroban
// authorization preimage. The smart-wallet contract re-derives the same hash
// on-chain and checks the passkey signed it, so this must match the protocol
// byte for byte. A mismatch signs fine locally and fails in __check_auth.
export interface AuthorizationPayloadArgs {
  networkPassphrase: string;
  nonce: xdr.Int64;
  signatureExpirationLedger: number;
  invocation: xdr.SorobanAuthorizedInvocation;
}

export function authorizationPayload(args: AuthorizationPayloadArgs): Uint8Array {
  const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
    new xdr.HashIdPreimageSorobanAuthorization({
      networkId: hash(Buffer.from(args.networkPassphrase)),
      nonce: args.nonce,
      signatureExpirationLedger: args.signatureExpirationLedger,
      invocation: args.invocation,
    }),
  );
  return new Uint8Array(hash(preimage.toXDR()));
}

// Build the payload directly from an address-credentials authorization entry.
export function payloadForAuthEntry(
  entry: xdr.SorobanAuthorizationEntry,
  networkPassphrase: string,
): Uint8Array {
  const credentials = entry.credentials();
  if (
    credentials.switch().value !==
    xdr.SorobanCredentialsType.sorobanCredentialsAddress().value
  ) {
    throw new Error("authorization entry does not use address credentials");
  }
  const address = credentials.address();
  return authorizationPayload({
    networkPassphrase,
    nonce: address.nonce(),
    signatureExpirationLedger: address.signatureExpirationLedger(),
    invocation: entry.rootInvocation(),
  });
}
