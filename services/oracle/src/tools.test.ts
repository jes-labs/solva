// Tests for the MCP tool layer. These exercise registerOracleTools end-to-end:
// the tool receives an institution_id, calls the domain dep, and returns the
// documented JSON shape. The chain and orchestrator are fully stubbed.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Proof, SolvencyResult, AnomalyFlag } from "@solva/shared-types";
import {
  SolvencyStatus,
  AnomalyKind,
  AnomalySeverity,
} from "@solva/shared-types";
import type { OracleDeps } from "./tools.js";

// ---------------------------------------------------------------------------
// Minimal McpServer stub
// ---------------------------------------------------------------------------

type ToolHandler = (
  args: Record<string, string>,
) => Promise<{ content: Array<{ type: string; text: string }> }>;

interface RegisteredTool {
  name: string;
  handler: ToolHandler;
}

/** Minimal stub that captures registerTool calls so we can invoke them in tests. */
class StubMcpServer {
  private tools = new Map<string, RegisteredTool>();

  registerTool(name: string, _meta: unknown, handler: ToolHandler): void {
    this.tools.set(name, { name, handler });
  }

  async call(name: string, args: Record<string, string>) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`tool ${name} not registered`);
    return tool.handler(args);
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProof(
  id = "p1",
  R = "1000",
  L = "800",
  publishedAt = 1_700_000_000,
): Proof {
  return {
    id,
    proof: "",
    publicInputs: {
      reservesTotal: R,
      liabilitiesTotal: L,
      rootHash: "0x0",
      prevReserves: "0",
    },
    publishedAt,
  };
}

const SOLVENT_RESULT: SolvencyResult = {
  status: SolvencyStatus.Solvent,
  solvent: true,
  reservesTotal: "1000",
  liabilitiesTotal: "800",
  proofId: "p1",
  verifiedOnChain: true,
  asOf: 1_700_000_000,
};

function makeDeps(overrides: Partial<OracleDeps> = {}): OracleDeps {
  return {
    solvency: {
      async getLatestProof() {
        return makeProof();
      },
      async verifyOnChain() {
        return true;
      },
    },
    async getProofHistory(_id: string): Promise<Proof[]> {
      return [makeProof()];
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// get_solvency tool tests
// ---------------------------------------------------------------------------

test("get_solvency: returns documented SolvencyResult shape", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();

  registerOracleTools(
    server as never,
    makeDeps({
      solvency: {
        async getLatestProof() {
          return makeProof();
        },
        async verifyOnChain() {
          return true;
        },
      },
    }),
  );

  const res = await server.call("get_solvency", { institution_id: "tenant-a" });

  assert.equal(res.content.length, 1);
  assert.equal(res.content[0]!.type, "text");

  const parsed = JSON.parse(res.content[0]!.text) as SolvencyResult;
  assert.equal(typeof parsed.solvent, "boolean");
  assert.ok(["solvent", "breach", "unknown"].includes(parsed.status));
  assert.equal(typeof parsed.reservesTotal, "string");
  assert.equal(typeof parsed.liabilitiesTotal, "string");
  assert.equal(typeof parsed.proofId, "string");
  assert.equal(typeof parsed.verifiedOnChain, "boolean");
  assert.equal(typeof parsed.asOf, "number");
});

test("get_solvency: solvent when verifyOnChain returns true and R >= L", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();

  registerOracleTools(server as never, makeDeps());

  const res = await server.call("get_solvency", { institution_id: "tenant-a" });
  const parsed = JSON.parse(res.content[0]!.text) as SolvencyResult;

  assert.equal(parsed.solvent, true);
  assert.equal(parsed.status, SolvencyStatus.Solvent);
  assert.equal(parsed.verifiedOnChain, true);
});

test("get_solvency: breach when verifyOnChain returns false", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();

  registerOracleTools(
    server as never,
    makeDeps({
      solvency: {
        async getLatestProof() {
          return makeProof("p2", "1000", "800");
        },
        async verifyOnChain() {
          return false;
        },
      },
    }),
  );

  const res = await server.call("get_solvency", { institution_id: "tenant-b" });
  const parsed = JSON.parse(res.content[0]!.text) as SolvencyResult;

  assert.equal(parsed.solvent, false);
  assert.equal(parsed.status, SolvencyStatus.Breach);
  assert.equal(parsed.verifiedOnChain, false);
});

test("get_solvency: passes institution_id through to getLatestProof", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();
  let capturedTenant = "";

  registerOracleTools(
    server as never,
    makeDeps({
      solvency: {
        async getLatestProof(tenant: string) {
          capturedTenant = tenant;
          return makeProof();
        },
        async verifyOnChain() {
          return true;
        },
      },
    }),
  );

  await server.call("get_solvency", { institution_id: "bank-xyz" });
  assert.equal(capturedTenant, "bank-xyz");
});

// ---------------------------------------------------------------------------
// get_anomalies tool tests
// ---------------------------------------------------------------------------

test("get_anomalies: returns empty array for stable history", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();
  const t0 = 1_000_000;

  registerOracleTools(
    server as never,
    makeDeps({
      async getProofHistory() {
        return [
          makeProof("p1", "1000", "500", t0),
          makeProof("p2", "1010", "505", t0 + 60),
        ];
      },
    }),
  );

  const res = await server.call("get_anomalies", {
    institution_id: "tenant-a",
  });
  const flags = JSON.parse(res.content[0]!.text) as AnomalyFlag[];

  assert.ok(Array.isArray(flags));
  assert.equal(flags.length, 0);
});

test("get_anomalies: flags reserve drift in history", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();
  const t0 = 1_000_000;

  registerOracleTools(
    server as never,
    makeDeps({
      async getProofHistory() {
        return [
          makeProof("p1", "1000", "500", t0),
          makeProof("p2", "800", "500", t0 + 60), // reserves dropped 20%
        ];
      },
    }),
  );

  const res = await server.call("get_anomalies", {
    institution_id: "tenant-a",
  });
  const flags = JSON.parse(res.content[0]!.text) as AnomalyFlag[];

  const drift = flags.find((f) => f.kind === AnomalyKind.ReserveDrift);
  assert.ok(drift, "expected a reserve drift flag");
  assert.equal(drift.proofId, "p2");
  assert.ok(
    drift.value < 0,
    "drift value should be negative for a reserve drop",
  );
});

test("get_anomalies: flags liability spike in history", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();
  const t0 = 1_000_000;

  registerOracleTools(
    server as never,
    makeDeps({
      async getProofHistory() {
        return [
          makeProof("p1", "1000", "500", t0),
          makeProof("p2", "1000", "600", t0 + 60), // liabilities up 20%
        ];
      },
    }),
  );

  const res = await server.call("get_anomalies", {
    institution_id: "tenant-a",
  });
  const flags = JSON.parse(res.content[0]!.text) as AnomalyFlag[];

  const spike = flags.find((f) => f.kind === AnomalyKind.LiabilitySpike);
  assert.ok(spike, "expected a liability spike flag");
  assert.equal(spike.severity, AnomalySeverity.Warning);
});

test("get_anomalies: returns documented AnomalyFlag shape", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();
  const t0 = 1_000_000;

  registerOracleTools(
    server as never,
    makeDeps({
      async getProofHistory() {
        return [
          makeProof("p1", "1000", "500", t0),
          makeProof("p2", "700", "500", t0 + 60), // 30% drop
        ];
      },
    }),
  );

  const res = await server.call("get_anomalies", {
    institution_id: "tenant-a",
  });
  const flags = JSON.parse(res.content[0]!.text) as AnomalyFlag[];

  assert.ok(flags.length > 0, "should have at least one flag");
  const flag = flags[0]!;
  // Verify all documented fields are present.
  assert.ok(
    ["reserve_drift", "liability_spike", "cycle_timing_gap"].includes(
      flag.kind,
    ),
  );
  assert.ok(["info", "warning", "critical"].includes(flag.severity));
  assert.equal(typeof flag.proofId, "string");
  assert.equal(typeof flag.value, "number");
  assert.equal(typeof flag.threshold, "number");
  assert.equal(typeof flag.message, "string");
  assert.equal(typeof flag.detectedAt, "number");
});

test("get_anomalies: passes institution_id through to getProofHistory", async () => {
  const { registerOracleTools } = await import("./tools.js");
  const server = new StubMcpServer();
  let capturedId = "";

  registerOracleTools(
    server as never,
    makeDeps({
      async getProofHistory(id: string) {
        capturedId = id;
        return [makeProof()];
      },
    }),
  );

  await server.call("get_anomalies", { institution_id: "bank-abc" });
  assert.equal(capturedId, "bank-abc");
});
