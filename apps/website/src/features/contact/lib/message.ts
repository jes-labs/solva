import { site } from "@/config/site";
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
    to: site.contactEmail,
    subject: `Contact: ${data.organisation} (${data.role})`,
    text: lines.join("\n"),
    replyTo: data.email,
  };
}

export function waitlistConfirmation(data: WaitlistSubmission): OutgoingMessage {
  const lines = [
    "Hello,",
    "",
    `You are on the Solva waitlist for ${data.organisation}.`,
    "",
    "Publishing a coverage record opens to pilot partners first. We will write to this address when publishing opens to your organisation.",
    "",
    "If you want to talk about a pilot sooner, reply to this email.",
    "",
    "The Solva team",
    site.url,
  ];
  return {
    to: data.email,
    subject: "You are on the Solva waitlist",
    text: lines.join("\n"),
    replyTo: site.contactEmail,
  };
}
