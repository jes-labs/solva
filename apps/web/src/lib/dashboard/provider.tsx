"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
  connectSourceMock,
  initialDashboard,
  runCycleMock,
  type DashboardData,
  type SourceType,
} from "@/lib/mock/dashboard";
import { buildReport, downloadReport } from "@/lib/report";
import { useSession } from "@/lib/session/provider";

export type Schedule = "manual" | "hourly" | "daily";

interface DashboardContextValue {
  data: DashboardData;
  running: boolean;
  schedule: Schedule;
  connectSource: (config: { type: SourceType; label: string; settings: string }) => Promise<void>;
  runCycle: () => Promise<void>;
  exportReport: () => void;
  setSchedule: (value: Schedule) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// Holds the dashboard's mock state so every section route shares one source of
// truth. Actions mirror @solva/sdk-ts; swapping to the SDK is mechanical.
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const [data, setData] = useState<DashboardData>(() => initialDashboard());
  const [running, setRunning] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>("manual");

  const connectSource = useCallback<DashboardContextValue["connectSource"]>(async (config) => {
    const source = await connectSourceMock(config);
    setData((prev) => ({ ...prev, sources: [...prev.sources, source] }));
  }, []);

  const runCycle = useCallback<DashboardContextValue["runCycle"]>(async () => {
    setRunning(true);
    const record = await runCycleMock(data.cycles[0]);
    setData((prev) => ({ ...prev, cycles: [record, ...prev.cycles] }));
    setRunning(false);
  }, [data.cycles]);

  const exportReport = useCallback<DashboardContextValue["exportReport"]>(() => {
    const name = session?.institution.legalName || "Solva institution";
    downloadReport(`solva-report-${session?.institution.id ?? "demo"}.txt`, buildReport(name, data));
  }, [data, session]);

  const value: DashboardContextValue = {
    data,
    running,
    schedule,
    connectSource,
    runCycle,
    exportReport,
    setSchedule,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
