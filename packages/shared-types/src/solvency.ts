// Solvency status as the oracle and dashboard report it.

/**
 * Solvency verdict for an institution at a point in time. Derived from the
 * latest proof: solvent when R >= L and the on-chain check passed.
 */
export const SolvencyStatus = {
  Solvent: "solvent",
  Breach: "breach",
  Unknown: "unknown",
} as const;

export type SolvencyStatus = (typeof SolvencyStatus)[keyof typeof SolvencyStatus];

/** The oracle's get_solvency answer, backed by an on-chain verification check. */
export interface SolvencyResult {
  status: SolvencyStatus;
  solvent: boolean;
  /** Total reserves R, decimal string. */
  reservesTotal: string;
  /** Total liabilities L, decimal string. */
  liabilitiesTotal: string;
  proofId: string;
  /** True only when the on-chain proof verification succeeded. */
  verifiedOnChain: boolean;
  /** Unix epoch seconds the proof was published. */
  asOf: number;
}

/** The result of a customer inclusion check. */
export interface InclusionResult {
  included: boolean;
  proofId: string;
}
