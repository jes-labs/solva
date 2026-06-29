import { Solva, OrchestratorError, type ProofMeta } from "@solva/sdk-ts";

// Reads are org-scoped: an institution is resolved to its own contract through
// the orchestrator (#130), so two institutions read their own registries, never
// a shared one. Network endpoints come from the NEXT_PUBLIC_ vars (.env.example).
const DEFAULT_RPC_URL = "https://soroban-testnet.stellar.org";
const DEFAULT_PASSPHRASE = "Test SDF Network ; September 2015";
const DEFAULT_ORCHESTRATOR_URL = "http://localhost:8080";

function network(): "testnet" | "mainnet" | "local" {
  const n = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  return n === "mainnet" || n === "local" ? n : "testnet";
}

// institutionLatestProof reads an institution's latest proof from its own
// on-chain contract. The Solva client resolves the institution to its contract
// via the orchestrator, then reads that registry directly.
export async function institutionLatestProof(
  institution: string,
): Promise<ProofMeta> {
  const solva = new Solva({
    network: network(),
    tenant: institution,
    endpoints: {
      orchestratorUrl:
        process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ?? DEFAULT_ORCHESTRATOR_URL,
      rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? DEFAULT_RPC_URL,
      networkPassphrase:
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? DEFAULT_PASSPHRASE,
    },
  });
  return solva.getOnChainLatestProof();
}

// isUnknownInstitution reports whether the error means the institution has no
// contract, unknown or not yet provisioned: the orchestrator answered 404.
export function isUnknownInstitution(err: unknown): boolean {
  return err instanceof OrchestratorError && err.status === 404;
}
