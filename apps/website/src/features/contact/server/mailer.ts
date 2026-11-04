import "server-only";
import { Resend } from "resend";
import type { FailureReason, OutgoingMessage } from "../types";
import { readMailEnv } from "./env";

const MAIL_FROM = "Solva <hello@send.joinsolva.xyz>";

export type DeliveryResult = { ok: true } | { ok: false; reason: FailureReason };

export async function send(resend: Resend, message: OutgoingMessage): Promise<DeliveryResult> {
  try {
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
    });
    if (error) {
      console.error("email rejected by Resend:", error.name, error.message);
      return { ok: false, reason: "delivery" };
    }
    return { ok: true };
  } catch (cause) {
    console.error("email failed:", cause);
    return { ok: false, reason: "delivery" };
  }
}

export async function deliver(message: OutgoingMessage): Promise<DeliveryResult> {
  const { resendApiKey } = readMailEnv();
  if (resendApiKey === null) {
    console.error("email not sent: RESEND_API_KEY is not set");
    return { ok: false, reason: "unconfigured" };
  }
  return send(new Resend(resendApiKey), message);
}
