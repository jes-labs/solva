import matter from "gray-matter";
import { z } from "zod";
import { readingMinutes } from "../lib/reading-time";
import type { Post, PostMeta } from "../types";
import { postSources } from "./sources";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const frontmatterSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  author: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cover: z.string().startsWith("/images/"),
  coverAlt: z.string().min(1),
  featured: z.boolean().default(false),
});

export function parsePost(slug: string, raw: string): Post {
  if (!SLUG.test(slug)) throw new Error(`Invalid post slug: ${slug}`);
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in ${slug}: ${parsed.error.message}`);
  }
  return { meta: { slug, ...parsed.data, readingMinutes: readingMinutes(content) }, body: content };
}

type Sources = Readonly<Record<string, string>>;

export function getPost(slug: string, sources: Sources = postSources): Post | null {
  if (!SLUG.test(slug)) return null;
  const raw = sources[slug];
  return raw === undefined ? null : parsePost(slug, raw);
}

export function listPosts(sources: Sources = postSources): PostMeta[] {
  return Object.entries(sources)
    .map(([slug, raw]) => parsePost(slug, raw).meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}
