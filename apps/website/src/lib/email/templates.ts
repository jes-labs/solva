// Email templates as table-based HTML with inline styles, which is what inboxes
// actually render. One shared shell (branded banner + footer) wraps every
// message; the copy below is written to read like a real person, not a bot.

import { BANNER_URL, DOCS_URL, SITE_URL, SUPPORT_EMAIL, fonts, palette } from "./config";

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const firstNameOf = (name: string) => esc(name.trim().split(/\s+/)[0] ?? "there");

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${fonts.body};font-size:15px;line-height:1.65;color:${palette.sec};">${html}</p>`;
}

function bulletList(items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:0 0 10px;vertical-align:top;"><span style="color:${palette.accentDeep};font-weight:700;">&bull;</span></td>` +
        `<td style="padding:0 0 10px 10px;font-family:${fonts.body};font-size:15px;line-height:1.6;color:${palette.sec};">${item}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 18px;">${rows}</table>`;
}

function button(label: string, href: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:10px;background:${palette.accent};">` +
    `<a href="${href}" style="display:inline-block;padding:13px 26px;font-family:${fonts.body};font-size:15px;font-weight:700;color:${palette.onAccent};text-decoration:none;border-radius:10px;">${esc(label)}</a>` +
    `</td></tr></table>`
  );
}

function detailsTable(rows: { label: string; value: string }[]): string {
  const body = rows
    .filter((row) => row.value && row.value.trim())
    .map(
      (row) =>
        `<tr>` +
        `<td style="padding:9px 14px;border-bottom:1px solid ${palette.hair};font-family:${fonts.mono};font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${palette.sec};white-space:nowrap;vertical-align:top;">${esc(row.label)}</td>` +
        `<td style="padding:9px 14px;border-bottom:1px solid ${palette.hair};font-family:${fonts.body};font-size:14px;color:${palette.text};">${esc(row.value).replace(/\n/g, "<br>")}</td>` +
        `</tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${palette.hair};border-radius:10px;border-collapse:separate;overflow:hidden;margin:4px 0 8px;">${body}</table>`;
}

// The branded shell: hidden preheader, dark banner with the mark + wordmark, an
// accent rule, the message card, and a footer with the support address.
function shell(options: { preheader: string; heading: string; body: string }): string {
  const { preheader, heading, body } = options;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Hanken+Grotesk:wght@400;500;600&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
<style>@media only screen and (max-width:600px){.sv-outer{padding-left:0!important;padding-right:0!important;}.sv-card{border-radius:0!important;}.sv-pad{padding-left:24px!important;padding-right:24px!important;}}</style>
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${palette.page};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:${palette.page};">${esc(preheader)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${palette.page};">
<tr><td align="center" class="sv-outer" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" class="sv-card" style="width:100%;max-width:600px;background:${palette.card};border-radius:16px;overflow:hidden;">
  <tr><td style="font-size:0;line-height:0;background:${palette.ink};">
    <img src="${BANNER_URL}" width="600" height="200" alt="Solva. Prove solvency. Privately." style="display:block;width:100%;max-width:600px;height:auto;border:0;">
  </td></tr>
  <tr><td style="height:3px;background:${palette.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td class="sv-pad" style="padding:34px 32px 8px;">
    <h1 style="margin:0 0 18px;font-family:${fonts.display};font-size:23px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${palette.text};">${heading}</h1>
    ${body}
  </td></tr>
  <tr><td class="sv-pad" style="padding:22px 32px 30px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid ${palette.hair};">
      <tr><td style="padding-top:18px;font-family:${fonts.body};font-size:12.5px;line-height:1.6;color:${palette.sec};">
        <strong style="color:${palette.text};">Solva</strong> &middot; Zero-knowledge proof of reserves<br>
        Questions? Reach a real person at <a href="mailto:${SUPPORT_EMAIL}" style="color:${palette.accentDeep};text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a><br>
        <a href="${SITE_URL}" style="color:${palette.sec};text-decoration:underline;">joinsolva.xyz</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export interface DemoSubmission {
  name: string;
  email: string;
  company: string;
  role?: string;
  type?: string;
  message?: string;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterSubmission {
  email: string;
}

// Confirmation sent to the person who requested a demo.
export function demoConfirmation(data: DemoSubmission): { subject: string; html: string } {
  const first = firstNameOf(data.name);
  const body =
    paragraph("We just got your request to see Solva, and it is with our team now.") +
    paragraph("Here is what happens next:") +
    bulletList([
      "Someone will email you within one business day to lock in a time.",
      "The walkthrough runs about 30 minutes. You will watch a real proof go from reserves to an on-chain verification, start to finish.",
      "Nothing to prepare, and we never ask for customer data.",
    ]) +
    paragraph(
      "If you want to add any context before then, just reply to this email. It comes straight to a real person on our side.",
    ) +
    button("See how Solva works", `${SITE_URL}/how-it-works`) +
    paragraph('<span style="display:block;margin-top:18px;">Talk soon,<br>The Solva team</span>');
  return {
    subject: "Your Solva demo request is in",
    html: shell({
      preheader: "We have got it. Someone from our team will reach out within one business day.",
      heading: `Thanks, ${first}. Your demo request is in.`,
      body,
    }),
  };
}

// Internal heads-up so a lead is never lost while there is no database yet.
export function demoNotification(data: DemoSubmission): { subject: string; html: string } {
  const body =
    paragraph("A new demo request just came in through the website.") +
    detailsTable([
      { label: "Name", value: data.name },
      { label: "Work email", value: data.email },
      { label: "Company", value: data.company },
      { label: "Role", value: data.role ?? "" },
      { label: "Institution", value: data.type ?? "" },
      { label: "Message", value: data.message ?? "" },
    ]) +
    paragraph("Reply to this email to respond to them directly.");
  return {
    subject: `New demo request: ${data.company || data.name}`,
    html: shell({ preheader: `${data.name} from ${data.company}`, heading: "New demo request", body }),
  };
}

// Confirmation sent to the person who used the contact form.
export function contactConfirmation(data: ContactSubmission): { subject: string; html: string } {
  const first = firstNameOf(data.name);
  const body =
    paragraph("Your message just landed with our team, and we are on it.") +
    paragraph(
      "We usually reply within one business day. If your note is time-sensitive or about a specific deadline, say so in a reply and we will move it up the queue.",
    ) +
    paragraph("While you wait, a couple of things worth a look:") +
    bulletList([
      `<a href="${SITE_URL}/how-it-works" style="color:${palette.accentDeep};text-decoration:none;font-weight:600;">How Solva works</a>`,
      `<a href="${DOCS_URL}" style="color:${palette.accentDeep};text-decoration:none;font-weight:600;">The documentation</a>`,
    ]) +
    paragraph("You can reply to this email any time. A real person reads this inbox.") +
    button("Read the docs", DOCS_URL) +
    paragraph('<span style="display:block;margin-top:18px;">Best,<br>The Solva team</span>');
  return {
    subject: "Thanks for reaching out to Solva",
    html: shell({
      preheader: "Got your message. We usually reply within one business day.",
      heading: `Thanks for reaching out, ${first}.`,
      body,
    }),
  };
}

// Internal heads-up for a contact-form message.
export function contactNotification(data: ContactSubmission): { subject: string; html: string } {
  const body =
    paragraph("A new message came in through the contact form.") +
    detailsTable([
      { label: "Name", value: data.name },
      { label: "Email", value: data.email },
      { label: "Subject", value: data.subject },
      { label: "Message", value: data.message },
    ]) +
    paragraph("Reply to this email to respond to them directly.");
  return {
    subject: `New contact message: ${data.subject || data.name}`,
    html: shell({ preheader: `${data.name}: ${data.subject}`, heading: "New contact message", body }),
  };
}

// Welcome note for a new newsletter subscriber.
export function newsletterConfirmation(): { subject: string; html: string } {
  const body =
    paragraph(
      "Thanks for subscribing. You will hear from us when we publish something worth your time: new writing on zero-knowledge proofs, proof of reserves, and what it takes to prove solvency on-chain.",
    ) +
    paragraph(
      "We keep it occasional and technical. No fluff, no spam. If it ever stops being useful, every email has an unsubscribe link.",
    ) +
    button("Read the latest", `${SITE_URL}/blog`) +
    paragraph('<span style="display:block;margin-top:18px;">The Solva team</span>');
  return {
    subject: "You are on the Solva list",
    html: shell({
      preheader: "Occasional, technical, no fluff.",
      heading: "You are in.",
      body,
    }),
  };
}

// Internal heads-up for a new subscriber.
export function newsletterNotification(data: NewsletterSubmission): { subject: string; html: string } {
  const body =
    paragraph("A new subscriber just signed up through the newsletter form.") +
    detailsTable([{ label: "Email", value: data.email }]);
  return {
    subject: `New newsletter subscriber: ${data.email}`,
    html: shell({ preheader: data.email, heading: "New newsletter subscriber", body }),
  };
}
