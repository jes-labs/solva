// Site-wide constants and the canonical base URL used to resolve relative
// metadata (Open Graph and Twitter images, canonicals). We have no fixed domain
// yet, so the base is derived from the environment: an explicit override wins,
// then Vercel's provided URLs, then localhost for development. Because every
// asset is referenced with a root-relative path like "/blog/cover.png", the same
// reference resolves correctly whatever host ends up serving the site.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // The stable production domain Vercel assigns to the project.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // The per-deployment URL, present on preview builds.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
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
