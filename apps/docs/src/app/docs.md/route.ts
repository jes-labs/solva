import { notFound } from "next/navigation";
import { source } from "@/lib/source";

// Raw-markdown counterpart for the docs index. The [[...slug]].md route resolves
// the empty slug to /docs/.md, a different URL than the /docs.md we want here.
export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const page = source.getPage([]);
  if (!page) notFound();

  const markdown = await page.data.getText("processed");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    },
  });
}
