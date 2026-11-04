import { describe, expect, it } from "vitest";
import { reserveBalanceUrl } from "./sandbox-paths";

describe("reserveBalanceUrl", () => {
  it("reads a reserve balance from the sandbox's versioned accounts route", () => {
    expect(reserveBalanceUrl("http://sandbox.test:8090", "acct-anchor")).toBe(
      "http://sandbox.test:8090/v1/accounts/acct-anchor/balance",
    );
  });

  it("encodes the account id and tolerates a trailing slash on the base", () => {
    expect(reserveBalanceUrl("http://sandbox.test:8090/", "acct/x")).toBe(
      "http://sandbox.test:8090/v1/accounts/acct%2Fx/balance",
    );
  });
});
