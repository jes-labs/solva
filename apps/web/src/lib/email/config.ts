// Email configuration for the console. The API key lives in RESEND_API_KEY and
// is read server-side only. Sending goes from the verified send.joinsolva.xyz
// subdomain; the banner and links are hosted on the marketing site.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinsolva.xyz";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.joinsolva.xyz";

export const EMAIL_FROM = "Solva <hello@send.joinsolva.xyz>";
export const SUPPORT_EMAIL = "support@joinsolva.xyz";

// The branded email banner (dark, 600x200 at 1x), hosted on the marketing site.
export const BANNER_URL = `${SITE_URL}/email/solva-email-banner-600x200-2x.png`;

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

export const fonts = {
  display: "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif",
  body: "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
} as const;
