"use client";

import { useState } from "react";
import { cn } from "@solva/ui";

// Copies a value to the clipboard and briefly confirms. Used for proof ids and
// hashes, where people need the exact string.
export function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; leave the state unchanged.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? "Copy"}
      className={cn(
        "inline-flex items-center gap-1.5 text-sec transition-colors hover:text-fg",
        className,
      )}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="font-mono text-[11px]">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
