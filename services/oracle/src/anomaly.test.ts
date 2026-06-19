import { test } from "node:test";
import assert from "node:assert/strict";
import type { Proof } from "@solva/shared-types";
import { AnomalyKind } from "@solva/shared-types";
import { percentChange, detectAnomalies, DEFAULT_THRESHOLDS } from "./anomaly.js";

function proof(id: string, R: string, L: string, publishedAt: number): Proof {
  return {
    id,
    proof: "",
    publicInputs: { reservesTotal: R, liabilitiesTotal: L, rootHash: "0x", prevReserves: "0" },
    publishedAt,
  };
}

test("percentChange handles growth, decline, and zero base", () => {
  assert.equal(percentChange(100n, 110n), 10);
  assert.equal(percentChange(100n, 90n), -10);
  assert.equal(percentChange(0n, 0n), 0);
  assert.equal(percentChange(0n, 5n), Number.POSITIVE_INFINITY);
});

test("flags a reserve drop past the threshold", () => {
  const t0 = 1_000_000;
  const history = [
    proof("1", "1000", "500", t0),
    proof("2", "800", "500", t0 + 60), // reserves down 20%
  ];
  const flags = detectAnomalies(history, DEFAULT_THRESHOLDS);
  const drift = flags.find((f) => f.kind === AnomalyKind.ReserveDrift);
  assert.ok(drift, "expected a reserve drift flag");
  assert.equal(drift.proofId, "2");
  assert.equal(drift.value, -20);
});

test("flags a liability spike past the threshold", () => {
  const t0 = 1_000_000;
  const history = [
    proof("1", "1000", "500", t0),
    proof("2", "1000", "600", t0 + 60), // liabilities up 20%
  ];
  const flags = detectAnomalies(history, DEFAULT_THRESHOLDS);
  const spike = flags.find((f) => f.kind === AnomalyKind.LiabilitySpike);
  assert.ok(spike, "expected a liability spike flag");
  assert.equal(spike.value, 20);
});

test("does not flag a stable, on-time cycle", () => {
  const t0 = 1_000_000;
  const history = [
    proof("1", "1000", "500", t0),
    proof("2", "1010", "505", t0 + 60),
  ];
  const flags = detectAnomalies(history, DEFAULT_THRESHOLDS);
  assert.equal(flags.length, 0);
});

test("flags a late cycle", () => {
  const t0 = 1_000_000;
  const history = [
    proof("1", "1000", "500", t0),
    proof("2", "1000", "500", t0 + DEFAULT_THRESHOLDS.cycleTimingGapSec + 1),
  ];
  const flags = detectAnomalies(history, DEFAULT_THRESHOLDS);
  const timing = flags.find((f) => f.kind === AnomalyKind.CycleTimingGap);
  assert.ok(timing, "expected a cycle timing flag");
});
