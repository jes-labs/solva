const EXPLORER = "https://stellar.expert/explorer/testnet";

export const verifierEvidence = {
  network: "Testnet",
  contractId: "CA3KQYYAGUEIURJSB5CSWVMNIY2FF2EG3YTM7SBBRSN7DQWZXCCXWXN3",
  wasmHash: "f271e16470a46b30eb9ab9f450b510202b5fcdb09e0ee68bbec1429ebc5e3c6f",
  verifyTx: "de9c70fcf69d9327eef127c9260993ac9551a3b42bc901d9910188b8fded2901",
  verifiedAtLedger: 3191042,
  feeStroops: 122514,
  feeXlm: "0.0122514",
  protocol: 27,
} as const;

export const explorer = {
  contract: (id: string) => `${EXPLORER}/contract/${id}`,
  tx: (hash: string) => `${EXPLORER}/tx/${hash}`,
} as const;

export function shortHash(value: string, head = 8, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
