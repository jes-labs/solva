import { describe, expect, it } from "vitest";
import {
  commas,
  completedSteps,
  initialStatus,
  publishedLines,
  rejectedLines,
  reservesLines,
  truncate,
  verifyLines,
} from "./sandbox";

describe("sandbox helpers", () => {
  it("formats totals with thousands separators and tolerates missing values", () => {
    expect(commas("16000000")).toBe("16,000,000");
    expect(commas(undefined)).toBe("0");
    expect(commas("")).toBe("0");
  });

  it("truncates long values with an ellipsis", () => {
    expect(truncate("abcdef", 3)).toBe("abc…");
    expect(truncate("abc", 3)).toBe("abc");
  });

  it("counts completed steps", () => {
    const status = initialStatus();
    expect(completedSteps(status)).toBe(0);
    status.registry = "done";
    status.connect = "done";
    expect(completedSteps(status)).toBe(2);
  });

  it("reads a covered proof as covered and a short one as short", () => {
    expect(verifyLines({ reserves_total: "16000000", liabilities_total: "9000000" }).covers).toBe(
      true,
    );
    expect(verifyLines({ reserves_total: "4500000", liabilities_total: "9000000" }).covers).toBe(
      false,
    );
  });

  it("writes the public inputs and the proof number into the publish log", () => {
    const lines = publishedLines({
      root_hash: "0xabc",
      reserves_total: "16000000",
      liabilities_total: "9000000",
      chain_proof_id: 9,
    });
    expect(lines.map((line) => line.text)).toContain("proven totals  R=16,000,000  L=9,000,000");
    expect(lines.at(-1)?.text).toBe("Published on Stellar as proof #9.");
  });

  it("never marks a refused witness as a success", () => {
    const lines = rejectedLines();
    expect(lines.map((line) => line.text).join(" ")).toContain("R < L");
    expect(lines.some((line) => line.kind === "ok")).toBe(false);
  });

  it("lists one signed balance per reserve account", () => {
    const lines = reservesLines(
      [
        { source_id: "acct-a", balance: "1000", currency: "USD", signature: "sig-a" },
        { source_id: "acct-b", balance: "2000", currency: "USD", signature: "sig-b" },
      ],
      "3000",
    );
    expect(lines).toHaveLength(5);
    expect(lines[0]?.text).toBe("acct-a       1,000");
    expect(lines.map((line) => line.text).join(" ")).not.toContain("USD");
    expect(lines.at(-1)?.text).toBe("Reserves R = 3,000 (signed by the reserve source).");
  });
});
