import { Button, StatusPill, type StatusTone } from "@solva/ui";
import type { CycleRecord } from "@/lib/mock/dashboard";
import { SolvencyStatus } from "@solva/shared-types";
import { formatAmount, formatRelativeTime, formatTimestamp } from "@/lib/format";

const TONE: Record<SolvencyStatus, StatusTone> = {
  [SolvencyStatus.Solvent]: "solvent",
  [SolvencyStatus.Breach]: "breach",
  [SolvencyStatus.Unknown]: "unknown",
};

// The audit log: every cycle, newest first, with a report export. Each row reads
// as plain language; the proof id is the only identifier shown.
export function AuditLog({
  cycles,
  onExport,
  canExport = true,
}: {
  cycles: CycleRecord[];
  onExport: () => void;
  // RBAC: only roles that may export see the action.
  canExport?: boolean;
}) {
  return (
    <section className="rounded-card border border-hair bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-hair px-6 py-4">
        <div>
          <h2 className="font-display text-[17px] font-semibold tracking-tight">Audit log</h2>
          <p className="mt-0.5 text-[13px] text-sec">Every cycle, with a regulator-ready export.</p>
        </div>
        {canExport && (
          <Button variant="ghost" onClick={onExport} disabled={cycles.length === 0}>
            Export report
          </Button>
        )}
      </div>

      {cycles.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-sec">No cycles yet.</p>
      ) : (
        <ul>
          {cycles.map((record) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-hair px-6 py-3.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-fg">
                  Proof #{record.proofId}
                </div>
                <div className="text-[12.5px] text-sec" title={formatTimestamp(record.at)}>
                  {formatRelativeTime(record.at)} · {(record.durationMs / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="hidden text-right font-mono text-[12.5px] text-sec sm:block">
                <div>R {formatAmount(record.reservesTotal)}</div>
                <div>L {formatAmount(record.liabilitiesTotal)}</div>
              </div>
              <StatusPill
                tone={TONE[record.status]}
                label={record.status === SolvencyStatus.Solvent ? "Solvent" : record.status}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
