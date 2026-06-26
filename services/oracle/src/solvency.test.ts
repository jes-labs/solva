// Tests for the get_solvency domain logic. The critical acceptance criterion
// is that the chain read path is exercised with a stubbed client — the answer
// must come from verifyOnChain, not a stored value (PRD 2 §13.3).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Proof } from "@solva/shared-types";
import { SolvencyStatus } from "@solva/shared-types";
import type { SolvencyDeps } from "./solvency.js";
import { getSolvency } from "./solvency.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProof(overrides: Partial<Proof> = {}): Proof {
  return {
    id: "proof-1",
    proof: "base64encodedproof==",
    publicInputs: {
      reservesTotal: "1000",
      liabilitiesTotal: "800",
      rootHash: "0xabc",
      prevReserves: "900",
    },
    publishedAt: 1_700_000_000,
    ...overrides,
  };
}

/** Build a SolvencyDeps with controllable responses. */
function makeDeps(
  proof: Proof,
  onChainResult: boolean,
  opts: { throwOnChain?: boolean } = {},
): SolvencyDeps {
  return {
    async getLatestProof(_tenant: string): Promise<Proof> {
      return proof;
    },
    async verifyOnChain(_proof: Proof): Promise<boolean> {
      if (opts.throwOnChain) throw new Error("rpc timeout");
      return onChainResult;
    },
  };
}

// ---------------------------------------------------------------------------
// Chain read path — the acceptance-criteria test
// ---------------------------------------------------------------------------

test("getSolvency calls verifyOnChain and surfaces the result", async () => {
  let chainCallCount = 0;
  const proof = makeProof();
  const deps: SolvencyDeps = {
    async getLatestProof() {
      return proof;
    },
    async verifyOnChain(p) {
      chainCallCount++;
      // Assert the proof passed through unmodified.
      assert.equal(p.id, proof.id);
      assert.equal(p.publicInputs.rootHash, proof.publicInputs.rootHash);
      return true;
    },
  };

  await getSolvency("tenant-a", deps);
  assert.equal(
    chainCallCount,
    1,
    "verifyOnChain must be called exactly once per getSolvency call",
  );
});

test("solvent when R >= L and chain verification passes", async () => {
  const proof = makeProof({
    publicInputs: {
      reservesTotal: "1000",
      liabilitiesTotal: "800",
      rootHash: "0x1",
      prevReserves: "0",
    },
  });
  const result = await getSolvency("tenant-a", makeDeps(proof, true));

  assert.equal(result.solvent, true);
  assert.equal(result.status, SolvencyStatus.Solvent);
  assert.equal(result.verifiedOnChain, true);
  assert.equal(result.proofId, "proof-1");
  assert.equal(result.reservesTotal, "1000");
  assert.equal(result.liabilitiesTotal, "800");
  assert.equal(result.asOf, proof.publishedAt);
});

test("breach when chain verification fails even if R >= L", async () => {
  // The on-chain check failing means the proof did not verify; we must not
  // report solvent just because the stored numbers look good.
  const proof = makeProof({
    publicInputs: {
      reservesTotal: "1000",
      liabilitiesTotal: "800",
      rootHash: "0x2",
      prevReserves: "0",
    },
  });
  const result = await getSolvency("tenant-a", makeDeps(proof, false));

  assert.equal(result.solvent, false);
  assert.equal(result.status, SolvencyStatus.Breach);
  assert.equal(result.verifiedOnChain, false);
});

test("breach when R < L even if chain verification passes", async () => {
  const proof = makeProof({
    publicInputs: {
      reservesTotal: "700",
      liabilitiesTotal: "800",
      rootHash: "0x3",
      prevReserves: "0",
    },
  });
  const result = await getSolvency("tenant-a", makeDeps(proof, true));

  assert.equal(result.solvent, false);
  assert.equal(result.status, SolvencyStatus.Breach);
  assert.equal(result.verifiedOnChain, true);
});

test("solvent when R exactly equals L and chain passes", async () => {
  const proof = makeProof({
    publicInputs: {
      reservesTotal: "1000",
      liabilitiesTotal: "1000",
      rootHash: "0x4",
      prevReserves: "0",
    },
  });
  const result = await getSolvency("tenant-a", makeDeps(proof, true));

  assert.equal(result.solvent, true);
  assert.equal(result.status, SolvencyStatus.Solvent);
});

test("handles large decimal-string totals correctly (BigInt path)", async () => {
  // Numbers beyond Number.MAX_SAFE_INTEGER — must not lose precision.
  const R = "99999999999999999999";
  const L = "99999999999999999998";
  const proof = makeProof({
    publicInputs: {
      reservesTotal: R,
      liabilitiesTotal: L,
      rootHash: "0x5",
      prevReserves: "0",
    },
  });
  const result = await getSolvency("tenant-a", makeDeps(proof, true));

  assert.equal(result.solvent, true);
});

test("verifyOnChain receives the exact proof returned by getLatestProof", async () => {
  const proof = makeProof({
    id: "proof-xyz",
    publicInputs: {
      reservesTotal: "500",
      liabilitiesTotal: "400",
      rootHash: "0xdeadbeef",
      prevReserves: "0",
    },
  });
  let receivedProof: Proof | undefined;
  const deps: SolvencyDeps = {
    async getLatestProof() {
      return proof;
    },
    async verifyOnChain(p) {
      receivedProof = p;
      return true;
    },
  };

  await getSolvency("tenant-a", deps);

  assert.ok(receivedProof, "verifyOnChain should have been called");
  assert.deepEqual(receivedProof, proof);
});

test("chainSolvencyDeps: verifyOnChain returns false (not throws) when registry throws", async () => {
  // Import here to keep fixture setup at top level.
  const { chainSolvencyDeps } = await import("./solvency.js");

  const throwingRegistry = {
    async getLatestProof() {
      throw new Error("unreachable");
    },
    async getProof() {
      throw new Error("unreachable");
    },
    async verifyInclusion() {
      throw new Error("rpc timeout");
    },
  };

  const deps = chainSolvencyDeps(throwingRegistry, "local", "tenant-x");
  const proof = makeProof();

  // Should resolve to false, not reject.
  const result = await deps.verifyOnChain(proof);
  assert.equal(
    result,
    false,
    "a chain error should surface as verifiedOnChain: false",
  );
});
