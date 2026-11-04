import "server-only";
import { Resend } from "resend";
import { site } from "@/config/site";
import type { FailureReason, OutgoingMessage } from "../types";
import { readMailEnv } from "./env";

const MAIL_FROM = "Solva <hello@send.joinsolva.xyz>";

export type DeliveryResult = { ok: true } | { ok: false; reason: FailureReason };

export async function deliver(message: OutgoingMessage): Promise<DeliveryResult> {
  const { resendApiKey } = readMailEnv();
  if (resendApiKey === null) {
    console.error("contact email not sent: RESEND_API_KEY is not set");
    return { ok: false, reason: "unconfigured" };
  }

  try {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: site.contactEmail,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
    });
    if (error) {
      console.error("contact email rejected by Resend:", error.name, error.message);
      return { ok: false, reason: "delivery" };
    }
    return { ok: true };
  } catch (cause) {
    console.error("contact email failed:", cause);
    return { ok: false, reason: "delivery" };
  }
}
