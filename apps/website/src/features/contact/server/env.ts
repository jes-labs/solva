import "server-only";
import { z } from "zod";

const optionalSetting = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === undefined || value === "" ? null : value));

const mailEnvSchema = z.object({
  RESEND_API_KEY: optionalSetting,
  RESEND_WAITLIST_SEGMENT_ID: optionalSetting,
});

export interface MailEnv {
  resendApiKey: string | null;
  waitlistSegmentId: string | null;
}

export function readMailEnv(source: Record<string, string | undefined> = process.env): MailEnv {
  const parsed = mailEnvSchema.parse({
    RESEND_API_KEY: source.RESEND_API_KEY,
    RESEND_WAITLIST_SEGMENT_ID: source.RESEND_WAITLIST_SEGMENT_ID,
  });
  return {
    resendApiKey: parsed.RESEND_API_KEY,
    waitlistSegmentId: parsed.RESEND_WAITLIST_SEGMENT_ID,
  };
}
