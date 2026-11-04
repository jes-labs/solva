import { describe, expect, it } from "vitest";
import { readingMinutes } from "./reading-time";

describe("readingMinutes", () => {
  it("rounds the word count to whole minutes", () => {
    expect(readingMinutes("word ".repeat(660))).toBe(3);
  });

  it("never reports less than one minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("a few words")).toBe(1);
  });
});
