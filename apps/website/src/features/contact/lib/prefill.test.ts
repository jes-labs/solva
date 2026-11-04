import { describe, expect, it } from "vitest";
import { readPrefill } from "./prefill";

describe("readPrefill", () => {
  it("reads organisation and role from the homepage link", () => {
    expect(readPrefill({ organisation: "Kestrel Anchor", role: "Anchor" })).toEqual({
      organisation: "Kestrel Anchor",
      role: "Anchor",
    });
  });

  it("matches the role without regard to case", () => {
    expect(readPrefill({ role: "custodial app" }).role).toBe("Custodial app");
  });

  it("drops a role that is not offered", () => {
    expect(readPrefill({ role: "Regulator" }).role).toBe("");
  });

  it("takes the first of repeated values and caps the length", () => {
    const prefill = readPrefill({ organisation: ["A".repeat(200), "B"] });
    expect(prefill.organisation).toHaveLength(160);
  });

  it("returns empty values when nothing is given", () => {
    expect(readPrefill({})).toEqual({ organisation: "", role: "" });
  });
});
