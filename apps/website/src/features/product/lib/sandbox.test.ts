import { describe, expect, it } from "vitest";
import { demoInstitution } from "@/lib/demo-institutions";
import {
  commas,
  completedSteps,
  inclusionLines,
  initialStatus,
  onchainConnectLines,
  onchainReservesLines,
  publishedLines,
  rejectedLines,
  reservesLines,
  truncate,
  verifyLines,
} from "./sandbox";

function institution(tenantId: string) {
  const found = demoInstitution(tenantId);
  if (!found) throw new Error(`no demo institution ${tenantId}`);
  return found;
}

const solstice = institution("22222222-2222-2222-2222-222222222222");
const harbor = institution("33333333-3333-3333-3333-333333333333");

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

  it("checks the record read from the contract on Stellar", () => {
    const covered = verifyLines({ reserves: "16000000", liabilities: "9000000" }, solstice);
    expect(covered.covers).toBe(true);
    expect(covered.lines[0]?.text).toBe("get_latest_proof  →  read from the registry on Stellar");
    expect(covered.lines[1]?.text).toBe("R=16,000,000  L=9,000,000");
    expect(verifyLines({ reserves: "4500000", liabilities: "9000000" }, solstice).covers).toBe(
      false,
    );
  });

  it("shows on-chain reserves and totals in USDC", () => {
    const result = verifyLines({ reserves: "200000000", liabilities: "90000000" }, harbor);
    expect(result.lines[1]?.text).toBe("R=20 USDC  L=9 USDC");
  });

  it("writes the public inputs and the proof number into the publish log", () => {
    const lines = publishedLines(
      {
        root_hash: "0xabc",
        reserves_total: "16000000",
        liabilities_total: "9000000",
        chain_proof_id: 9,
      },
      solstice,
    );
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

  it("explains that on-chain reserves need no authorisation", () => {
    const text = onchainConnectLines(harbor)
      .map((line) => line.text)
      .join(" ");
    expect(text).toContain("GCPBHMM7KSE74LO757SPKBE3PHWYRTKKKVBCVZURBFM6B2GSOPAJAR4R");
    expect(text).toContain("No authorisation is needed");
  });

  it("lists the on-chain holding read from Stellar", () => {
    const lines = onchainReservesLines(harbor, "200000000");
    expect(lines.map((line) => line.text).join(" ")).toContain("read from Stellar Testnet");
    expect(lines.at(-1)?.text).toBe("Reserves R = 20 USDC (read from the account on Stellar).");
  });

  it("reports the contract's inclusion result", () => {
    const included = inclusionLines(
      { balance: "4000000", pathLength: 2, chainProofId: "4", onChain: true },
      solstice,
    );
    expect(included.map((line) => line.text)).toContain(
      "verify_inclusion  →  true, on the registry on Stellar",
    );
    const missing = inclusionLines(
      { balance: "4000000", pathLength: 2, chainProofId: "4", onChain: false },
      solstice,
    );
    expect(missing.some((line) => line.kind === "ok")).toBe(false);
  });
});
