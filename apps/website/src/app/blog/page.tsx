import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { routes } from "@/config/navigation";
import { PostList } from "@/features/blog";
import { listPosts } from "@/features/blog/server";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from the Solva team on reserve coverage: what a daily record proves, why no balance can be left out, and why the check lives on Stellar.",
  alternates: { canonical: routes.blog },
};

export default function BlogPage() {
  const posts = listPosts();
  return (
    <>
      <PageOpening
        label="Blog"
        title="Notes on reserves and coverage."
        lead="Short notes in plain language. What a coverage record proves, why no balance can be left out of it, and why the check lives on Stellar."
        provenance={[`${posts.length} notes`, "Written by the Solva team"]}
      />
      <PostList posts={posts} />
      <Close />
    </>
  );
}
