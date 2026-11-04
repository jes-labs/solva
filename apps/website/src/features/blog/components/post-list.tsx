import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Chapter } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";
import { formatPostDate } from "../lib/format-date";
import type { PostMeta } from "../types";
import { PostCover } from "./post-cover";

interface PostListProps {
  posts: readonly PostMeta[];
}

export function PostList({ posts }: PostListProps) {
  const [featured, ...rest] = [...posts].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <Chapter labelledBy="blog-list-title" padded={false}>
      <h2 id="blog-list-title" className="sr-only">
        All notes
      </h2>
      {featured ? (
        <Link
          href={`${routes.blog}/${featured.slug}`}
          className="group grid gap-8 border-b border-line px-5 py-12 transition-colors hover:bg-raised sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:px-12 lg:py-16"
        >
          <PostCover src={featured.cover} alt={featured.coverAlt} priority />
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-small text-sec">
                <span className="tick-lead font-medium">{featured.category}</span>
                <time dateTime={featured.date} className="num">
                  {formatPostDate(featured.date)}
                </time>
                <span className="num">{featured.readingMinutes} min</span>
              </p>
              <h3 className="mt-5 max-w-[20ch] font-display text-h1">{featured.title}</h3>
              <p className="mt-5 max-w-[40rem] text-lead text-sec">{featured.excerpt}</p>
            </div>
            <span className="inline-flex items-center gap-2 text-small font-medium">
              Read the note
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </Link>
      ) : null}
      <ol className="divide-y divide-line">
        {rest.map((post) => (
          <li key={post.slug}>
            <Link
              href={`${routes.blog}/${post.slug}`}
              className="group grid gap-6 px-5 py-8 transition-colors hover:bg-raised sm:px-8 lg:grid-cols-[12rem_1fr_14rem] lg:items-start lg:gap-10 lg:px-12"
            >
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-small text-sec lg:flex-col lg:gap-1">
                <time dateTime={post.date} className="num">
                  {formatPostDate(post.date)}
                </time>
                <span className="font-medium">{post.category}</span>
                <span className="num">{post.readingMinutes} min</span>
              </p>
              <div>
                <h3 className="font-display text-h2">{post.title}</h3>
                <p className="mt-3 max-w-[40rem] text-body text-sec">{post.excerpt}</p>
              </div>
              <PostCover
                src={post.cover}
                alt={post.coverAlt}
                sizes="(min-width: 1024px) 14rem, 100vw"
                className="hidden lg:block"
              />
            </Link>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}
