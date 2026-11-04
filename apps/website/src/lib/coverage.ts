export type CoverageState = "covered" | "short" | "stale";

export interface CoverageRecord {
  institution: string;
  asset: string;
  kind: "anchor" | "custodial";
  owed: bigint;
  held: bigint;
  decimals: number;
  state: CoverageState;
  ledger: number;
  provenAgo: string;
  customers?: number;
}

export function coverageShortfall(record: CoverageRecord): bigint {
  return record.held >= record.owed ? 0n : record.owed - record.held;
}

export function heldShare(record: CoverageRecord): number {
  if (record.owed <= 0n) return 1;
  const basisPoints = Number((record.held * 10000n) / record.owed);
  return basisPoints / 10000;
}

export const stateLabel: Record<CoverageState, string> = {
  covered: "Covered",
  short: "Short",
  stale: "Stale",
};
