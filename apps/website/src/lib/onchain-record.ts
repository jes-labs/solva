import "server-only";
import { Solva } from "@solva/sdk-ts";
import { ORCHESTRATOR_URL } from "./sandbox-backend";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";

function client(tenantId: string): Solva {
  return new Solva({
    network: "testnet",
    tenant: tenantId,
    endpoints: { orchestratorUrl: ORCHESTRATOR_URL, rpcUrl: RPC_URL },
  });
}

export interface OnChainRecord {
  reserves: string;
  liabilities: string;
  rootHash: string;
  timestamp: number;
}

export async function readOnChainRecord(tenantId: string): Promise<OnChainRecord> {
  const proof = await client(tenantId).getOnChainLatestProof();
  return {
    reserves: proof.reservesTotal,
    liabilities: proof.liabilitiesTotal,
    rootHash: proof.rootHash,
    timestamp: proof.timestamp,
  };
}

export async function checkInclusionOnChain(tenantId: string, ref: string): Promise<boolean> {
  const result = await client(tenantId).verifyInclusion(ref);
  return result.included;
}
