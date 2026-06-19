// Public surface of @solva/shared-types. Types only, plus the small const enums
// for solvency and anomaly status. Shared by the SDK, the web app, and the
// oracle so the wire contract stays in lockstep with proto/prover.proto.

export type { Liability, Reserve, PublicInputs, Proof } from "./proof.js";
export type { MerkleTreeNode, PathNode, InclusionRef } from "./merkle.js";
export type { SolvencyResult, InclusionResult } from "./solvency.js";
export { SolvencyStatus } from "./solvency.js";
export type { AnomalyFlag } from "./anomaly.js";
export { AnomalyKind, AnomalySeverity } from "./anomaly.js";
