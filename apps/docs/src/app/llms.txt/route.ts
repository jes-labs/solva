import { llms } from "fumadocs-core/source/llms";
import { source } from "@/lib/source";

export const revalidate = false;

const PAGE_LINK = /\]\((\/docs[^)\s]*)\)/g;

export function GET() {
  const index = llms(source)
    .index()
    .replace(
      PAGE_LINK,
      (_match, url: string) => `](${url === "/docs" ? "/docs.md" : `${url}.md`})`,
    );
  return new Response(index, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
