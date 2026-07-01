"use client";

import Link from "next/link";
import { StatusPill, type StatusTone } from "@solva/ui";
import { AnomalySeverity, detectAnomalies, type Proof } from "@solva/shared-types";
import type { CycleRecord } from "@/lib/mock/dashboard";
import { formatRelativeTime } from "@/lib/format";

const SEVERITY: Record<AnomalySeverity, { tone: StatusTone; label: string }> = {
  [AnomalySeverity.Critical]: { tone: "breach", label: "Critical" },
  [AnomalySeverity.Warning]: { tone: "warning", label: "Warning" },
  [AnomalySeverity.Info]: { tone: "unknown", label: "Info" },
};

// The detector reads only id, publishedAt, and the two totals; the rest are
// placeholders so the mapping stays a plain Proof.
function toProofs(cycles: CycleRecord[]): Proof[] {
  return cycles.map((c) => ({
    id: c.proofId,
    proof: "",
    publishedAt: c.at,
    publicInputs: {
      reservesTotal: c.reservesTotal,
      liabilitiesTotal: c.liabilitiesTotal,
      rootHash: "",
      prevReserves: "",
    },
  }));
}

export function AnomalyPanel({ cycles }: { cycles: CycleRecord[] }) {
  const flags = detectAnomalies(toProofs(cycles)).sort((a, b) => b.detectedAt - a.detectedAt);

  return (
    <section className="rounded-card border border-hair bg-surface">
      <div className="border-b border-hair px-6 py-4">
        <h2 className="font-display text-[16px] font-semibold tracking-tight">Anomaly watch</h2>
        <p className="mt-0.5 text-[13px] text-sec">
          Early warnings from the proof history, before a breach.
        </p>
      </div>

      {flags.length === 0 ? (
        <div className="px-6 py-6 text-[13.5px] text-sec">
          No anomalies. Reserves, liabilities, and cycle timing are within range.
        </div>
      ) : (
        <ul>
          {flags.map((flag) => {
            const s = SEVERITY[flag.severity];
            return (
              <li
                key={`${flag.kind}-${flag.proofId}`}
                className="flex items-start justify-between gap-3 border-b border-hair px-6 py-3.5 last:border-b-0"
              >
                <div>
                  <p className="text-[14px] text-fg">{flag.message}</p>
                  <Link
                    href={`/verify?id=${flag.proofId}`}
                    className="text-[12.5px] text-sec hover:text-acc-text"
                  >
                    Proof #{flag.proofId} · {formatRelativeTime(flag.detectedAt)}
                  </Link>
                </div>
                <StatusPill tone={s.tone} label={s.label} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
