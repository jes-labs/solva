// Optional client-side proof verification on the public verify page. The real
// implementation loads the circuit's verification key and runs noir_js /
// @aztec/bb.js in the browser to check the UltraHonk proof without trusting any
// server. That pulls a wasm bundle, so it is kept behind this function and
// stubbed until the verifier artifact is wired in.

import type { Proof } from "@solva/shared-types";

export interface ClientVerifyResult {
  /** True when the proof verified in the browser. */
  verified: boolean;
  /** Set when verification could not run, for example the artifact is missing. */
  unavailableReason?: string;
}

/**
 * Verify a proof client-side with noir_js. Stub: returns unavailable until the
 * verification key and bb.js wasm are bundled. The signature is stable so the
 * UI does not change when the real path lands.
 */
export async function verifyProofClientSide(_proof: Proof): Promise<ClientVerifyResult> {
  return {
    verified: false,
    unavailableReason: "Client-side verification is not wired yet. Trust the on-chain check.",
  };
}
