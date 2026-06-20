"use client";

import { useState } from "react";
import { Highlight } from "prism-react-renderer";
import { cn } from "@/lib/cn";
import { CopyIcon, CheckIcon } from "./icons";
import { solvaCodeTheme } from "./code-theme";

interface CodeBlockProps {
  code: string;
  // Shown as a small label in the top bar, for example "prove.ts".
  filename?: string;
  // Prism language id. Defaults to tsx.
  language?: string;
  className?: string;
}

// A syntax-highlighted code panel with an editor-style header and a copy button.
// Highlighting is tokenized by Prism and colored with the brand code theme.
export function CodeBlock({ code, filename, language = "tsx", className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked. Leave the state unchanged.
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-[10px] border border-hair bg-panel", className)}>
      <div className="flex items-center justify-between border-b border-hair px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-[11px] w-[11px] rounded-full bg-hair-strong" aria-hidden="true" />
          <span className="h-[11px] w-[11px] rounded-full bg-hair-strong" aria-hidden="true" />
          <span className="h-[11px] w-[11px] rounded-full bg-hair-strong" aria-hidden="true" />
          {filename && <span className="ml-2 font-mono text-xs text-sec">{filename}</span>}
        </div>
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
      <Highlight code={code.trim()} language={language} theme={solvaCodeTheme}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"
            style={style}
          >
            {tokens.map((line, lineIndex) => (
              <div key={lineIndex} {...getLineProps({ line })}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
