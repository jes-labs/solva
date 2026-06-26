import { createProofRegistryClient } from "@solva/contract-bindings";

// Defaults target the Testnet proof-registry deployment (see the contract
// address in apps/docs). Override per environment with the NEXT_PUBLIC_ vars in
// .env.example.
const TESTNET_CONTRACT_ID =
  "CAYWB2IMDG753S3YF7DKVNLD7WBROYSP3JP5HEJET77W53UBWRD7ZX3Z";
const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

/** A read client for the proof-registry contract, configured from the env. */
export function proofRegistryClient() {
  return createProofRegistryClient({
    contractId:
      process.env.NEXT_PUBLIC_PROOF_REGISTRY_CONTRACT_ID ?? TESTNET_CONTRACT_ID,
    rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? TESTNET_RPC_URL,
    networkPassphrase:
      process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? TESTNET_PASSPHRASE,
  });
}
