export interface PipelineStep {
  no: string;
  tag: string;
  title: string;
  body: string;
}

export const steps: PipelineStep[] = [
  {
    no: "01",
    tag: "edge · on-prem",
    title: "Attest",
    body: "Solva connects to your ledgers and custody and reads the live figures locally. Reserves and liabilities are gathered inside your own environment, so nothing sensitive is sent anywhere.",
  },
  {
    no: "02",
    tag: "commitment",
    title: "Commit",
    body: "The balances are folded into a cryptographic commitment: a Merkle tree of every liability and a single reserve total. This binds the later proof to the exact numbers while keeping them sealed.",
  },
  {
    no: "03",
    tag: "zk-SNARK",
    title: "Prove",
    body: "A zero-knowledge circuit proves reserves are at least liabilities and that every leaf in the tree was included in the sum. The output is a small proof that reveals the result and nothing else.",
  },
  {
    no: "04",
    tag: "Stellar",
    title: "Verify",
    body: "The proof is checked inside a Stellar smart contract and recorded in a public registry. From that point on, anyone can verify the same proof and reach the same answer.",
  },
];

export interface Guarantee {
  no: string;
  title: string;
  body: string;
}

export const guarantees: Guarantee[] = [
  {
    no: "guarantee 01",
    title: "Reserves cover liabilities",
    body: "The single inequality reserves ≥ liabilities held true at the moment of the proof.",
  },
  {
    no: "guarantee 02",
    title: "Every balance is counted",
    body: "No liability was left out of the sum. Each customer account is provably in the tree.",
  },
  {
    no: "guarantee 03",
    title: "Nothing else is revealed",
    body: "No balance, identity, or total leaks. The proof carries one bit of truth and a timestamp.",
  },
];
