"use client";

import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/blog/posts";
import { cn } from "@/lib/cn";
import { PostCard } from "./post-card";

// The filterable index grid. The category chips drive a small piece of state and
// the grid re-renders to match; everything else on the page stays static. The
// post and category data is passed in from the server so this client component
// never imports the filesystem-backed content module.
export function BlogList({ posts, categories }: { posts: PostMeta[]; categories: string[] }) {
  const [active, setActive] = useState<string>("All");

  const visible = useMemo(
    () => (active === "All" ? posts : posts.filter((p) => p.category === active)),
    [active, posts],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {categories.map((category) => {
          const selected = category === active;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              aria-pressed={selected}
              className={cn(
                "rounded-pill border px-[15px] py-2 text-[13.5px] font-medium transition-colors",
                selected
                  ? "border-acc bg-acc text-on-acc"
                  : "border-hair bg-surface text-sec hover:border-hair-strong hover:text-fg",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}
