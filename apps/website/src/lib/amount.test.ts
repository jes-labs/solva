import { describe, expect, it } from "vitest";
import { coveragePercent, formatAmount } from "./amount";

describe("formatAmount", () => {
  it("formats base units with grouping and fixed decimals", () => {
    expect(formatAmount(418022607n, 2)).toBe("4,180,226.07");
  });

  it("keeps trailing zeros in the fraction", () => {
    expect(formatAmount(1050n, 2)).toBe("10.50");
  });

  it("handles zero and amounts below one unit", () => {
    expect(formatAmount(0n, 2)).toBe("0.00");
    expect(formatAmount(7n, 2)).toBe("0.07");
  });

  it("formats whole-unit assets", () => {
    expect(formatAmount(1250000n, 0)).toBe("1,250,000");
  });
});

describe("coveragePercent", () => {
  it("truncates to two decimals instead of rounding up", () => {
    expect(coveragePercent(24311840000n, 25190211550n)).toBe("103.61%");
    expect(coveragePercent(3n, 2n)).toBe("66.66%");
  });

  it("reads exactly 100.00% when held equals owed", () => {
    expect(coveragePercent(500n, 500n)).toBe("100.00%");
  });

  it("returns null when nothing is owed", () => {
    expect(coveragePercent(0n, 100n)).toBeNull();
  });
});
