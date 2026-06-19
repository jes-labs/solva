import Link from "next/link";
import { blogSource } from "@/lib/source";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMDXComponents } from "@/components/mdx";

interface PageParams {
  params: Promise<{ slug?: string[] }>;
}

// The optional catch-all owns both the blog index (no slug) and each post.
// Next 16 forbids a sibling /blog/page.tsx next to this route.
export default async function BlogPage(props: PageParams) {
  const { slug } = await props.params;

  if (!slug || slug.length === 0) {
    return <BlogIndex />;
  }

  const page = blogSource.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <article className="prose">
      <h1>{page.data.title}</h1>
      {page.data.description ? (
        <p className="text-fd-muted-foreground">{page.data.description}</p>
      ) : null}
      <MDX components={getMDXComponents()} />
    </article>
  );
}

function BlogIndex() {
  const posts = blogSource.getPages();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Blog</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.url}>
            <Link href={post.url} className="font-medium underline">
              {post.data.title}
            </Link>
            {post.data.description ? (
              <p className="text-fd-muted-foreground">{post.data.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function generateStaticParams() {
  return blogSource.generateParams();
}

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const { slug } = await props.params;
  if (!slug || slug.length === 0) {
    return { title: "Blog" };
  }

  const page = blogSource.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
