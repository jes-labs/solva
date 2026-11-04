import { describe, expect, it } from "vitest";
import {
  DEMO_INSTITUTIONS,
  demoInstitution,
  formatUsdc,
  holdingBalance,
} from "./demo-institutions";

describe("demo institutions", () => {
  it("lists Harbor Wallet as the institution read on chain", () => {
    const harbor = demoInstitution("33333333-3333-3333-3333-333333333333");
    expect(harbor?.name).toBe("Harbor Wallet");
    expect(harbor?.reserves.kind).toBe("onchain");
    expect(DEMO_INSTITUTIONS.filter((item) => item.reserves.kind === "attested")).toHaveLength(2);
  });

  it("returns nothing for an unknown tenant", () => {
    expect(demoInstitution("not-a-tenant")).toBeUndefined();
  });
});

describe("holdingBalance", () => {
  const issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
  const account = {
    balances: [
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: issuer,
        balance: "20.0000000",
      },
      { asset_type: "native", balance: "9999.9999900" },
    ],
  };

  it("reads the asset balance in stroops", () => {
    expect(holdingBalance(account, "USDC", issuer)).toBe("200000000");
  });

  it("reports a missing asset", () => {
    expect(holdingBalance(account, "EURC", issuer)).toBeNull();
    expect(holdingBalance({ balances: [] }, "USDC", issuer)).toBeNull();
  });
});

describe("formatUsdc", () => {
  it("shows stroops as USDC with trailing zeros removed", () => {
    expect(formatUsdc("200000000")).toBe("20 USDC");
    expect(formatUsdc("90000000")).toBe("9 USDC");
    expect(formatUsdc("12345678")).toBe("1.2345678 USDC");
  });
});
