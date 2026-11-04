import { allPagesMarkdown } from "@/lib/markdown";

export const revalidate = false;

export async function GET() {
  return new Response(await allPagesMarkdown(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
