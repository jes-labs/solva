// KYB onboarding emails for the console, as table-based HTML with the shared
// branded banner. Copy reads like a real reviewer wrote it, not a bot.

import { APP_URL, BANNER_URL, SITE_URL, SUPPORT_EMAIL, fonts, palette } from "./config";

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

export interface KybSubmission {
  legalName: string;
  contactName: string;
  contactEmail: string;
  type?: string;
  institution?: string;
  jurisdiction?: string;
  registrationNumber?: string;
}

// Sent to the operator the moment they submit their institution for review.
export function kybReceived(data: KybSubmission): { subject: string; html: string } {
  const first = firstNameOf(data.contactName);
  const company = esc(data.legalName);
  const body =
    paragraph(`We have received the onboarding details for <strong style="color:${palette.text};">${company}</strong>, and a Solva reviewer is verifying them now.`) +
    paragraph("Here is what happens next:") +
    bulletList([
      "A reviewer checks your registration and compliance contact. This is a person, not an automated step.",
      "Once you are approved, you will get an email and full access to your console.",
      "We never ask for customer data, and nothing sensitive is needed to get verified.",
    ]) +
    paragraph("If a detail changes or you need to update something, just reply to this email.") +
    paragraph('<span style="display:block;margin-top:18px;">Talk soon,<br>The Solva team</span>');
  return {
    subject: "We received your Solva application",
    html: shell({
      preheader: "Your institution is in review. We will email you the moment it is approved.",
      heading: `Thanks, ${first}. Your application is in review.`,
      body,
    }),
  };
}

// Sent to the operator when their institution is approved.
export function kybApproved(data: KybSubmission): { subject: string; html: string } {
  const first = firstNameOf(data.contactName);
  const company = esc(data.legalName);
  const body =
    paragraph(`Good news. <strong style="color:${palette.text};">${company}</strong> is verified, and your Solva console is ready.`) +
    paragraph("You can now connect reserve sources, run a proof cycle, and publish a proof to Stellar. Sign in with your passkey to get started.") +
    button("Open your console", APP_URL) +
    paragraph('<span style="display:block;margin-top:18px;">Welcome aboard,<br>The Solva team</span>');
  return {
    subject: "You are approved. Welcome to Solva.",
    html: shell({
      preheader: "Your console is ready. Sign in to run your first proof.",
      heading: `You are approved, ${first}.`,
      body,
    }),
  };
}

// Internal heads-up for the team on a new KYB submission.
export function kybNotification(data: KybSubmission): { subject: string; html: string } {
  const body =
    paragraph("A new institution just submitted for KYB review.") +
    detailsTable([
      { label: "Legal name", value: data.legalName },
      { label: "Institution", value: data.institution ?? data.type ?? "" },
      { label: "Jurisdiction", value: data.jurisdiction ?? "" },
      { label: "Reg. number", value: data.registrationNumber ?? "" },
      { label: "Contact", value: data.contactName },
      { label: "Email", value: data.contactEmail },
    ]) +
    paragraph("Reply to this email to reach the compliance contact directly.");
  return {
    subject: `New KYB submission: ${data.legalName}`,
    html: shell({ preheader: `${data.legalName} (${data.contactName})`, heading: "New KYB submission", body }),
  };
}
