import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPostSlugs } from "@/lib/blog/posts";

// The marketing routes that currently have a page. Pages still to be built (about,
// pricing add-ons, legal, status, whitepaper, demo) are added here as they land,
// so the sitemap never lists a route that 404s.
const staticPaths = [
  "/",
  "/how-it-works",
  "/solutions",
  "/developers",
  "/security",
  "/solvency-oracle",
  "/pricing",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const postEntries = getPostSlugs().map((slug) => ({
    url: new URL(`/blog/${slug}`, siteUrl).toString(),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...postEntries];
}
