// Plain messages for the smart-wallet contract error codes (see Errors in
// bindings.gen). Raw HostError dumps are useless to an operator.
const WALLET_ERRORS: Record<number, string> = {
  1: "That signer was not found on the wallet.",
  2: "This orchestrator key is already a signer on your wallet. You are all set.",
  3: "The wallet rejected the request context.",
  4: "That signer has expired. Add it again.",
  5: "The signer is not allowed to authorize this contract.",
  6: "A policy signer rejected the request.",
  7: "The signature did not match the signer key.",
  8: "The passkey challenge did not match. Try again.",
  9: "The wallet could not read the passkey response.",
};

export interface WalletError {
  code: number | null;
  message: string;
  // AlreadyExists is a no-op, not a failure: the signer is already in place.
  alreadyExists: boolean;
}

export function describeWalletError(raw: string): WalletError {
  const match = raw.match(/Error\(Contract,\s*#(\d+)\)/);
  if (!match) return { code: null, message: raw, alreadyExists: false };
  const code = Number(match[1]);
  return {
    code,
    message: WALLET_ERRORS[code] ?? `The wallet rejected the request (error ${code}).`,
    alreadyExists: code === 2,
  };
}
