import type { OutgoingMessage } from "../types";
import type { ContactSubmission, WaitlistSubmission } from "./schema";

export function contactMessage(data: ContactSubmission): OutgoingMessage {
  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Organisation: ${data.organisation}`,
    `Role: ${data.role}`,
    `Asset or product: ${data.asset === "" ? "Not given" : data.asset}`,
    "",
    data.message,
  ];
  return {
    subject: `Contact: ${data.organisation} (${data.role})`,
    text: lines.join("\n"),
    replyTo: data.email,
  };
}

export function waitlistMessage(data: WaitlistSubmission): OutgoingMessage {
  const lines = [
    "A request to join the Solva console waitlist.",
    "",
    `Email: ${data.email}`,
    `Organisation: ${data.organisation}`,
    `Role: ${data.role}`,
  ];
  return {
    subject: `Waitlist request: ${data.organisation} (${data.role})`,
    text: lines.join("\n"),
    replyTo: data.email,
  };
}
