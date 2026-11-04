import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCollateralRule } from "./use-collateral-rule";

describe("useCollateralRule", () => {
  it("accepts deposits while covered", () => {
    const { result } = renderHook(() => useCollateralRule("ARSK"));
    expect(result.current.state).toBe("covered");
    expect(result.current.decision.isAccepting).toBe(true);
  });

  it("pauses when the state turns short", () => {
    const { result } = renderHook(() => useCollateralRule("ARSK"));
    act(() => result.current.setState("short"));
    expect(result.current.decision.isAccepting).toBe(false);
    expect(result.current.decision.status).toBe("Deposits paused");
  });

  it("pauses when the state turns stale", () => {
    const { result } = renderHook(() => useCollateralRule("ARSK", "stale"));
    expect(result.current.decision.isAccepting).toBe(false);
  });
});
