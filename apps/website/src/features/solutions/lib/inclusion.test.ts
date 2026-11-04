import { describe, expect, it } from "vitest";
import { checkInclusion, normalizeReference, northwaySnapshot } from "./inclusion";

describe("normalizeReference", () => {
  it("accepts a reference in any case and spacing", () => {
    expect(normalizeReference(" nwc-0418 ")).toBe("NWC-0418");
    expect(normalizeReference("nwc0418")).toBe("NWC-0418");
  });

  it("rejects text that is not a reference", () => {
    expect(normalizeReference("")).toBeNull();
    expect(normalizeReference("NWC-41")).toBeNull();
    expect(normalizeReference("hello")).toBeNull();
  });
});

describe("checkInclusion", () => {
  it("returns the balance and the total it is part of", () => {
    expect(checkInclusion("NWC-0418", northwaySnapshot)).toEqual({
      status: "counted",
      reference: "NWC-0418",
      balance: 248015n,
      total: 1842090512n,
      ledger: 3411902,
    });
  });

  it("reports a well-formed reference that is not in the proof", () => {
    expect(checkInclusion("NWC-9999", northwaySnapshot)).toEqual({
      status: "not-found",
      reference: "NWC-9999",
    });
  });

  it("flags input that is not a reference", () => {
    expect(checkInclusion("abc", northwaySnapshot)).toEqual({ status: "invalid", input: "abc" });
  });

  it("keeps every example balance inside the total", () => {
    const sum = northwaySnapshot.customers.reduce((acc, customer) => acc + customer.balance, 0n);
    expect(sum <= northwaySnapshot.total).toBe(true);
  });
});
