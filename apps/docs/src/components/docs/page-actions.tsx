"use client";

import { useState } from "react";

// Per-page actions: copy the processed markdown to the clipboard (for pasting
// into an LLM) or open it raw. Both read the .md export route.
export function PageActions({ markdownUrl }: { markdownUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const res = await fetch(markdownUrl);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard or fetch can fail; leave state unchanged.
    }
  }

  return (
    <div className="flex items-center gap-2 text-[13px]">
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-fd-border px-2.5 py-1 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        {copied ? "Copied" : "Copy as Markdown"}
      </button>
      <a
        href={markdownUrl}
        className="rounded-md border border-fd-border px-2.5 py-1 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        View as Markdown
      </a>
    </div>
  );
}
