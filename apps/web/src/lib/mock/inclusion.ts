import type { InclusionResult } from "@solva/shared-types";

// Mock inclusion check for the customer checker while the contract inclusion
// logic and the orchestrator inclusion endpoint are wired. Mirrors the SDK:
//
//   const { included, proofId } = await solvaClient(tenant).verifyInclusion(reference);
//
// which resolves the reference to an InclusionRef through the orchestrator and
// then calls verify_inclusion on-chain. The result is only a yes or no plus the
// proof it was checked against; it never carries any balance.

const LATEST_PROOF_ID = "1042";

// References committed in the latest proof. In production this is decided on-chain
// from the customer's leaf and path, never from a list.
const INCLUDED = new Set(["acct_8842", "ref-1029", "cust_5567"]);

export const EXAMPLE_REFERENCE = "acct_8842";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkInclusion(reference: string): Promise<InclusionResult> {
  const ref = reference.trim();
  await delay(720);
  return { included: INCLUDED.has(ref), proofId: LATEST_PROOF_ID };
}
