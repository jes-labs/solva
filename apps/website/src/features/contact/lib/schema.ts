import { z } from "zod";
import type { FieldErrors, FieldValues } from "../types";

export const ROLES = [
  "Anchor",
  "Custodial app",
  "Exchange",
  "Wallet",
  "Lending pool",
  "Auditor",
  "Other",
] as const;

export type Role = (typeof ROLES)[number];

export const HONEYPOT_FIELD = "website";

function line(missing: string, max: number) {
  return z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1, missing).max(max, `Keep this under ${max} characters.`));
}

const email = z
  .string()
  .trim()
  .min(1, "Add your work email.")
  .max(320, "Keep this under 320 characters.")
  .email("Enter an email address like name@company.com.");

const role = z.enum(ROLES, {
  errorMap: () => ({ message: "Choose the option that fits you best." }),
});

export const contactSchema = z.object({
  name: line("Add your name.", 120),
  email,
  organisation: line("Add your organisation.", 160),
  role,
  asset: z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().max(120, "Keep this under 120 characters.")),
  message: z
    .string()
    .trim()
    .min(1, "Tell us a little about what you need.")
    .max(5000, "Keep this under 5,000 characters."),
});

export const waitlistSchema = z.object({
  email,
  organisation: contactSchema.shape.organisation,
  role,
});

export type ContactSubmission = z.output<typeof contactSchema>;
export type WaitlistSubmission = z.output<typeof waitlistSchema>;
export type ContactField = keyof ContactSubmission;
export type WaitlistField = keyof WaitlistSubmission;

export const CONTACT_FIELDS: readonly ContactField[] = [
  "name",
  "email",
  "organisation",
  "role",
  "asset",
  "message",
];

export const WAITLIST_FIELDS: readonly WaitlistField[] = ["email", "organisation", "role"];

export function readFields<F extends string>(
  formData: FormData,
  fields: readonly F[],
): Record<F, string> {
  const entries = fields.map((field) => {
    const value = formData.get(field);
    return [field, typeof value === "string" ? value : ""] as const;
  });
  return Object.fromEntries(entries) as Record<F, string>;
}

export function isBot(formData: FormData): boolean {
  const value = formData.get(HONEYPOT_FIELD);
  return typeof value === "string" && value.trim() !== "";
}

export type Validation<T, F extends string> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors<F>; values: FieldValues<F> };

export function validate<S extends z.ZodType, F extends string>(
  schema: S,
  values: Record<F, string>,
  fields: readonly F[],
): Validation<z.output<S>, F> {
  const parsed = schema.safeParse(values);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  const flattened = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const errors: FieldErrors<F> = {};
  for (const field of fields) {
    const first = flattened[field]?.[0];
    if (first) {
      errors[field] = first;
    }
  }
  return { ok: false, errors, values };
}
