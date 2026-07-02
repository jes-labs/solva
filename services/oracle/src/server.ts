// MCP server wiring. This module only assembles transport, server, deps, and
// tools. The solvency and anomaly logic live in their own modules.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Proof } from "@solva/shared-types";
import { Solva } from "@solva/sdk-ts";
import { registerOracleTools, type OracleDeps } from "./tools.js";
import { chainSolvencyDeps } from "./solvency.js";

type Network = "testnet" | "mainnet" | "local";

function networkFromEnv(): Network {
  const n = process.env.SOLVA_NETWORK;
  if (n === "mainnet" || n === "local" || n === "testnet") return n;
  return "testnet";
}

/** Build the oracle dependencies backed by the Solva SDK. */
export function buildDeps(network: Network): OracleDeps {
  return {
    solvency: chainSolvencyDeps(network),
    async getProofHistory(institutionId: string): Promise<Proof[]> {
      // The orchestrator audit log holds the full history. The SDK exposes the
      // latest proof today; until a history endpoint lands, return the latest
      // as a single-element history so the anomaly pass has something to scan.
      const solva = new Solva({ network, tenant: institutionId });
      const latest = await solva.getLatestProof();
      return [latest];
    },
  };
}

/** Create the configured MCP server without connecting a transport. */
export function createServer(network: Network = networkFromEnv()): McpServer {
  const server = new McpServer({ name: "solva-oracle", version: "0.1.0" });
  registerOracleTools(server, buildDeps(network));
  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run only when invoked directly, not when imported by a test.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("solva-oracle failed to start:", err);
    process.exit(1);
  });
}
