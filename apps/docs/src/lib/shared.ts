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
