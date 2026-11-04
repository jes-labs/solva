import { describe, expect, it } from "vitest";
import imageLoader from "./image-loader";

describe("imageLoader", () => {
  it("serves the smallest prepared size that covers the requested width", () => {
    expect(imageLoader({ src: "/images/archive/cargo-ship-1600.webp", width: 360 })).toBe(
      "/images/archive/cargo-ship-400.webp",
    );
    expect(imageLoader({ src: "/images/archive/cargo-ship-1600.webp", width: 640 })).toBe(
      "/images/archive/cargo-ship-800.webp",
    );
  });

  it("caps at the largest prepared size", () => {
    expect(imageLoader({ src: "/images/archive/cargo-ship-800.webp", width: 3840 })).toBe(
      "/images/archive/cargo-ship-1600.webp",
    );
  });

  it("leaves other images untouched", () => {
    expect(imageLoader({ src: "/icon.svg", width: 64 })).toBe("/icon.svg");
  });
});
