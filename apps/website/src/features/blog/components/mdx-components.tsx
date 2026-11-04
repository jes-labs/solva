import type { ComponentProps } from "react";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

type Components = NonNullable<MDXRemoteProps["components"]>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function textOf(children: ComponentProps<"h2">["children"]): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map((child) => textOf(child)).join("");
  return "";
}

export const mdxComponents: Components = {
  h2: ({ children, ...props }) => (
    <h2
      id={slugify(textOf(children))}
      className="mt-14 scroll-mt-24 font-display text-h2 text-text"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-10 scroll-mt-24 font-display text-h3 text-text" {...props}>
      {children}
    </h3>
  ),
  p: (props) => <p className="mt-5 text-[1.0625rem] leading-[1.65] text-text" {...props} />,
  a: (props) => (
    <a
      className="text-link underline decoration-link-line underline-offset-4 hover:decoration-text"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="mt-5 flex list-disc flex-col gap-2 pl-6 text-[1.0625rem] leading-[1.65]"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-5 flex list-decimal flex-col gap-2 pl-6 text-[1.0625rem] leading-[1.65]"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-6 border-l-2 border-signal pl-5 text-lead text-sec [&>p]:mt-0 [&>p]:text-lead"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded-chip bg-raised px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />
  ),
  pre: (props) => (
    <pre
      className="mt-6 overflow-x-auto border border-line bg-raised p-5 font-mono text-small leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  hr: () => <hr className="my-12 border-line" />,
  strong: (props) => <strong className="font-semibold text-text" {...props} />,
  table: (props) => (
    <div className="mt-6 overflow-x-auto border border-line">
      <table className="w-full text-small" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-line px-3 py-2 text-left text-small font-medium text-sec"
      {...props}
    />
  ),
  td: (props) => <td className="border-b border-line px-3 py-2 align-top" {...props} />,
};
