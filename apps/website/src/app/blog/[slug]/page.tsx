import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { Reveal } from "@/components/motion";
import { AuthorAvatar } from "@/components/blog/author-avatar";
import { PostCard } from "@/components/blog/post-card";
import { mdxComponents } from "@/components/blog/mdx";
import { formatPostDate } from "@/lib/blog/format";
import { getPost, getPostSlugs, getRelatedPosts } from "@/lib/blog/posts";
import { slugify } from "@/lib/slug";

const sectionX = "mx-auto max-w-site px-7";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };
  const { meta } = post;
  const url = `/blog/${slug}`;
  const cover = { url: meta.cover, width: 1264, height: 848, alt: meta.coverAlt };
  return {
    title: meta.title,
    description: meta.excerpt,
    authors: [{ name: meta.author }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.excerpt,
      url,
      publishedTime: meta.date,
      authors: [meta.author],
      images: [cover],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.excerpt,
      images: [meta.cover],
    },
  };
}

// Pull the level-two headings straight from the MDX source for the table of
// contents. slugify matches the ids the heading components emit, so the links
// land on the right section.
function tableOfContents(source: string): { id: string; text: string }[] {
  const matches = source.match(/^##\s+(.+)$/gm) ?? [];
  return matches.map((line) => {
    const text = line.replace(/^##\s+/, "").trim();
    return { id: slugify(text), text };
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { meta, content } = post;
  const toc = tableOfContents(content);
  const related = getRelatedPosts(slug);
  const { content: rendered } = await compileMDX({
    source: content,
    components: mdxComponents,
    options: { parseFrontmatter: true },
  });

  return (
    <main className="relative z-[1]">
      <article className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-14 px-7 pb-10 pt-36 lg:grid-cols-[1fr_220px]">
        <div className="max-w-[680px]">
          <Link
            href="/blog"
            className="mb-6 inline-block font-mono text-[13px] text-acc-text transition-opacity hover:opacity-80"
          >
            ← All posts
          </Link>

          <div className="mb-[18px] flex items-center gap-2.5 font-mono text-xs text-sec">
            <span className="text-acc-text">{meta.category}</span>
            <span>·</span>
            <span>{meta.readingTime} read</span>
            <span>·</span>
            <span>{formatPostDate(meta.date)}</span>
          </div>

          <h1 className="font-display text-[clamp(32px,4vw,50px)] font-bold leading-[1.05] tracking-[-0.035em]">
            {meta.title}
          </h1>

          <div className="mb-8 mt-6 flex items-center gap-3 border-b border-hair pb-7">
            <AuthorAvatar name={meta.author} size={40} />
            <div>
              <div className="text-[14.5px] font-semibold text-fg">{meta.author}</div>
              <div className="text-[13px] text-sec">{meta.authorRole}</div>
            </div>
          </div>

          {/* Cover */}
          <div className="relative mb-9 aspect-[3/2] overflow-hidden rounded-card border border-hair">
            <Image
              src={meta.cover}
              alt={meta.coverAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 680px"
              className="object-cover"
              priority
            />
          </div>

          {/* Body */}
          <div>{rendered}</div>

          {/* Share */}
          <div className="mt-10 flex items-center gap-3 border-t border-hair pt-7">
            <span className="font-mono text-xs text-sec">Share</span>
            {["in", "𝕏", "↗"].map((mark) => (
              <span
                key={mark}
                className="flex size-[34px] items-center justify-center rounded-lg border border-hair font-mono text-[13px] text-sec"
                aria-hidden="true"
              >
                {mark}
              </span>
            ))}
          </div>
        </div>

        {/* Table of contents */}
        {toc.length > 0 && (
          <aside className="sticky top-[130px] hidden lg:block">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
              On this page
            </p>
            <nav className="flex flex-col gap-3 text-sm">
              {toc.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="text-sec transition-colors hover:text-fg"
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className={`${sectionX} pb-24 pt-6`}>
          <div className="mx-auto max-w-[1080px]">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">
                Related posts
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost) => (
                <Reveal key={relatedPost.slug}>
                  <PostCard post={relatedPost} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
