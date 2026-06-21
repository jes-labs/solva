import { notFound } from "next/navigation";
import { source } from "@/lib/source";

// Per-page markdown export. A beforeFiles rewrite maps /docs/<slug>.md here, so
// the docs page catch-all never shadows it. Returns the processed MDX as plain
// text for "Copy as Markdown" and LLM consumption.
type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const params = context?.params ? await context.params : undefined;
  const page = source.getPage(params?.slug);
  if (!page) notFound();

  const markdown = await page.data.getText("processed");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    },
  });
}
