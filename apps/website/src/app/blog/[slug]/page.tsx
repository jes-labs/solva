import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Close } from "@/components/layout/close";
import { routes } from "@/config/navigation";
import { PostArticle } from "@/features/blog";
import { getPost, listPosts } from "@/features/blog/server";

export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((post) => ({ slug: post.slug }));
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Note not found" };
  const { meta } = post;
  const url = `${routes.blog}/${slug}`;
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
      images: [{ url: meta.cover, width: 1600, height: 1067, alt: meta.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.excerpt,
      images: [meta.cover],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const related = listPosts()
    .filter((item) => item.slug !== slug)
    .slice(0, 3);
  return (
    <>
      <PostArticle post={post} related={related} />
      <Close />
    </>
  );
}
