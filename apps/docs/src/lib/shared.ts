export const appName = "Solva Docs";

export const gitConfig = {
  user: "jes-labs",
  repo: "solva",
  branch: "main",
};

// Canonical base URL for robots, sitemap, and metadata. Derived from the
// environment so the build runs anywhere with no fixed domain.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_DOCS_URL) return process.env.NEXT_PUBLIC_DOCS_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

// Sibling Solva origins: the marketing site and the web app. Set the env vars
// per environment; the production subdomains are the fallback. Links to these
// open in a new tab.
export const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinsolva.xyz";
export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.joinsolva.xyz";
