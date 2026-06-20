import type { Proof } from "@solva/shared-types";

// Mock proof registry for the public verify page while the contract, orchestrator,
// and SDK are still being wired. The lookup signature mirrors the real path so
// the swap is a one-liner:
//
//   const proof = await solvaClient(tenant).getProof(id);  // throws on not-found
//
// Here we return null on not-found so the UI can render a clean message.

interface MockRecord {
  id: string;
  reservesTotal: string;
  liabilitiesTotal: string;
  rootHash: string;
  prevReserves: string;
  // How long ago this proof was published, so the relative time stays fresh.
  ageSeconds: number;
}

const RECORDS: MockRecord[] = [
  {
    id: "1042",
    reservesTotal: "12400000",
    liabilitiesTotal: "11980000",
    rootHash: "0x7a3f9c2e1b8d4a6f0e5c9d2a7b1f3e8c4d6a9b2e1c7f0d5a8b3e6c9f2a4d7be3",
    prevReserves: "12100000",
    ageSeconds: 130,
  },
  {
    id: "1041",
    reservesTotal: "8920000",
    liabilitiesTotal: "8640000",
    rootHash: "0x3c8e1d7a9b2f4e6c0a5d8b1f7e3c9a2d6b4f0e8c1a7d5b3f9e2c6a4d0b8f1e7c",
    prevReserves: "8810000",
    ageSeconds: 5400,
  },
  {
    id: "1038",
    reservesTotal: "45200000",
    liabilitiesTotal: "44990000",
    rootHash: "0x9f1a4d7b2e8c5a0f3d6b9e1c7a4f2d8b5e0c3a9f6d1b4e7c2a8f5d0b3e6c9a1f",
    prevReserves: "45010000",
    ageSeconds: 92000,
  },
];

// A few ids the verify page surfaces as one-tap examples.
export const EXAMPLE_PROOF_IDS = RECORDS.map((record) => record.id);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Look up a published proof by id. Accepts an optional "prf_" prefix that people
// tend to paste. Returns null when no proof matches.
export async function lookupProof(id: string): Promise<Proof | null> {
  const key = id.trim().replace(/^prf[_-]?/i, "");
  // Simulate the on-chain read so loading states are exercised.
  await delay(650);
  const record = RECORDS.find((r) => r.id === key);
  if (!record) return null;
  return {
    id: record.id,
    proof: "VWx0cmFIb25rUHJvb2ZCeXRlc0Jhc2U2NEVuY29kZWRQbGFjZWhvbGRlcg==",
    publicInputs: {
      reservesTotal: record.reservesTotal,
      liabilitiesTotal: record.liabilitiesTotal,
      rootHash: record.rootHash,
      prevReserves: record.prevReserves,
    },
    publishedAt: Math.floor(Date.now() / 1000) - record.ageSeconds,
  };
}
