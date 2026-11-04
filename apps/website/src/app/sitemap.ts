import type { MetadataRoute } from "next";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { listPosts } from "@/features/blog/server";

function postPaths(): string[] {
  return listPosts()
    .map((post) => `${routes.blog}/${post.slug}`)
    .sort();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...Object.values(routes), ...postPaths()];
  return paths.map((path) => ({
    url: path === "/" ? site.url : `${site.url}${path}`,
    changeFrequency: path.startsWith(routes.blog) ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
