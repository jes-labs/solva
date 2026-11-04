import { describe, expect, it } from "vitest";
import type { CoverageRecord } from "./coverage";
import { coverageShortfall, heldShare } from "./coverage";

const base: CoverageRecord = {
  institution: "Arden Pay",
  asset: "EURC",
  kind: "custodial",
  owed: 290455000n,
  held: 286100410n,
  decimals: 2,
  state: "short",
  ledger: 3411640,
  provenAgo: "4 hours ago",
};

describe("coverage helpers", () => {
  it("measures the shortfall in base units", () => {
    expect(coverageShortfall(base)).toBe(4354590n);
  });

  it("reports no shortfall when held covers owed", () => {
    expect(coverageShortfall({ ...base, held: base.owed + 1n })).toBe(0n);
  });

  it("gives the held share to four decimal places", () => {
    expect(heldShare(base)).toBe(0.985);
  });

  it("treats nothing owed as fully held", () => {
    expect(heldShare({ ...base, owed: 0n })).toBe(1);
  });
});
