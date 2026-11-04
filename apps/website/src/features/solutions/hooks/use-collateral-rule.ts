"use client";

import { useState } from "react";
import type { CoverageState } from "@/lib/coverage";
import { collateralDecision } from "../lib/collateral";

export function useCollateralRule(asset: string, initialState: CoverageState = "covered") {
  const [state, setState] = useState<CoverageState>(initialState);
  return { state, setState, decision: collateralDecision(asset, state) };
}
