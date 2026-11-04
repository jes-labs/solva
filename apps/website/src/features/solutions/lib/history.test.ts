import { describe, expect, it } from "vitest";
import { dailyHistory, summarizeDays } from "./history";

describe("dailyHistory", () => {
  it("fills every day as covered unless marked", () => {
    expect(dailyHistory(4, { 2: "stale" })).toEqual(["covered", "covered", "stale", "covered"]);
  });

  it("ignores marks outside the range", () => {
    expect(dailyHistory(2, { 5: "short" })).toEqual(["covered", "covered"]);
  });

  it("returns nothing for an invalid length", () => {
    expect(dailyHistory(-1, {})).toEqual([]);
    expect(dailyHistory(1.5, {})).toEqual([]);
  });
});

describe("summarizeDays", () => {
  it("counts each state in a fixed order", () => {
    expect(summarizeDays(["stale", "covered", "covered", "short"])).toBe(
      "2 covered, 1 short, 1 stale",
    );
  });

  it("leaves out states that did not occur", () => {
    expect(summarizeDays(dailyHistory(3, {}))).toBe("3 covered");
  });

  it("says so when there are no days", () => {
    expect(summarizeDays([])).toBe("No results yet");
  });
});
