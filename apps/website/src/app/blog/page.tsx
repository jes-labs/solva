import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { AuthorAvatar } from "@/components/blog/author-avatar";
import { BlogList } from "@/components/blog/blog-list";
import { Newsletter } from "@/components/blog/newsletter";
import { formatPostDate } from "@/lib/blog/format";
import { getAllPosts, getCategories, getFeaturedPost } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on proving solvency: zero-knowledge proofs, reserves, and the gap between an attestation and the truth.",
};

const sectionX = "mx-auto max-w-site px-7";

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = getFeaturedPost(posts);
  const categories = getCategories(posts);
  const gridPosts = posts.filter((post) => post.slug !== featured?.slug);

  return (
    <main className="relative z-[1]">
      {/* Hero */}
      <header className={`${sectionX} pb-7 pt-40`}>
        <Reveal>
          <Eyebrow className="mb-4 text-acc-text">Blog</Eyebrow>
          <h1 className="h1 mb-7 max-w-[720px]">
            Notes on proving <span className="font-serif italic text-acc-text">solvency</span>.
          </h1>
        </Reveal>
      </header>

      {/* Featured post */}
      {featured && (
        <section className={`${sectionX} py-5`}>
          <Reveal>
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid grid-cols-1 overflow-hidden rounded-panel border border-hair bg-surface transition-colors hover:border-hair-strong lg:grid-cols-[1fr_1fr]"
            >
              <div className="order-2 flex flex-col justify-center p-10 lg:order-1">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="rounded-[5px] bg-acc px-2.5 py-[3px] font-mono text-[11px] uppercase tracking-[0.1em] text-on-acc">
                    Featured
                  </span>
                  <span className="font-mono text-xs text-sec">
                    {featured.category} · {featured.readingTime}
                  </span>
                </div>
                <h2 className="font-display text-[clamp(24px,2.6vw,34px)] font-semibold leading-tight tracking-tight">
                  {featured.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-sec">{featured.excerpt}</p>
                <div className="mt-5 flex items-center gap-2.5 text-[13.5px]">
                  <AuthorAvatar name={featured.author} size={30} />
                  <span className="text-fg">{featured.author}</span>
                  <span className="text-sec">· {formatPostDate(featured.date)}</span>
                </div>
              </div>
              <div className="relative order-1 aspect-[3/2] overflow-hidden lg:order-2 lg:aspect-auto lg:min-h-[300px]">
                <Image
                  src={featured.cover}
                  alt={featured.coverAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
              </div>
            </Link>
          </Reveal>
        </section>
      )}

      {/* Filterable grid */}
      <section className={`${sectionX} py-5`}>
        <Reveal>
          <BlogList posts={gridPosts} categories={categories} />
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className={`${sectionX} pb-24 pt-8`}>
        <Reveal>
          <Newsletter />
        </Reveal>
      </section>
    </main>
  );
}
