"use client";

import { useState } from "react";
import { coveragePercent, formatAmount } from "@/lib/amount";
import type { CoverageState } from "@/lib/coverage";

const OWED = 24311840000n;
const DECIMALS = 2;
const START = 10361;

export function useCoverageCheck() {
  const [basisPoints, setBasisPoints] = useState(START);
  const [fresh, setFresh] = useState(true);

  const held = (OWED * BigInt(basisPoints)) / 10000n;
  const covered = held >= OWED;
  const state: CoverageState = !fresh ? "stale" : covered ? "covered" : "short";

  return {
    basisPoints,
    setBasisPoints,
    fresh,
    setFresh,
    state,
    share: basisPoints / 10000,
    held: formatAmount(held, DECIMALS),
    owed: formatAmount(OWED, DECIMALS),
    percent: coveragePercent(OWED, held),
    shortfall: formatAmount(covered ? 0n : OWED - held, DECIMALS),
    surplus: formatAmount(covered ? held - OWED : 0n, DECIMALS),
  };
}
