import { formatUsdc, type DemoInstitution } from "@/lib/demo-institutions";

export { DEMO_INSTITUTIONS as INSTITUTIONS } from "@/lib/demo-institutions";

export const SCENARIOS = [
  {
    id: "solvent",
    label: "Covered",
    reserves: "16,000,000",
    note: "Reserves comfortably cover what is owed.",
  },
  {
    id: "near-breach",
    label: "Just covered",
    reserves: "9,500,000",
    note: "Reserves only just cover what is owed.",
  },
  {
    id: "insolvent",
    label: "Short",
    reserves: "4,500,000",
    note: "Reserves are below what is owed, so no proof can be made.",
  },
] as const;

export const STEPS = [
  {
    id: "registry",
    title: "Your registry entry",
    summary: "The institution's own contract on Stellar Testnet.",
  },
  {
    id: "connect",
    title: "Connect the reserve source",
    summary: "Open access to the accounts that hold the reserves.",
  },
  {
    id: "reserves",
    title: "Read the reserve balance",
    summary: "One balance per reserve account, signed by the custodian or read from Stellar.",
  },
  {
    id: "prove",
    title: "Prove coverage and publish",
    summary: "Prove that reserves cover the committed total, then publish it on Stellar.",
  },
  {
    id: "verify",
    title: "Check the published record",
    summary:
      "Read the record from the contract on Stellar and check that reserves cover what is owed.",
  },
  {
    id: "inclusion",
    title: "A holder checks they were counted",
    summary: "The contract confirms one holder's balance was counted.",
  },
] as const;

export type Institution = DemoInstitution;
export type Scenario = (typeof SCENARIOS)[number];
export type StepId = (typeof STEPS)[number]["id"];
export type StepStatus = "locked" | "ready" | "running" | "done" | "failed";
export type LogKind = "info" | "data" | "ok" | "warn";
export interface LogLine {
  kind: LogKind;
  text: string;
}

export const NEXT_STEP: Record<StepId, StepId | null> = {
  registry: "connect",
  connect: "reserves",
  reserves: "prove",
  prove: "verify",
  verify: "inclusion",
  inclusion: null,
};

export const DEMO_ID_HASH = "0000000000000000000000000000000000000000000000000000000000000001";

export interface ProofDTO {
  id?: string;
  chain_proof_id?: number;
  root_hash?: string;
  reserves_total?: string;
  liabilities_total?: string;
}

export interface ContractDTO {
  contract_id?: string;
  network?: string;
}

export function commas(value?: string | null): string {
  if (!value) return "0";
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function amount(value: string | undefined, institution: Institution): string {
  if (institution.reserves.kind === "onchain") return formatUsdc(value ?? "0");
  return commas(value);
}

export function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

export function initialStatus(): Record<StepId, StepStatus> {
  return {
    registry: "locked",
    connect: "locked",
    reserves: "locked",
    prove: "locked",
    verify: "locked",
    inclusion: "locked",
  };
}

export function emptyLogs(): Record<StepId, LogLine[]> {
  return { registry: [], connect: [], reserves: [], prove: [], verify: [], inclusion: [] };
}

export function completedSteps(status: Record<StepId, StepStatus>): number {
  return STEPS.filter((step) => status[step.id] === "done").length;
}

export function registryLines(institution: Institution, contract: ContractDTO): LogLine[] {
  return [
    { kind: "ok", text: `Registry entry found for ${institution.name}.` },
    { kind: "data", text: `contract  ${contract.contract_id ?? "unknown"}` },
    { kind: "data", text: `network   ${contract.network ?? "testnet"}` },
    { kind: "info", text: "Owner only. Nobody but the institution can publish to it." },
  ];
}

export function connectLines(response: {
  clientId?: string;
  code?: string;
  tokenType?: string;
  accessToken: string;
  expiresIn?: number;
}): LogLine[] {
  return [
    { kind: "info", text: `GET  /oauth/authorize?client_id=${response.clientId ?? ""}` },
    { kind: "data", text: `→ code ${response.code ?? ""}` },
    { kind: "info", text: "POST /oauth/token  (grant: authorization_code)" },
    {
      kind: "data",
      text: `→ ${response.tokenType ?? "Bearer"} ${truncate(response.accessToken, 28)}  (expires in ${response.expiresIn ?? 0}s)`,
    },
    { kind: "ok", text: "Connected to the reserve source." },
  ];
}

export function onchainConnectLines(institution: Institution): LogLine[] {
  if (institution.reserves.kind !== "onchain") return [];
  return [
    { kind: "info", text: `Reserves are held on Stellar Testnet in account` },
    { kind: "data", text: `  ${institution.reserves.account}` },
    { kind: "data", text: `  asset ${institution.reserves.code} (Circle)` },
    {
      kind: "ok",
      text: "No authorisation is needed: balances on Stellar are public.",
    },
  ];
}

export function onchainReservesLines(institution: Institution, balance: string): LogLine[] {
  if (institution.reserves.kind !== "onchain") return [];
  return [
    {
      kind: "info",
      text: `GET  horizon-testnet.stellar.org/accounts/${truncate(institution.reserves.account, 12)}`,
    },
    {
      kind: "data",
      text: `${institution.reserves.code} balance  ${formatUsdc(balance)}  (read from Stellar Testnet)`,
    },
    { kind: "ok", text: `Reserves R = ${formatUsdc(balance)} (read from the account on Stellar).` },
  ];
}

export function reservesLines(
  balances: readonly {
    source_id: string;
    balance: string;
    currency: string;
    signature: string;
  }[],
  total?: string,
): LogLine[] {
  const lines: LogLine[] = [];
  for (const item of balances) {
    lines.push({
      kind: "data",
      text: `${item.source_id.padEnd(12)} ${commas(item.balance)}`,
    });
    lines.push({
      kind: "info",
      text: `  sig ${truncate(item.signature, 40)}  ✓ signature verified`,
    });
  }
  lines.push({ kind: "ok", text: `Reserves R = ${commas(total)} (signed by the reserve source).` });
  return lines;
}

export function rejectedLines(): LogLine[] {
  return [
    { kind: "info", text: "Committing what is owed…" },
    { kind: "warn", text: "Refused: reserves are below what is owed (R < L)." },
    { kind: "warn", text: "No proof was made. A short position is never written as covered." },
  ];
}

export function publishedLines(proof: ProofDTO, institution: Institution): LogLine[] {
  return [
    { kind: "info", text: "Committing what is owed…" },
    { kind: "data", text: `commitment  0x${(proof.root_hash ?? "").replace(/^0x/, "")}` },
    { kind: "info", text: "Generating the zero-knowledge proof…" },
    {
      kind: "data",
      text: `proven totals  R=${amount(proof.reserves_total, institution)}  L=${amount(proof.liabilities_total, institution)}`,
    },
    { kind: "info", text: "publish_proof  →  signed by the registry owner" },
    { kind: "ok", text: `Published on Stellar as proof #${proof.chain_proof_id ?? "?"}.` },
  ];
}

export interface ChainRecord {
  reserves: string;
  liabilities: string;
}

export function verifyLines(
  record: ChainRecord,
  institution: Institution,
): { covers: boolean; lines: LogLine[] } {
  const covers = BigInt(record.reserves) >= BigInt(record.liabilities);
  return {
    covers,
    lines: [
      { kind: "info", text: "get_latest_proof  →  read from the registry on Stellar" },
      {
        kind: "data",
        text: `R=${amount(record.reserves, institution)}  L=${amount(record.liabilities, institution)}`,
      },
      covers
        ? { kind: "ok", text: "R ≥ L on Stellar. The published record covers what is owed." }
        : { kind: "warn", text: "R < L on Stellar. Reserves do not cover what is owed." },
    ],
  };
}

export function inclusionLines(
  response: { balance?: string; pathLength?: number; chainProofId?: string; onChain: boolean },
  institution: Institution,
): LogLine[] {
  const lines: LogLine[] = [
    { kind: "info", text: `Holder cust-001  (id hash 0x${DEMO_ID_HASH.slice(0, 8)}…)` },
    { kind: "data", text: `committed balance  ${amount(response.balance, institution)}` },
    {
      kind: "data",
      text: `inclusion path     ${response.pathLength ?? 0} steps to the commitment`,
    },
  ];
  if (!response.onChain) {
    lines.push({
      kind: "warn",
      text: "verify_inclusion  →  false. The contract did not confirm this holder.",
    });
    return lines;
  }
  lines.push(
    { kind: "info", text: "verify_inclusion  →  true, on the registry on Stellar" },
    {
      kind: "ok",
      text: `Counted in proof #${response.chainProofId ?? "?"}, confirmed by the contract. No customer is named.`,
    },
  );
  return lines;
}
