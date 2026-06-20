import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/lib/blog/posts";
import { formatPostDate } from "@/lib/blog/format";

// A post in the index grid: cover image, category and reading time, title,
// excerpt, byline. The whole card links to the post.
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-hair bg-surface transition-colors hover:border-hair-strong"
    >
      <div className="relative aspect-[3/2] overflow-hidden border-b border-hair">
        <Image
          src={post.cover}
          alt={post.coverAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2.5 font-mono text-[11.5px] text-acc-text">
          {post.category} · {post.readingTime}
        </div>
        <h3 className="font-display text-[19px] font-semibold leading-tight tracking-tight">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-snug text-sec">{post.excerpt}</p>
        <div className="mt-auto pt-[18px] text-[13px] text-sec">
          {post.author} · {formatPostDate(post.date)}
        </div>
      </div>
    </Link>
  );
}
