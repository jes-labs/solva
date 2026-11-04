import { describe, expect, it } from "vitest";
import { parseAmount } from "./amount";

describe("parseAmount", () => {
  it("reads grouped amounts into base units", () => {
    expect(parseAmount("251,902,115.50", 2)).toBe(25190211550n);
  });

  it("pads and cuts the fraction to the asset's decimals", () => {
    expect(parseAmount("10.5", 2)).toBe(1050n);
    expect(parseAmount("10.567", 2)).toBe(1056n);
    expect(parseAmount("7", 0)).toBe(7n);
  });

  it("accepts spaces and a trailing point", () => {
    expect(parseAmount(" 1 000. ", 2)).toBe(100000n);
  });

  it("rejects text that is not an amount", () => {
    expect(parseAmount("12a", 2)).toBeNull();
    expect(parseAmount("", 2)).toBeNull();
    expect(parseAmount("-5", 2)).toBeNull();
    expect(parseAmount("1.2.3", 2)).toBeNull();
  });
});
