// Site config and the canonical base URL for resolving relative metadata, same
// pattern as the marketing site.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return process.env.NODE_ENV === "production"
    ? "https://app.joinsolva.xyz"
    : "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const SITE_NAME = "Solva";

export const SITE_DESCRIPTION =
  "The Solva console: prove reserves meet liabilities, connect sources, and publish proofs on Stellar.";
