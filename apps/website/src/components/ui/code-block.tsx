"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CopyIcon, CheckIcon } from "./icons";

interface CodeBlockProps {
  code: string;
  // Shown as a small label in the top bar, for example "prove.ts".
  filename?: string;
  className?: string;
}

// A mono code panel with a copy button. The copy state resets after a moment.
export function CodeBlock({ code, filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked. Nothing to do but leave the state unchanged.
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-[10px] border border-hair bg-panel", className)}>
      <div className="flex items-center justify-between border-b border-hair px-4 py-2.5">
        <span className="font-mono text-xs text-sec">{filename ?? "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-sec transition-colors hover:text-fg"
          aria-label="Copy code"
        >
          {copied ? <CheckIcon size={13} className="text-acc-text" /> : <CopyIcon size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}
