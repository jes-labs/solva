// Anomaly detection over proof history. The goal is to flag trouble before the
// circuit ever proves a breach: reserves drifting down, liabilities spiking up,
// or cycles arriving late. The feature math is real and runs on the public
// totals carried in each proof, so it needs no private data.

import type { Proof, AnomalyFlag } from "@solva/shared-types";
import { AnomalyKind, AnomalySeverity } from "@solva/shared-types";

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

// Drift severity scales with how far past the threshold we are.
function severityFor(magnitude: number, threshold: number): AnomalySeverity {
  if (magnitude >= threshold * 2) return AnomalySeverity.Critical;
  if (magnitude >= threshold) return AnomalySeverity.Warning;
  return AnomalySeverity.Info;
}

/**
 * Scan a proof history and return every flag. Proofs may arrive unordered, so
 * we sort by publish time first and compare each cycle to the one before it.
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
