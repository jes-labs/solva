import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps a colour when a brand text size is added", () => {
    expect(cn("text-ui text-on-signal", "text-small")).toBe("text-on-signal text-small");
  });

  it("lets a later brand size replace an earlier one", () => {
    expect(cn("text-lead", "text-h3")).toBe("text-h3");
  });

  it("lets a later brand radius replace an earlier one", () => {
    expect(cn("rounded-btn", "rounded-card")).toBe("rounded-card");
  });
});
