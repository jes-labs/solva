// Site-wide constants and the canonical base URL used to resolve relative
// metadata (Open Graph and Twitter images, canonicals). Set NEXT_PUBLIC_SITE_URL
// at build time; production builds fall back to the live domain, dev to
// localhost.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return process.env.NODE_ENV === "production" ? "https://joinsolva.xyz" : "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

// The product app lives at its own origin. "Launch app" and the public verify and
// inclusion tools point here. Set NEXT_PUBLIC_APP_URL per environment; the
// production subdomain is the fallback.
export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.joinsolva.xyz";

// The docs site lives at its own origin too. Set NEXT_PUBLIC_DOCS_URL per
// environment; the production subdomain is the fallback.
export const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.joinsolva.xyz";

export const SITE_NAME = "Solva";

export const SITE_DESCRIPTION =
  "Zero-knowledge proof of reserves infrastructure. Continuously prove reserves meet liabilities, verified on Stellar, without exposing customer data.";
