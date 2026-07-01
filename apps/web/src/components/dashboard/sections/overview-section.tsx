"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { StatusPill, type StatusTone } from "@solva/ui";
import { SolvencyStatus } from "@solva/shared-types";
import { StatusHero } from "@/components/dashboard/status-hero";
import { Walkthrough } from "@/components/dashboard/walkthrough";
import { AnomalyPanel } from "@/components/dashboard/anomaly-panel";

// recharts is heavy; load it only when the overview mounts, behind a skeleton.
const MarginTrend = dynamic(
  () => import("@/components/dashboard/margin-trend").then((m) => m.MarginTrend),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-card border border-hair bg-surface p-6">
        <div className="h-4 w-28 animate-pulse rounded bg-panel" />
        <div className="mt-5 h-[200px] animate-pulse rounded-btn bg-panel" />
      </section>
    ),
  },
);
import { useDashboard } from "@/lib/dashboard/provider";
import { useSession } from "@/lib/session/provider";
import { can } from "@/lib/session/permissions";
import { formatRelativeTime } from "@/lib/format";

const TONE: Record<SolvencyStatus, StatusTone> = {
  [SolvencyStatus.Solvent]: "solvent",
  [SolvencyStatus.Breach]: "breach",
  [SolvencyStatus.Unknown]: "unknown",
};

export function OverviewSection() {
  const { data, running, schedule, runCycle, setSchedule } = useDashboard();
  const { session } = useSession();
  const canRun = session ? can(session.role, "cycle.run") : false;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Walkthrough />
      </div>
      <div id="tour-status">
        <StatusHero
          latest={data.cycles[0]}
          running={running}
          schedule={schedule}
          canRun={canRun}
          onRunCycle={() => void runCycle()}
          onScheduleChange={setSchedule}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <MarginTrend cycles={data.cycles} />

        <section className="rounded-card border border-hair bg-surface">
          <div className="border-b border-hair px-6 py-4">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">Recent cycles</h2>
            <p className="mt-0.5 text-[13px] text-sec">The latest published proofs.</p>
          </div>
          <ul>
            {data.cycles.slice(0, 4).map((cycle) => (
              <li
                key={cycle.id}
                className="flex items-center justify-between gap-3 border-b border-hair px-6 py-3.5 last:border-b-0"
              >
                <div>
                  <Link
                    href={`/verify?id=${cycle.proofId}`}
                    className="text-[14px] font-medium text-fg hover:text-acc-text"
                  >
                    Proof #{cycle.proofId}
                  </Link>
                  <div className="text-[12.5px] text-sec">{formatRelativeTime(cycle.at)}</div>
                </div>
                <StatusPill
                  tone={TONE[cycle.status]}
                  label={cycle.status === SolvencyStatus.Solvent ? "Solvent" : cycle.status}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <AnomalyPanel cycles={data.cycles} />
    </div>
  );
}
