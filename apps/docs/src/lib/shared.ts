export const appName = "Solva Docs";

export const gitConfig = {
  user: "jes-labs",
  repo: "solva",
  branch: "main",
};

// Canonical base URL for robots, sitemap, and metadata. Set NEXT_PUBLIC_DOCS_URL
// at build time; production builds fall back to the live domain.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_DOCS_URL) return process.env.NEXT_PUBLIC_DOCS_URL;
  return process.env.NODE_ENV === "production"
    ? "https://docs.joinsolva.xyz"
    : "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

// Sibling Solva origins: the marketing site and the web app. Set the env vars
// per environment; the production subdomains are the fallback. Links to these
// open in a new tab.
export const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinsolva.xyz";
export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.joinsolva.xyz";
