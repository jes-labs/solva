import { describe, expect, it } from "vitest";
import { LONG_TICKS, SHORT_TICKS } from "./seal-geometry";

describe("seal geometry", () => {
  it("matches the approved seal: 36 short and 12 long ticks", () => {
    expect(SHORT_TICKS).toHaveLength(36);
    expect(LONG_TICKS).toHaveLength(12);
  });

  it("starts the first tick at twelve o'clock, as drawn in the logo files", () => {
    expect(SHORT_TICKS[0]).toEqual({ x1: 60, y1: 13, x2: 60, y2: 5 });
    expect(LONG_TICKS[0]).toEqual({ x1: 60, y1: 17, x2: 60, y2: 5 });
  });

  it("places the 90 degree long tick at three o'clock", () => {
    expect(LONG_TICKS[3]).toEqual({ x1: 103, y1: 60, x2: 115, y2: 60 });
  });
});
