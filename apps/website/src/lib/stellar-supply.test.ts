import { describe, expect, it } from "vitest";
import { formatAmount } from "./amount";
import { formatClosedAt, supplyFromRecord } from "./stellar-supply";

describe("supplyFromRecord", () => {
  it("adds every place Horizon holds an asset, in 7-decimal base units", () => {
    const supply = supplyFromRecord({
      balances: {
        authorized: "208993921.2122922",
        authorized_to_maintain_liabilities: "979527.0363342",
      },
      claimable_balances_amount: "33697.0569605",
      liquidity_pools_amount: "2566050.2366545",
      contracts_amount: "96560810.0564909",
    });
    expect(formatAmount(supply, 7)).toBe("309,134,005.5987323");
  });

  it("treats a missing component as zero rather than failing", () => {
    expect(supplyFromRecord({ balances: { authorized: "1.5" } })).toBe(15000000n);
    expect(supplyFromRecord({})).toBe(0n);
  });
});

describe("formatClosedAt", () => {
  it("prints the ledger close time as a UTC minute", () => {
    expect(formatClosedAt("2026-11-03T13:02:29Z")).toBe("2026-11-03 13:02 UTC");
  });

  it("returns an unrecognised value unchanged", () => {
    expect(formatClosedAt("soon")).toBe("soon");
  });
});
