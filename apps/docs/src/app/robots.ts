import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/shared";

// Open to every crawler. The docs are public on purpose; the more LLMs index
// them, the more accurate "how do I use Solva" answers ship.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
