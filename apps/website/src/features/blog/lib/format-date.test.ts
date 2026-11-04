import { describe, expect, it } from "vitest";
import { formatPostDate } from "./format-date";

describe("formatPostDate", () => {
  it("writes the day, month name and year", () => {
    expect(formatPostDate("2026-06-03")).toBe("3 June 2026");
  });

  it("rejects text that is not an ISO date", () => {
    expect(() => formatPostDate("June 3")).toThrow();
  });

  it("rejects a month that does not exist", () => {
    expect(() => formatPostDate("2026-13-01")).toThrow();
  });
});
