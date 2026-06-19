// Typed errors so callers can branch on failure cause instead of parsing
// strings. Every SDK throw is one of these.

/** Base class for all SDK errors. */
export class SolvaError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** A call to the orchestrator REST API failed or returned a non-2xx status. */
export class OrchestratorError extends SolvaError {
  constructor(
    message: string,
    readonly status: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** An on-chain read against the proof-registry contract failed. */
export class ChainError extends SolvaError {}

/** The SDK was given invalid input or is missing required configuration. */
export class ConfigError extends SolvaError {}
