import { describe, expect, it } from "vitest";
import { collateralDecision } from "./collateral";

describe("collateralDecision", () => {
  it("accepts deposits while the asset is covered", () => {
    expect(collateralDecision("ARSK", "covered").isAccepting).toBe(true);
  });

  it("pauses deposits when the asset is short", () => {
    const decision = collateralDecision("EURC", "short");
    expect(decision.isAccepting).toBe(false);
    expect(decision.reason).toContain("short");
  });

  it("pauses deposits when the asset is stale", () => {
    const decision = collateralDecision("USDC", "stale");
    expect(decision.isAccepting).toBe(false);
    expect(decision.reason).toContain("stale");
  });
});
