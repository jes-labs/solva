import { Resend } from "resend";
import { EMAIL_FROM, SUPPORT_EMAIL } from "./config";
import {
  contactConfirmation,
  contactNotification,
  demoConfirmation,
  demoNotification,
  newsletterConfirmation,
  newsletterNotification,
  type ContactSubmission,
  type DemoSubmission,
  type NewsletterSubmission,
} from "./templates";

// Lazily build the client so the key is read at request time, not at build, and
// a missing key fails loudly rather than sending nothing.
function client(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

// Send the user's confirmation first (this is the one that must land), then the
// internal heads-up as best-effort so a flaky notification never fails the form.
async function deliver(args: {
  to: string;
  replyTo: string;
  confirmation: { subject: string; html: string };
  notification: { subject: string; html: string };
}): Promise<void> {
  const resend = client();

  const confirmation = await resend.emails.send({
    from: EMAIL_FROM,
    to: args.to,
    replyTo: SUPPORT_EMAIL,
    subject: args.confirmation.subject,
    html: args.confirmation.html,
  });
  if (confirmation.error) {
    throw new Error(confirmation.error.message);
  }

  const notification = await resend.emails.send({
    from: EMAIL_FROM,
    to: SUPPORT_EMAIL,
    replyTo: args.replyTo,
    subject: args.notification.subject,
    html: args.notification.html,
  });
  if (notification.error) {
    console.error("internal notification failed:", notification.error);
  }
}

export async function sendDemoEmails(data: DemoSubmission): Promise<void> {
  await deliver({
    to: data.email,
    replyTo: data.email,
    confirmation: demoConfirmation(data),
    notification: demoNotification(data),
  });
}

export async function sendContactEmails(data: ContactSubmission): Promise<void> {
  await deliver({
    to: data.email,
    replyTo: data.email,
    confirmation: contactConfirmation(data),
    notification: contactNotification(data),
  });
}

export async function sendNewsletterEmails(data: NewsletterSubmission): Promise<void> {
  await deliver({
    to: data.email,
    replyTo: data.email,
    confirmation: newsletterConfirmation(),
    notification: newsletterNotification(data),
  });
}
