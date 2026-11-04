import { describe, expect, it } from "vitest";
import { LEGAL_CONTENTS } from "./contents";

describe("LEGAL_CONTENTS", () => {
  it("has unique anchor ids", () => {
    const ids = LEGAL_CONTENTS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses ids that work as URL fragments", () => {
    for (const entry of LEGAL_CONTENTS) {
      expect(entry.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});
