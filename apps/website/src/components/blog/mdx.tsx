import { CodeBlock } from "@/components/ui";
import { slugify } from "@/lib/slug";

type WithChildren = { children?: React.ReactNode };
type AnchorProps = { href?: string; children?: React.ReactNode };

// Pull the plain text out of a heading's children so it can be slugified into an
// anchor id. Posts keep headings to plain text, so this stays simple.
function headingText(children: React.ReactNode): string {
  return typeof children === "string" ? children : String(children ?? "");
}

// A fenced code block in MDX arrives as <pre><code class="language-x">. Unwrap it
// and hand the raw source to the brand CodeBlock so highlighting and the copy
// button match the rest of the site.
function Pre({ children }: { children?: React.ReactNode }) {
  const codeEl = children as React.ReactElement<{ className?: string; children?: string }> | undefined;
  const className = codeEl?.props?.className ?? "";
  const language = className.replace(/language-/, "") || "text";
  const code = typeof codeEl?.props?.children === "string" ? codeEl.props.children : "";
  return (
    <div className="my-6">
      <CodeBlock code={code} language={language} />
    </div>
  );
}

// The element map for blog MDX. Tailwind is applied per element rather than via a
// prose plugin so the typography matches the brand tokens exactly.
export const mdxComponents = {
  h2: ({ children }: WithChildren) => (
    <h2
      id={slugify(headingText(children))}
      className="mb-3 mt-10 scroll-mt-28 font-display text-[26px] font-semibold tracking-tight"
    >
      {children}
    </h2>
  ),
  h3: ({ children }: WithChildren) => (
    <h3 className="mb-2 mt-8 font-display text-[20px] font-semibold tracking-tight">{children}</h3>
  ),
  p: ({ children }: WithChildren) => (
    <p className="mb-5 text-[16.5px] leading-relaxed text-sec">{children}</p>
  ),
  a: ({ href, children }: AnchorProps) => (
    <a href={href} className="text-acc-text underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }: WithChildren) => (
    <ul className="mb-5 ml-5 flex list-disc flex-col gap-2 text-[16.5px] leading-relaxed text-sec marker:text-hair-strong">
      {children}
    </ul>
  ),
  ol: ({ children }: WithChildren) => (
    <ol className="mb-5 ml-5 flex list-decimal flex-col gap-2 text-[16.5px] leading-relaxed text-sec marker:text-sec">
      {children}
    </ol>
  ),
  li: ({ children }: WithChildren) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }: WithChildren) => (
    <blockquote className="my-6 border-l-2 border-acc pl-5 text-[17px] italic leading-relaxed text-fg">
      {children}
    </blockquote>
  ),
  strong: ({ children }: WithChildren) => <strong className="font-semibold text-fg">{children}</strong>,
  em: ({ children }: WithChildren) => <em className="italic">{children}</em>,
  code: ({ children }: WithChildren) => (
    <code className="rounded-[5px] border border-hair bg-panel px-1.5 py-0.5 font-mono text-[13.5px] text-fg">
      {children}
    </code>
  ),
  hr: () => <hr className="my-10 border-hair" />,
  pre: Pre,
};
