import Link from "next/link";
import { Button, StatusPill, type StatusTone } from "@solva/ui";
import { SolvencyStatus } from "@solva/shared-types";
import type { CycleRecord } from "@/lib/mock/dashboard";
import { formatAmount, formatBpsPercent, formatRelativeTime, marginBps } from "@/lib/format";

export type Schedule = "manual" | "hourly" | "daily";

const SCHEDULE_OPTIONS: { value: Schedule; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Every day" },
];

// Plain-language verdict, never chain jargon.
const HEADLINE: Record<SolvencyStatus, string> = {
  [SolvencyStatus.Solvent]: "Reserves cover deposits",
  [SolvencyStatus.Breach]: "Reserves do not cover deposits",
  [SolvencyStatus.Unknown]: "No proof published yet",
};

const TONE: Record<SolvencyStatus, StatusTone> = {
  [SolvencyStatus.Solvent]: "solvent",
  [SolvencyStatus.Breach]: "breach",
  [SolvencyStatus.Unknown]: "unknown",
};

const TONE_LABEL: Record<SolvencyStatus, string> = {
  [SolvencyStatus.Solvent]: "Solvent",
  [SolvencyStatus.Breach]: "Breach",
  [SolvencyStatus.Unknown]: "Unknown",
};

// The dashboard centerpiece: the live solvency status, the run-cycle action, and
// the proving schedule.
export function StatusHero({
  latest,
  running,
  schedule,
  canRun = true,
  onRunCycle,
  onScheduleChange,
}: {
  latest: CycleRecord | undefined;
  running: boolean;
  schedule: Schedule;
  // RBAC: hide the run + schedule controls for roles that cannot publish.
  canRun?: boolean;
  onRunCycle: () => void;
  onScheduleChange: (value: Schedule) => void;
}) {
  const status = latest?.status ?? SolvencyStatus.Unknown;
  const bps = latest ? marginBps(latest.reservesTotal, latest.liabilitiesTotal) : 0;

  return (
    <section className="rounded-card border border-hair bg-surface p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <StatusPill tone={TONE[status]} label={TONE_LABEL[status]} />
          <h2 className="mt-3 font-display text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
            {HEADLINE[status]}
          </h2>
          <p className="mt-1.5 text-sm text-sec">
            {latest ? (
              <>
                Proof #{latest.proofId} · verified on Stellar {formatRelativeTime(latest.at)} ·{" "}
                <Link href={`/verify?id=${latest.proofId}`} className="text-acc-text hover:underline">
                  view
                </Link>
              </>
            ) : (
              "Run a cycle to publish your first proof."
            )}
          </p>
        </div>

        {canRun && (
        <div className="flex flex-col items-stretch gap-2.5 sm:items-end">
          <Button onClick={onRunCycle} disabled={running} className="sm:w-auto">
            {running ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Running cycle
              </span>
            ) : (
              "Run proof cycle"
            )}
          </Button>
          <label className="flex items-center gap-2 text-[13px] text-sec">
            Schedule
            <select
              value={schedule}
              onChange={(e) => onScheduleChange(e.target.value as Schedule)}
              className="rounded-btn border border-hair bg-bg px-2.5 py-1.5 text-[13px] text-fg focus:border-acc-text"
            >
              {SCHEDULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        )}
      </div>

      {/* Figures */}
      <div className="mt-6 grid gap-px overflow-hidden rounded-btn border border-hair bg-hair sm:grid-cols-3">
        <Figure label="Reserves (R)" value={latest ? formatAmount(latest.reservesTotal) : "—"} />
        <Figure label="Liabilities (L)" value={latest ? formatAmount(latest.liabilitiesTotal) : "—"} />
        <Figure
          label="Margin"
          value={latest ? `+${formatBpsPercent(bps)}` : "—"}
          hint={latest ? `${bps} bps` : undefined}
          accent={status === SolvencyStatus.Solvent}
        />
      </div>

      {schedule !== "manual" && (
        <p className="mt-3 text-[12.5px] text-sec">
          Continuous proving is on. A cycle runs automatically{" "}
          {schedule === "hourly" ? "every hour" : "every day"}.
        </p>
      )}
    </section>
  );
}

function Figure({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <div className="eyebrow text-sec">{label}</div>
      <div
        className={`mt-2 font-display text-[clamp(20px,3vw,26px)] font-bold tabular-nums tracking-tight ${
          accent ? "text-acc-text" : ""
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 font-mono text-[11px] text-sec">{hint}</div>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
