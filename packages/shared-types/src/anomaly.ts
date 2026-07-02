// Anomaly types and detection shared between the oracle agent and the dashboard.
// The math runs on the public totals in each proof, so it needs no private data.

import type { Proof } from "./proof.js";

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

/** Thresholds that decide when a feature becomes a flag. All are configurable. */
export interface AnomalyThresholds {
  /** Flag when reserves fall by at least this percent versus the prior cycle. */
  reserveDriftPct: number;
  /** Flag when liabilities rise by at least this percent versus the prior cycle. */
  liabilitySpikePct: number;
  /** Flag when the gap between two cycles exceeds this many seconds. */
  cycleTimingGapSec: number;
}

export const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  reserveDriftPct: 10,
  liabilitySpikePct: 15,
  cycleTimingGapSec: 60 * 60 * 26, // Daily cycle with a 2 hour grace window.
};

// Totals are decimal strings of integer minor units. They can exceed Number's
// safe range, so we compare with BigInt and only convert the ratio to a Number.
function toBigInt(decimal: string): bigint {
  return BigInt(decimal);
}

/** Percent change from `prev` to `curr`. Positive means growth. */
export function percentChange(prev: bigint, curr: bigint): number {
  if (prev === 0n) {
    return curr === 0n ? 0 : Number.POSITIVE_INFINITY;
  }
  const delta = curr - prev;
  // Scale by 10000 for two decimal places of precision before the Number cast.
  const scaled = (delta * 10000n) / prev;
  return Number(scaled) / 100;
}

/** Reserve drift as a percent. Negative means reserves shrank. */
export function reserveDrift(prev: Proof, curr: Proof): number {
  return percentChange(
    toBigInt(prev.publicInputs.reservesTotal),
    toBigInt(curr.publicInputs.reservesTotal),
  );
}

/** Liability spike as a percent. Positive means liabilities grew. */
export function liabilitySpike(prev: Proof, curr: Proof): number {
  return percentChange(
    toBigInt(prev.publicInputs.liabilitiesTotal),
    toBigInt(curr.publicInputs.liabilitiesTotal),
  );
}

/** Gap in seconds between two consecutive proofs. */
export function cycleTimingGap(prev: Proof, curr: Proof): number {
  return curr.publishedAt - prev.publishedAt;
}

// Severity scales with how far past the threshold the value is.
function severityFor(magnitude: number, threshold: number): AnomalySeverity {
  if (magnitude >= threshold * 2) return AnomalySeverity.Critical;
  if (magnitude >= threshold) return AnomalySeverity.Warning;
  return AnomalySeverity.Info;
}

/**
 * Scan a proof history and return every flag. Proofs may arrive unordered, so
 * sort by publish time first and compare each cycle to the one before it.
 */
export function detectAnomalies(
  proofs: Proof[],
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS,
): AnomalyFlag[] {
  const ordered = [...proofs].sort((a, b) => a.publishedAt - b.publishedAt);
  const flags: AnomalyFlag[] = [];

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    if (prev === undefined || curr === undefined) continue;

    const drift = reserveDrift(prev, curr);
    // A drop in reserves is the dangerous direction.
    if (drift <= -thresholds.reserveDriftPct) {
      const magnitude = Math.abs(drift);
      flags.push({
        kind: AnomalyKind.ReserveDrift,
        severity: severityFor(magnitude, thresholds.reserveDriftPct),
        proofId: curr.id,
        value: drift,
        threshold: -thresholds.reserveDriftPct,
        message: `Reserves fell ${magnitude.toFixed(2)}% from the previous cycle.`,
        detectedAt: curr.publishedAt,
      });
    }

    const spike = liabilitySpike(prev, curr);
    if (spike >= thresholds.liabilitySpikePct) {
      flags.push({
        kind: AnomalyKind.LiabilitySpike,
        severity: severityFor(spike, thresholds.liabilitySpikePct),
        proofId: curr.id,
        value: spike,
        threshold: thresholds.liabilitySpikePct,
        message: `Liabilities rose ${spike.toFixed(2)}% from the previous cycle.`,
        detectedAt: curr.publishedAt,
      });
    }

    const gap = cycleTimingGap(prev, curr);
    if (gap > thresholds.cycleTimingGapSec) {
      flags.push({
        kind: AnomalyKind.CycleTimingGap,
        severity: severityFor(gap, thresholds.cycleTimingGapSec),
        proofId: curr.id,
        value: gap,
        threshold: thresholds.cycleTimingGapSec,
        message: `Cycle arrived ${gap}s after the previous one, past the expected window.`,
        detectedAt: curr.publishedAt,
      });
    }
  }

  return flags;
}
