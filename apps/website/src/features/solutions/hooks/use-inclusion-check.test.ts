import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { northwaySnapshot } from "../lib/inclusion";
import { useInclusionCheck } from "./use-inclusion-check";

describe("useInclusionCheck", () => {
  it("starts idle without a reference", () => {
    const { result } = renderHook(() => useInclusionCheck(northwaySnapshot));
    expect(result.current.result.status).toBe("idle");
  });

  it("checks the starting reference straight away", () => {
    const { result } = renderHook(() => useInclusionCheck(northwaySnapshot, "NWC-0418"));
    expect(result.current.result).toMatchObject({ status: "counted", balance: 248015n });
  });

  it("checks a picked customer", () => {
    const { result } = renderHook(() => useInclusionCheck(northwaySnapshot));
    act(() => result.current.pick("NWC-2961"));
    expect(result.current.query).toBe("NWC-2961");
    expect(result.current.result).toMatchObject({ status: "counted", balance: 48733120n });
  });

  it("waits for submit after typing, then reports a missing reference", () => {
    const { result } = renderHook(() => useInclusionCheck(northwaySnapshot, "NWC-0418"));
    act(() => result.current.setQuery("NWC-9999"));
    expect(result.current.result.status).toBe("idle");
    act(() => result.current.submit());
    expect(result.current.result).toEqual({ status: "not-found", reference: "NWC-9999" });
  });

  it("flags invalid input on submit", () => {
    const { result } = renderHook(() => useInclusionCheck(northwaySnapshot));
    act(() => result.current.setQuery("hello"));
    act(() => result.current.submit());
    expect(result.current.result.status).toBe("invalid");
  });
});
