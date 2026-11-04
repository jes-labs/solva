import { describe, expect, it } from "vitest";
import { nextDay, stepAt, stepOffset } from "./stage-steps";

describe("stepAt", () => {
  it("maps scroll progress onto the five steps", () => {
    expect(stepAt(0, 5)).toBe(1);
    expect(stepAt(0.19, 5)).toBe(1);
    expect(stepAt(0.2, 5)).toBe(2);
    expect(stepAt(0.61, 5)).toBe(4);
    expect(stepAt(1, 5)).toBe(5);
  });

  it("never leaves the range of steps", () => {
    expect(stepAt(-1, 5)).toBe(1);
    expect(stepAt(2, 5)).toBe(5);
  });
});

describe("stepOffset", () => {
  it("lands inside each step's share of the scroll, past its start", () => {
    expect(stepOffset(1, 5)).toBeCloseTo(0.09);
    expect(stepOffset(3, 5)).toBeCloseTo(0.49);
    expect(stepAt(stepOffset(5, 5), 5)).toBe(5);
  });
});

describe("nextDay", () => {
  it("walks forward and wraps from the latest day to the oldest", () => {
    expect(nextDay(0, 7)).toBe(1);
    expect(nextDay(5, 7)).toBe(6);
    expect(nextDay(6, 7)).toBe(0);
  });

  it("stays put with no days", () => {
    expect(nextDay(3, 0)).toBe(0);
  });
});
