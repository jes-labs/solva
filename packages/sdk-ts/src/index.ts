// Public surface of @solva/sdk-ts.

export { Solva } from "./solva.js";
export type { SolvaConfig, Network, NetworkConfig } from "./config.js";
export type { ProofMeta } from "@solva/contract-bindings";
export type { BankSourceConfig } from "./orchestrator-client.js";
export type { ChainClientOptions } from "./chain-client.js";
export {
  SolvaError,
  OrchestratorError,
  ChainError,
  ConfigError,
} from "./errors.js";

// Re-export the wire types so SDK consumers have one import for everything.
export type {
  Proof,
  PublicInputs,
  Liability,
  Reserve,
  InclusionRef,
  InclusionResult,
  SolvencyResult,
  SolvencyStatus,
} from "@solva/shared-types";
