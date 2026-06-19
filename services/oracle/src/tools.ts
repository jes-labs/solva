// MCP tool definitions for the solvency oracle. Each tool is a thin adapter:
// it validates input, calls the domain logic, and shapes the MCP response. The
// domain logic lives in solvency.ts and anomaly.ts.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Proof, AnomalyFlag, SolvencyResult } from "@solva/shared-types";
import { getSolvency, type SolvencyDeps } from "./solvency.js";
import { detectAnomalies, type AnomalyThresholds, DEFAULT_THRESHOLDS } from "./anomaly.js";

// Input shapes. registerTool takes a raw zod shape, not a wrapped z.object.
const institutionInput = {
  institution_id: z.string().min(1).describe("The institution (tenant) identifier."),
};

/** Source of proof history for the anomaly tool, injected for testability. */
export interface OracleDeps {
  solvency: SolvencyDeps;
  /** Load recent proofs for an institution, newest first or any order. */
  getProofHistory(institutionId: string): Promise<Proof[]>;
  thresholds?: AnomalyThresholds;
}

function jsonResult<T>(value: T) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

/** Register get_solvency and get_anomalies on the given server. */
export function registerOracleTools(server: McpServer, deps: OracleDeps): void {
  server.registerTool(
    "get_solvency",
    {
      title: "Get solvency",
      description:
        "Return whether an institution is solvent, backed by an on-chain verification check. " +
        "Reports R, L, the proof id, on-chain verification status, and the as-of time.",
      inputSchema: institutionInput,
    },
    async ({ institution_id }): Promise<ReturnType<typeof jsonResult<SolvencyResult>>> => {
      const result = await getSolvency(institution_id, deps.solvency);
      return jsonResult(result);
    },
  );

  server.registerTool(
    "get_anomalies",
    {
      title: "Get anomalies",
      description:
        "Return recent anomaly flags for an institution across proof cycles: reserve drift, " +
        "liability spikes, and cycle timing gaps detected before any in-circuit breach.",
      inputSchema: institutionInput,
    },
    async ({ institution_id }): Promise<ReturnType<typeof jsonResult<AnomalyFlag[]>>> => {
      const history = await deps.getProofHistory(institution_id);
      const flags = detectAnomalies(history, deps.thresholds ?? DEFAULT_THRESHOLDS);
      return jsonResult(flags);
    },
  );
}
