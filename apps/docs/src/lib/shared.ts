export const appName = "Solva Docs";

export const gitConfig = {
  user: "jes-labs",
  repo: "solva",
  branch: "main",
  contentPath: "apps/docs/content/docs",
};

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_DOCS_URL) return process.env.NEXT_PUBLIC_DOCS_URL;
  return process.env.NODE_ENV === "production"
    ? "https://docs.joinsolva.xyz"
    : "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinsolva.xyz";
