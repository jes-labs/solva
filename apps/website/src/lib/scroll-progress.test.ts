import { describe, expect, it } from "vitest";
import { scrollProgress, showBackToTop } from "./scroll-progress";

describe("scrollProgress", () => {
  it("runs from 0 at the top to 1 at the bottom of the page", () => {
    expect(scrollProgress(0, 3000, 1000)).toBe(0);
    expect(scrollProgress(1000, 3000, 1000)).toBe(0.5);
    expect(scrollProgress(2000, 3000, 1000)).toBe(1);
  });

  it("stays within range when the scroll overshoots", () => {
    expect(scrollProgress(-40, 3000, 1000)).toBe(0);
    expect(scrollProgress(2100, 3000, 1000)).toBe(1);
  });

  it("reads 0 on a page shorter than the window", () => {
    expect(scrollProgress(0, 800, 1000)).toBe(0);
  });
});

describe("showBackToTop", () => {
  it("appears once most of the first screen has scrolled away", () => {
    expect(showBackToTop(0, 1000)).toBe(false);
    expect(showBackToTop(800, 1000)).toBe(false);
    expect(showBackToTop(801, 1000)).toBe(true);
  });
});
