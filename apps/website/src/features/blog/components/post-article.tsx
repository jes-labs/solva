import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Provenance } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";
import { formatPostDate } from "../lib/format-date";
import type { Post, PostMeta } from "../types";
import { PostBody } from "./post-body";
import { PostCover } from "./post-cover";

interface PostArticleProps {
  post: Post;
  related: readonly PostMeta[];
}

export function PostArticle({ post, related }: PostArticleProps) {
  const { meta } = post;
  return (
    <article className="px-5 sm:px-8 lg:px-12">
      <header className="grid gap-10 border-b border-line py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-14 lg:py-20">
        <div>
          <Link
            href={routes.blog}
            className="inline-flex items-center gap-2 text-small font-medium text-sec hover:text-text"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Blog
          </Link>
          <p className="tick-lead mt-8 text-small font-medium text-sec">{meta.category}</p>
          <h1 className="mt-5 max-w-[20ch] font-display text-display">{meta.title}</h1>
          <p className="mt-6 max-w-[40rem] text-lead text-sec">{meta.excerpt}</p>
          <Provenance
            parts={[
              meta.author,
              <time key="date" dateTime={meta.date}>
                {formatPostDate(meta.date)}
              </time>,
              `${meta.readingMinutes} min read`,
            ]}
            className="mt-8"
          />
        </div>
        <figure>
          <PostCover src={meta.cover} alt={meta.coverAlt} priority />
          <figcaption className="mt-3 text-small text-sec">{meta.coverAlt}.</figcaption>
        </figure>
      </header>

      <div className="grid gap-12 py-14 lg:grid-cols-[1fr_minmax(0,42rem)_1fr] lg:py-20">
        <div className="hidden lg:block" />
        <div className="min-w-0">
          <PostBody source={post.body} />
        </div>
        <div className="hidden lg:block" />
      </div>

      {related.length > 0 ? (
        <aside aria-labelledby="related-title" className="border-t border-line py-14">
          <h2 id="related-title" className="tick-lead text-small font-medium text-sec">
            More notes
          </h2>
          <ol className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug} className="bg-bg">
                <Link
                  href={`${routes.blog}/${item.slug}`}
                  className="flex h-full flex-col gap-4 p-6 transition-colors hover:bg-raised"
                >
                  <span className="text-small text-sec num">{formatPostDate(item.date)}</span>
                  <span className="font-display text-h3">{item.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
    </article>
  );
}
