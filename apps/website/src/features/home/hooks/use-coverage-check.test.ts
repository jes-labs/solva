import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCoverageCheck } from "./use-coverage-check";

describe("useCoverageCheck", () => {
  it("starts covered with reserves above what is owed", () => {
    const { result } = renderHook(() => useCoverageCheck());
    expect(result.current.state).toBe("covered");
    expect(result.current.percent).toBe("103.61%");
    expect(result.current.shortfall).toBe("0.00");
  });

  it("turns short and shows the gap when reserves fall below what is owed", () => {
    const { result } = renderHook(() => useCoverageCheck());
    act(() => result.current.setBasisPoints(9500));
    expect(result.current.state).toBe("short");
    expect(result.current.percent).toBe("95.00%");
    expect(result.current.shortfall).toBe("12,155,920.00");
  });

  it("is covered at exactly what is owed", () => {
    const { result } = renderHook(() => useCoverageCheck());
    act(() => result.current.setBasisPoints(10000));
    expect(result.current.state).toBe("covered");
  });

  it("turns stale when the last proof is too old, whatever the reserves", () => {
    const { result } = renderHook(() => useCoverageCheck());
    act(() => result.current.setFresh(false));
    expect(result.current.state).toBe("stale");
  });
});
