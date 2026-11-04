"use server";

import { contactMessage } from "../lib/message";
import type { ContactField, WaitlistField } from "../lib/schema";
import { CONTACT_FIELDS, contactSchema } from "../lib/schema";
import type { SubmissionState } from "../types";
import { submit } from "./submit";
import { submitWaitlist } from "./waitlist";

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
  return submitWaitlist(formData);
}
