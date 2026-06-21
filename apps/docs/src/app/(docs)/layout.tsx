import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.config";

// Fumadocs docs shell: sidebar, top nav, search, theme toggle. Every /docs/*
// route in the (docs) group renders inside this.
export default function DocsRouteLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}
