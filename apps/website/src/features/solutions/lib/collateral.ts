import type { CoverageState } from "@/lib/coverage";

export interface CollateralDecision {
  isAccepting: boolean;
  status: string;
  reason: string;
}

export function collateralDecision(asset: string, state: CoverageState): CollateralDecision {
  if (state === "covered") {
    return {
      isAccepting: true,
      status: "Accepting deposits",
      reason: `${asset} is covered, so new deposits count as collateral.`,
    };
  }
  if (state === "short") {
    return {
      isAccepting: false,
      status: "Deposits paused",
      reason: `${asset} is short. New deposits wait until a proof shows it covered again.`,
    };
  }
  return {
    isAccepting: false,
    status: "Deposits paused",
    reason: `${asset} is stale. With no recent proof, the pool treats coverage as unknown.`,
  };
}
