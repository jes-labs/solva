import "server-only";
import { z } from "zod";

const mailEnvSchema = z.object({
  RESEND_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
});

export interface MailEnv {
  resendApiKey: string | null;
}

export function readMailEnv(source: Record<string, string | undefined> = process.env): MailEnv {
  const parsed = mailEnvSchema.parse({ RESEND_API_KEY: source.RESEND_API_KEY });
  return { resendApiKey: parsed.RESEND_API_KEY };
}
