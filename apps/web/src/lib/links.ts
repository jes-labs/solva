// The sibling Solva origins: the marketing site and the docs. Set the env vars
// per environment; the production subdomains are the fallback. Links to these
// always open in a new tab (see ExternalLink).
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinsolva.xyz";
export const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.joinsolva.xyz";
