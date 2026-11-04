import { describe, expect, it } from "vitest";
import { readMailEnv } from "./env";

describe("readMailEnv", () => {
  it("returns the key when it is set", () => {
    expect(readMailEnv({ RESEND_API_KEY: "re_test" })).toEqual({ resendApiKey: "re_test" });
  });

  it("treats a missing or blank key as not configured", () => {
    expect(readMailEnv({})).toEqual({ resendApiKey: null });
    expect(readMailEnv({ RESEND_API_KEY: "  " })).toEqual({ resendApiKey: null });
  });
});
