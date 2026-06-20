import { SolvencyStatus } from "@solva/shared-types";

// Mock orchestrator state for the institution dashboard while the real
// orchestrator REST and SDK are wired. The action signatures mirror the SDK so
// the swap is mechanical:
//
//   await solvaClient(tenant).connectSource(config);   // -> source id
//   await solvaClient(tenant).runProofCycle();         // -> proof id
//   await solvaClient(tenant).getLatestProof();        // -> Proof
//
// Here actions return the new entity and the client holds the accumulated state.

export type SourceType = "openbanking" | "onchain";

export interface Source {
  id: string;
  type: SourceType;
  label: string;
  // Plain-language detail line; never raw chain jargon.
  detail: string;
  connectedAt: number;
}

export interface CycleRecord {
  id: string;
  proofId: string;
  at: number;
  status: SolvencyStatus;
  reservesTotal: string;
  liabilitiesTotal: string;
  durationMs: number;
}

export interface DashboardData {
  sources: Source[];
  // Newest first; the head is the live status.
  cycles: CycleRecord[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}`;
}

// Seed sources and a short history so the dashboard opens with a live status.
// Proof ids line up with the public verify mock.
export function initialDashboard(): DashboardData {
  const now = Math.floor(Date.now() / 1000);
  return {
    sources: [
      {
        id: "src_fnb",
        type: "openbanking",
        label: "First National Bank",
        detail: "Open banking · client ••4821",
        connectedAt: now - 86400 * 9,
      },
      {
        id: "src_treasury",
        type: "onchain",
        label: "Treasury wallet",
        detail: "On-chain · GBQ…7XF",
        connectedAt: now - 86400 * 9,
      },
    ],
    cycles: [
      cycle("1042", now - 130, "12400000", "11980000", 1820),
      cycle("1041", now - 5400, "12310000", "11940000", 1760),
      cycle("1038", now - 92000, "12100000", "11890000", 1910),
    ],
  };
}

function cycle(
  proofId: string,
  at: number,
  reservesTotal: string,
  liabilitiesTotal: string,
  durationMs: number,
): CycleRecord {
  return {
    id: `cyc_${proofId}`,
    proofId,
    at,
    status: SolvencyStatus.Solvent,
    reservesTotal,
    liabilitiesTotal,
    durationMs,
  };
}

export async function connectSourceMock(config: {
  type: SourceType;
  label: string;
  settings: string;
}): Promise<Source> {
  await delay(550);
  const detail =
    config.type === "openbanking"
      ? `Open banking · ${config.settings || "client connected"}`
      : `On-chain · ${config.settings || "wallet connected"}`;
  return {
    id: newId("src"),
    type: config.type,
    label: config.label,
    detail,
    connectedAt: Math.floor(Date.now() / 1000),
  };
}

// Run a cycle: a small upward drift on both totals, staying solvent. Returns the
// new audit record the client prepends to the log.
export async function runCycleMock(previous?: CycleRecord): Promise<CycleRecord> {
  await delay(1600);
  const nextProofId = previous ? String(Number(previous.proofId) + 1) : "1043";
  const baseReserves = previous ? Number(previous.reservesTotal) : 12400000;
  const baseLiabilities = previous ? Number(previous.liabilitiesTotal) : 11980000;
  return cycle(
    nextProofId,
    Math.floor(Date.now() / 1000),
    String(baseReserves + 30000),
    String(baseLiabilities + 18000),
    1600 + (Number(nextProofId) % 5) * 40,
  );
}
