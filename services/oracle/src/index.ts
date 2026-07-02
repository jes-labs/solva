// Library surface of @solva/oracle. The MCP entry point is server.ts; this
// module re-exports the pieces a test or an embedder needs.

export { createServer, buildDeps } from "./server.js";
export { registerOracleTools, type OracleDeps } from "./tools.js";
export { getSolvency, chainSolvencyDeps, type SolvencyDeps } from "./solvency.js";
export {
  detectAnomalies,
  reserveDrift,
  liabilitySpike,
  cycleTimingGap,
  percentChange,
  DEFAULT_THRESHOLDS,
  type AnomalyThresholds,
} from "./anomaly.js";
