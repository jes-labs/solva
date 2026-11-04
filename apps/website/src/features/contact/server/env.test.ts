import { describe, expect, it } from "vitest";
import { readMailEnv } from "./env";

describe("readMailEnv", () => {
  it("returns the key when it is set", () => {
    expect(readMailEnv({ RESEND_API_KEY: "re_test" })).toEqual({
      resendApiKey: "re_test",
      waitlistSegmentId: null,
    });
  });

  it("treats a missing or blank key as not configured", () => {
    expect(readMailEnv({})).toEqual({ resendApiKey: null, waitlistSegmentId: null });
    expect(readMailEnv({ RESEND_API_KEY: "  " })).toEqual({
      resendApiKey: null,
      waitlistSegmentId: null,
    });
  });

  it("reads the waitlist segment id", () => {
    expect(
      readMailEnv({ RESEND_API_KEY: "re_test", RESEND_WAITLIST_SEGMENT_ID: " seg_1 " }),
    ).toEqual({ resendApiKey: "re_test", waitlistSegmentId: "seg_1" });
  });
});
