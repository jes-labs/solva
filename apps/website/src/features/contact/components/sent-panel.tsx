import type { ReactNode } from "react";
import { Provenance } from "@/components/ui/ledger";

interface SentPanelProps {
  title: string;
  children: ReactNode;
  provenance?: readonly string[];
}

const TEAM_REPLIES = ["Sent", "A person on the team replies"] as const;

export function SentPanel({ title, children, provenance = TEAM_REPLIES }: SentPanelProps) {
  return (
    <div role="status" className="flex min-h-80 flex-col justify-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center border border-covered bg-covered-tint text-covered"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="mt-6 font-display text-h2">{title}</p>
      <div className="mt-3 max-w-sm text-body text-text">{children}</div>
      <Provenance parts={provenance} className="mt-8" />
    </div>
  );
}
