import { source } from "./source";

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;

const HEADING_ANCHOR = /^(#{1,6} .*?)\s*\[#[^\]]+\]\s*$/gm;

export function markdownUrl(page: DocsPage): string {
  return page.slugs.length === 0 ? "/docs.md" : `${page.url}.md`;
}

export async function pageMarkdown(page: DocsPage): Promise<string> {
  const body = (await page.data.getText("processed")).replace(HEADING_ANCHOR, "$1");
  const description = page.data.description ? `\n\n${page.data.description}` : "";
  return `# ${page.data.title}${description}\n\n${body.trim()}\n`;
}

export async function allPagesMarkdown(): Promise<string> {
  const pages = await Promise.all(source.getPages().map(pageMarkdown));
  return pages.join("\n---\n\n");
}

export const markdownHeaders = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=86400",
};
