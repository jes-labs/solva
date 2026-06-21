"use client";

import { AuditLog } from "@/components/dashboard/audit-log";
import { useDashboard } from "@/lib/dashboard/provider";
import { useSession } from "@/lib/session/provider";
import { can } from "@/lib/session/permissions";

export function ActivitySection() {
  const { data, exportReport } = useDashboard();
  const { session } = useSession();
  const canExport = session ? can(session.role, "report.export") : false;

  return (
    <div className="space-y-6">
      <p className="text-[14px] leading-relaxed text-sec">
        Every proof cycle is recorded here. Export a regulator-ready summary that reflects on-chain
        proofs without exposing any customer balance.
      </p>
      <AuditLog cycles={data.cycles} onExport={exportReport} canExport={canExport} />
    </div>
  );
}
