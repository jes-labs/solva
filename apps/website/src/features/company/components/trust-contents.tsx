"use client";

import { cn } from "@/lib/utils";
import { useActiveSection } from "../hooks/use-active-section";

export interface TrustEntry {
  id: string;
  title: string;
}

interface TrustContentsProps {
  entries: readonly TrustEntry[];
}

export function TrustContents({ entries }: TrustContentsProps) {
  const ids = entries.map((entry) => entry.id);
  const activeId = useActiveSection(ids);
  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-20">
      <p className="text-small font-medium text-sec">On this page</p>
      <ol className="mt-3 border-t border-line">
        {entries.map((entry) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id} className="border-b border-line">
              <a
                href={`#${entry.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "relative block py-2.5 pl-4 text-small transition-colors",
                  active ? "text-text" : "text-sec hover:text-text",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-2.5 bottom-2.5 left-0 w-0.5",
                    active ? "bg-signal" : "bg-transparent",
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
