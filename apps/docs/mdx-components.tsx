import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

// The MDX component map for the docs corpus. Every MDX file picks these up
// without an explicit import.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
