"use client";

import { useState } from "react";

// Functional share row for a blog post. LinkedIn and X open their share intents
// in a new tab; the third button copies the post URL to the clipboard with a
// brief confirmation. The URL is absolute so the share targets resolve it.
const SOLVA_X_HANDLE = "joinsolva";

const frame =
  "flex size-[34px] items-center justify-center rounded-lg border border-hair text-sec transition-colors hover:border-hair-strong hover:text-fg";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const x = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(
    url,
  )}&via=${SOLVA_X_HANDLE}`;

  async function copy() {
    try {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement("textarea");
        field.value = url;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        document.body.removeChild(field);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Copy can be blocked; leave the state unchanged so nothing misreports.
    }
  }

  return (
    <div className="mt-10 flex items-center gap-3 border-t border-hair pt-7">
      <span className="font-mono text-xs text-sec">Share</span>

      <a href={linkedIn} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className={frame}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.67H5.67V18h2.67V9.67zM7 5.92a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zm11 6.46c0-2.27-1.21-3.33-2.83-3.33-1.3 0-1.88.72-2.2 1.22V9.67h-2.64V18h2.66v-4.62c0-.25.02-.5.09-.67.2-.49.65-1 1.4-1 .98 0 1.38.75 1.38 1.85V18H18v-5.62z" />
        </svg>
      </a>

      <a href={x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className={frame}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
        </svg>
      </a>

      <button type="button" onClick={copy} aria-label={copied ? "Link copied" : "Copy link"} className={frame}>
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6M10.5 6.5l1-1a4 4 0 0 1 6 6l-1 1M13.5 17.5l-1 1a4 4 0 0 1-6-6l1-1" />
          </svg>
        )}
      </button>
    </div>
  );
}
