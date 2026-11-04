import { notFound } from "next/navigation";
import { markdownHeaders, pageMarkdown } from "@/lib/markdown";
import { source } from "@/lib/source";

export const revalidate = false;

export async function GET(_req: Request, context: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await context.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return new Response(await pageMarkdown(page), { headers: markdownHeaders });
}

export function generateStaticParams() {
  return source.generateParams();
}
