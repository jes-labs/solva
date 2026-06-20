import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Posts are authored as MDX files in content/blog. This module reads them off
// the filesystem at build time and exposes their frontmatter as typed metadata.
// Everything here runs server side only; pages pass the results to client
// components as props rather than importing this file into the browser bundle.

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  // ISO date, for example 2026-06-16.
  date: string;
  readingTime: string;
  cover: string;
  coverAlt: string;
  featured: boolean;
}

// The order categories appear in the index filter. Only the ones actually used
// by a post are shown, so this can list more than currently exist.
const CATEGORY_ORDER = ["Concepts", "Engineering", "Regulation", "Company"];

function readFile(slug: string): { meta: PostMeta; content: string } {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  const meta: PostMeta = {
    slug,
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    category: String(data.category ?? ""),
    author: String(data.author ?? ""),
    authorRole: String(data.authorRole ?? ""),
    date: String(data.date ?? ""),
    readingTime: String(data.readingTime ?? ""),
    cover: String(data.cover ?? ""),
    coverAlt: String(data.coverAlt ?? ""),
    featured: Boolean(data.featured ?? false),
  };
  return { meta, content };
}

export function getPostSlugs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.replace(/\.mdx$/, ""));
}

// All posts, newest first.
export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => readFile(slug).meta)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// One post with its raw MDX body, or null when the slug does not resolve.
export function getPost(slug: string): { meta: PostMeta; content: string } | null {
  try {
    return readFile(slug);
  } catch {
    return null;
  }
}

export function getFeaturedPost(posts: PostMeta[]): PostMeta | undefined {
  return posts.find((post) => post.featured) ?? posts[0];
}

// Up to `limit` other posts, preferring the same category, for the detail footer.
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const all = getAllPosts();
  const current = all.find((post) => post.slug === slug);
  const others = all.filter((post) => post.slug !== slug);
  if (!current) return others.slice(0, limit);
  const sameCategory = others.filter((post) => post.category === current.category);
  const rest = others.filter((post) => post.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

// "All" plus the categories actually present, in the fixed display order.
export function getCategories(posts: PostMeta[]): string[] {
  const present = new Set(posts.map((post) => post.category));
  return ["All", ...CATEGORY_ORDER.filter((category) => present.has(category))];
}
