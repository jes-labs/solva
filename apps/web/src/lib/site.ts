// Site config and the canonical base URL for resolving relative metadata, same
// pattern as the marketing site. The base is derived from the environment so the
// build runs anywhere with no fixed domain.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const SITE_NAME = "Solva";

export const SITE_DESCRIPTION =
  "The Solva console: prove reserves meet liabilities, connect sources, and publish proofs on Stellar.";
