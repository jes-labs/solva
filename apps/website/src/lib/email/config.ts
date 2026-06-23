// Email configuration. None of these are secrets (the API key lives in
// RESEND_API_KEY and is read server-side only). Sending goes out from the
// verified send.joinsolva.xyz subdomain; replies route to the Zoho mailbox.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinsolva.xyz";
export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.joinsolva.xyz";

// Friendly From on the sending subdomain, and the monitored human inbox that
// replies land in.
export const EMAIL_FROM = "Solva <hello@send.joinsolva.xyz>";
export const SUPPORT_EMAIL = "support@joinsolva.xyz";

// The branded email banner (dark, 600x200 at 1x), hosted on the marketing site.
export const BANNER_URL = `${SITE_URL}/email/solva-email-banner-600x200-2x.png`;

// Brand palette, light treatment for inboxes (chartreuse fill, deep-olive links).
export const palette = {
  ink: "#0a0c06",
  text: "#0b0d07",
  sec: "#51564b",
  page: "#eceee3",
  card: "#ffffff",
  hair: "#e3e4db",
  accent: "#cfe524",
  accentDeep: "#6e7a12",
  offwhite: "#f5f6ee",
  onAccent: "#0a0c06",
} as const;

// Font stacks. The brand fonts load in clients that support web fonts (Apple
// Mail, iOS); everywhere else falls back cleanly to Arial.
export const fonts = {
  display: "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif",
  body: "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
} as const;
