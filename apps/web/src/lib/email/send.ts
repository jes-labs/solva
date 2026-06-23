import { Resend } from "resend";
import { EMAIL_FROM, SUPPORT_EMAIL } from "./config";
import {
  kybApproved,
  kybNotification,
  kybReceived,
  type KybSubmission,
} from "./templates";

function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

async function send(args: {
  to: string;
  replyTo: string;
  message: { subject: string; html: string };
}): Promise<void> {
  const { error } = await client().emails.send({
    from: EMAIL_FROM,
    to: args.to,
    replyTo: args.replyTo,
    subject: args.message.subject,
    html: args.message.html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

// On submission: confirm to the operator (must land) and notify the team
// (best-effort, so a flaky internal mail never fails the flow).
export async function sendKybSubmitted(data: KybSubmission): Promise<void> {
  await send({ to: data.contactEmail, replyTo: SUPPORT_EMAIL, message: kybReceived(data) });
  try {
    await send({ to: SUPPORT_EMAIL, replyTo: data.contactEmail, message: kybNotification(data) });
  } catch (error) {
    console.error("kyb notification failed:", error);
  }
}

export async function sendKybApproved(data: KybSubmission): Promise<void> {
  await send({ to: data.contactEmail, replyTo: SUPPORT_EMAIL, message: kybApproved(data) });
}
