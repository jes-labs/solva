import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "./mdx-components";

interface PostBodyProps {
  source: string;
}

export function PostBody({ source }: PostBodyProps) {
  return (
    <div className="[&>*:first-child]:mt-0">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
