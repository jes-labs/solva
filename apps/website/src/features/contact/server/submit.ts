import type { z } from "zod";
import { isBot, readFields, validate } from "../lib/schema";
import type { OutgoingMessage, SubmissionState } from "../types";
import { deliver } from "./mailer";

interface Submission<S extends z.ZodType, F extends string> {
  schema: S;
  fields: readonly F[];
  compose: (data: z.output<S>) => OutgoingMessage;
}

export async function submit<S extends z.ZodType, F extends string>(
  formData: FormData,
  { schema, fields, compose }: Submission<S, F>,
): Promise<SubmissionState<F>> {
  const values = readFields(formData, fields);
  const result = validate(schema, values, fields);
  if (!result.ok) {
    return { status: "invalid", errors: result.errors, values: result.values };
  }

  const message = compose(result.data);
  if (isBot(formData)) {
    return { status: "sent", email: message.replyTo };
  }

  const delivery = await deliver(message);
  if (!delivery.ok) {
    return { status: "failed", reason: delivery.reason, values };
  }
  return { status: "sent", email: message.replyTo };
}
