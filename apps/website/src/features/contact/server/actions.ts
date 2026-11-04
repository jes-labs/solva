"use server";

import { contactMessage, waitlistMessage } from "../lib/message";
import type { ContactField, WaitlistField } from "../lib/schema";
import { CONTACT_FIELDS, WAITLIST_FIELDS, contactSchema, waitlistSchema } from "../lib/schema";
import type { SubmissionState } from "../types";
import { submit } from "./submit";

export async function sendContact(
  _previous: SubmissionState<ContactField>,
  formData: FormData,
): Promise<SubmissionState<ContactField>> {
  return submit(formData, {
    schema: contactSchema,
    fields: CONTACT_FIELDS,
    compose: contactMessage,
  });
}

export async function joinWaitlist(
  _previous: SubmissionState<WaitlistField>,
  formData: FormData,
): Promise<SubmissionState<WaitlistField>> {
  return submit(formData, {
    schema: waitlistSchema,
    fields: WAITLIST_FIELDS,
    compose: waitlistMessage,
  });
}
