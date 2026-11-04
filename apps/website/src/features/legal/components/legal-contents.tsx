"use client";

import { cn } from "@/lib/utils";
import { useActiveSection } from "../hooks/use-active-section";
import type { ContentsEntry } from "../lib/contents";

interface LegalContentsProps {
  entries: readonly ContentsEntry[];
}

export function LegalContents({ entries }: LegalContentsProps) {
  const active = useActiveSection(entries.map((entry) => entry.id));
  return (
    <nav aria-labelledby="contents-title" className="lg:sticky lg:top-20">
      <h2 id="contents-title" className="text-small font-medium text-sec">
        On this page
      </h2>
      <ol className="mt-3 border-t border-line sm:columns-2 sm:gap-8 lg:columns-1">
        {entries.map((entry) => {
          const current = entry.id === active;
          return (
            <li key={entry.id} className="break-inside-avoid border-b border-line">
              <a
                href={`#${entry.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "relative block py-2.5 pl-4 text-small transition-colors",
                  current ? "text-text" : "text-sec hover:text-text",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-2.5 bottom-2.5 left-0 w-0.5",
                    current ? "bg-signal" : "bg-transparent",
                  )}
                />
                {entry.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
