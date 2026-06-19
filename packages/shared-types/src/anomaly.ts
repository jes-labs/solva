// Anomaly types shared between the oracle agent and the dashboard. The agent
// flags drift, spikes, and timing gaps that precede an in-circuit breach.

export const AnomalyKind = {
  ReserveDrift: "reserve_drift",
  LiabilitySpike: "liability_spike",
  CycleTimingGap: "cycle_timing_gap",
} as const;

export type AnomalyKind = (typeof AnomalyKind)[keyof typeof AnomalyKind];

export const AnomalySeverity = {
  Info: "info",
  Warning: "warning",
  Critical: "critical",
} as const;

export type AnomalySeverity = (typeof AnomalySeverity)[keyof typeof AnomalySeverity];

/** A single flagged anomaly across the proof history. */
export interface AnomalyFlag {
  kind: AnomalyKind;
  severity: AnomalySeverity;
  /** Proof ID where the anomaly was observed. */
  proofId: string;
  /** Measured value that crossed the threshold, for example a drift percent. */
  value: number;
  /** Threshold that was crossed. */
  threshold: number;
  /** Plain-English description of what was flagged. */
  message: string;
  /** Unix epoch seconds the flag was raised. */
  detectedAt: number;
}
