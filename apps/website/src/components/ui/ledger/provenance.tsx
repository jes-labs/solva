import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProvenanceProps {
  parts: readonly ReactNode[];
  className?: string;
}

export function Provenance({ parts, className }: ProvenanceProps) {
  return (
    <p className={cn("font-mono text-micro tracking-[0.06em] text-faint uppercase num", className)}>
      {parts.map((part, index) => (
        <span key={index} className="inline-block">
          {index > 0 ? (
            <span aria-hidden="true" className="mx-2 text-line-strong">
              ·
            </span>
          ) : null}
          {part}
        </span>
      ))}
    </p>
  );
}

export function ledgerLabel(ledger: number): string {
  return `Ledger ${ledger.toLocaleString("en-US")}`;
}
