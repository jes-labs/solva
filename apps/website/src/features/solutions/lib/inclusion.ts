interface CustomerLeaf {
  reference: string;
  balance: bigint;
}

export interface InclusionSnapshot {
  institution: string;
  asset: string;
  decimals: number;
  total: bigint;
  ledger: number;
  customers: readonly CustomerLeaf[];
}

export type InclusionResult =
  | { status: "idle" }
  | { status: "invalid"; input: string }
  | { status: "not-found"; reference: string }
  | { status: "counted"; reference: string; balance: bigint; total: bigint; ledger: number };

const REFERENCE = /^[A-Z]{3}-\d{4}$/;

export function normalizeReference(input: string): string | null {
  const compact = input.trim().toUpperCase().replace(/\s+/g, "");
  const withDash = /^[A-Z]{3}\d{4}$/.test(compact)
    ? `${compact.slice(0, 3)}-${compact.slice(3)}`
    : compact;
  return REFERENCE.test(withDash) ? withDash : null;
}

export function checkInclusion(input: string, snapshot: InclusionSnapshot): InclusionResult {
  const reference = normalizeReference(input);
  if (!reference) return { status: "invalid", input };
  const leaf = snapshot.customers.find((customer) => customer.reference === reference);
  if (!leaf) return { status: "not-found", reference };
  return {
    status: "counted",
    reference,
    balance: leaf.balance,
    total: snapshot.total,
    ledger: snapshot.ledger,
  };
}

export const northwaySnapshot: InclusionSnapshot = {
  institution: "Northway Custody",
  asset: "USDC",
  decimals: 2,
  total: 1842090512n,
  ledger: 3411902,
  customers: [
    { reference: "NWC-0418", balance: 248015n },
    { reference: "NWC-1172", balance: 1290000n },
    { reference: "NWC-2035", balance: 6250n },
    { reference: "NWC-2961", balance: 48733120n },
    { reference: "NWC-3304", balance: 91540n },
    { reference: "NWC-4480", balance: 2100075n },
    { reference: "NWC-5127", balance: 15000n },
    { reference: "NWC-6893", balance: 733418n },
  ],
};
