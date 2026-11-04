import "server-only";
import { Resend } from "resend";
import { waitlistConfirmation } from "../lib/message";
import {
  WAITLIST_FIELDS,
  isBot,
  readFields,
  validate,
  waitlistSchema,
  type WaitlistField,
  type WaitlistSubmission,
} from "../lib/schema";
import type { SubmissionState } from "../types";
import { readMailEnv } from "./env";
import { send } from "./mailer";

const ALREADY_LISTED = "This email is already on the waitlist.";

type Listing = "added" | "listed" | "failed";

async function addToWaitlist(
  resend: Resend,
  segmentId: string,
  data: WaitlistSubmission,
): Promise<Listing> {
  try {
    const existing = await resend.contacts.get({ email: data.email });
    if (existing.data) return "listed";
    if (existing.error && existing.error.name !== "not_found") {
      console.error("waitlist lookup failed:", existing.error.name, existing.error.message);
      return "failed";
    }
    const created = await resend.contacts.create({
      email: data.email,
      properties: { organisation: data.organisation, role: data.role },
      segments: [{ id: segmentId }],
    });
    if (created.error) {
      console.error("waitlist contact not created:", created.error.name, created.error.message);
      return "failed";
    }
    return "added";
  } catch (cause) {
    console.error("waitlist request failed:", cause);
    return "failed";
  }
}

export async function submitWaitlist(formData: FormData): Promise<SubmissionState<WaitlistField>> {
  const values = readFields(formData, WAITLIST_FIELDS);
  const result = validate(waitlistSchema, values, WAITLIST_FIELDS);
  if (!result.ok) {
    return { status: "invalid", errors: result.errors, values: result.values };
  }
  if (isBot(formData)) {
    return { status: "sent", email: result.data.email };
  }

  const { resendApiKey, waitlistSegmentId } = readMailEnv();
  if (resendApiKey === null || waitlistSegmentId === null) {
    console.error("waitlist not saved: RESEND_API_KEY or RESEND_WAITLIST_SEGMENT_ID is not set");
    return { status: "failed", reason: "unconfigured", values };
  }

  const resend = new Resend(resendApiKey);
  const listing = await addToWaitlist(resend, waitlistSegmentId, result.data);
  if (listing === "listed") {
    return { status: "invalid", errors: { email: ALREADY_LISTED }, values };
  }
  if (listing === "failed") {
    return { status: "failed", reason: "delivery", values };
  }

  const confirmation = await send(resend, waitlistConfirmation(result.data));
  if (!confirmation.ok) {
    console.error("waitlist confirmation not sent to a listed address");
  }
  return { status: "sent", email: result.data.email };
}
