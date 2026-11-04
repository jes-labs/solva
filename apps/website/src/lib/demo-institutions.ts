export type ReserveSource =
  | { kind: "attested" }
  | { kind: "onchain"; account: string; code: string; issuer: string };

export interface DemoInstitution {
  name: string;
  kind: string;
  owes: string;
  tenantId: string;
  reserves: ReserveSource;
}

const TESTNET_USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const DEMO_INSTITUTIONS: readonly DemoInstitution[] = [
  {
    name: "Solstice",
    kind: "Custodial app",
    owes: "Customer balances, committed as one value",
    tenantId: "22222222-2222-2222-2222-222222222222",
    reserves: { kind: "attested" },
  },
  {
    name: "Kestrel",
    kind: "Anchor",
    owes: "Holder balances, which add up to the token supply",
    tenantId: "11111111-1111-1111-1111-111111111111",
    reserves: { kind: "attested" },
  },
  {
    name: "Harbor Wallet",
    kind: "Custodial app",
    owes: "Customer balances in USDC, with reserves read from Stellar",
    tenantId: "33333333-3333-3333-3333-333333333333",
    reserves: {
      kind: "onchain",
      account: "GCPBHMM7KSE74LO757SPKBE3PHWYRTKKKVBCVZURBFM6B2GSOPAJAR4R",
      code: "USDC",
      issuer: TESTNET_USDC_ISSUER,
    },
  },
];

export function demoInstitution(tenantId: string): DemoInstitution | undefined {
  return DEMO_INSTITUTIONS.find((item) => item.tenantId === tenantId);
}

const STROOP_DIGITS = 7;

interface HorizonAccount {
  balances: readonly {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }[];
}

export function holdingBalance(
  account: HorizonAccount,
  code: string,
  issuer: string,
): string | null {
  const line = account.balances.find(
    (item) => item.asset_code === code && item.asset_issuer === issuer,
  );
  if (!line) return null;
  const [whole = "0", fraction = ""] = line.balance.split(".");
  return BigInt(whole + fraction.padEnd(STROOP_DIGITS, "0").slice(0, STROOP_DIGITS)).toString();
}

export function formatUsdc(stroops: string): string {
  const padded = stroops.padStart(STROOP_DIGITS + 1, "0");
  const whole = padded.slice(0, -STROOP_DIGITS);
  const fraction = padded.slice(-STROOP_DIGITS).replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""} USDC`;
}
