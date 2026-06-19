import type { ComponentType } from "react";
import {
  ActivityIcon,
  ClockIcon,
  LockIcon,
  ShieldCheckIcon,
  MonitorIcon,
  NodesIcon,
} from "@/components/ui";

// Names shown in the institutions marquee. These are illustrative, not real
// customers.
export const institutions = [
  "Meridian Bank",
  "Orbital Pay",
  "Northwind",
  "Sahel Trust",
  "Avalue",
  "Banco Verde",
  "Halcyon FX",
  "Kuro",
  "Lattice Clearing",
  "Nimbus",
  "Atlas Capital",
  "Koru",
  "Veritas Pay",
  "Indigo",
  "Stade",
  "Ravel",
];

export interface PipelineStep {
  num: string;
  tag: string;
  title: string;
  body: string;
}

export const pipelineSteps: PipelineStep[] = [
  {
    num: "step 01",
    tag: "edge · on-prem",
    title: "Attest",
    body: "Connect ledgers and custody. Solva reads reserves and liabilities inside your perimeter. Raw balances stay local and are never transmitted.",
  },
  {
    num: "step 02",
    tag: "commitment",
    title: "Commit",
    body: "Balances are folded into a cryptographic commitment: a Merkle tree of liabilities and a reserve total. The commitment binds the proof to exact figures without exposing them.",
  },
  {
    num: "step 03",
    tag: "zk-SNARK",
    title: "Prove",
    body: "A zero-knowledge circuit proves reserves are at least liabilities and that every customer balance is included. It reveals nothing else, just the single yes or no.",
  },
  {
    num: "step 04",
    tag: "Stellar",
    title: "Verify",
    body: "The proof is verified inside a Stellar smart contract and recorded on-chain. Anyone can check it themselves, whether a regulator, a counterparty, or the public, for a fraction of a cent.",
  },
];

export interface Differentiator {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
}

export const differentiators: Differentiator[] = [
  { icon: ActivityIcon, title: "True solvency", body: "Proves reserves are at least liabilities, not just that assets exist somewhere." },
  { icon: ClockIcon, title: "Continuous", body: "A live proof every block, not a quarterly PDF months out of date." },
  { icon: LockIcon, title: "Private by default", body: "Zero-knowledge: individual customer balances are never revealed." },
  { icon: ShieldCheckIcon, title: "On-chain and public", body: "Verified in a Stellar contract, so anyone can check it." },
  { icon: MonitorIcon, title: "Edge proving", body: "Proofs are generated inside your infrastructure. Raw data never leaves." },
  { icon: NodesIcon, title: "Selective disclosure", body: "Reveal exactly what a regulator needs, and nothing more." },
];

export interface Audience {
  title: string;
  body: string;
}

export const audiences: Audience[] = [
  { title: "Banks & fintechs", body: "Demonstrate solvency to regulators in real time." },
  { title: "Exchanges", body: "Give users proof they can actually trust." },
  { title: "Stablecoin issuers", body: "Prove full backing, continuously, on-chain." },
  { title: "Regulators", body: "Verify solvency without bulk customer data." },
];

export const homeFaqs = [
  {
    question: "Is this just proof of reserves?",
    answer:
      "No. Proof of reserves only shows assets exist. Solva proves reserves are at least liabilities, which is true solvency, by including every liability inside a zero-knowledge circuit. That is the property that actually protects customers.",
  },
  {
    question: "Does Solva ever see customer balances?",
    answer:
      "Never. Proving runs at the edge, inside your own infrastructure. Only a cryptographic commitment and the resulting proof leave your perimeter, never raw balances, names, or accounts.",
  },
  {
    question: "How is a proof verified?",
    answer:
      "Each proof is checked inside a Stellar smart contract and recorded on-chain. Anyone can independently verify it in about five seconds, for a fraction of a cent, without trusting Solva.",
  },
  {
    question: "What can a regulator see?",
    answer:
      "Exactly what you choose to disclose. Selective disclosure lets you reveal a specific figure or attribute to an auditor while everything else stays private and provable.",
  },
  {
    question: "How fast can we integrate?",
    answer:
      "Most teams are running in a sandbox the same day using the TypeScript SDK and our mock open-banking environment, then connect real ledgers behind their own firewall.",
  },
];

// Rotating proof hashes for the hero live-proof indicator. Illustrative.
export const proofHashes = ["0x7a…e3f1", "0x91…b4c2", "0x3d…7faa", "0xa2…0e19", "0x5c…d8b0", "0xff…1a73"];

// Deterministic R >= L series, 16 points. Reserves stay above liabilities so the
// area between them is the solvency margin. Fixed values keep SSR and client in
// step and the picture legible.
export const marginSeries = [
  { liabilities: 96, reserves: 132 },
  { liabilities: 92, reserves: 124 },
  { liabilities: 101, reserves: 138 },
  { liabilities: 108, reserves: 141 },
  { liabilities: 99, reserves: 145 },
  { liabilities: 94, reserves: 137 },
  { liabilities: 103, reserves: 134 },
  { liabilities: 112, reserves: 150 },
  { liabilities: 106, reserves: 152 },
  { liabilities: 98, reserves: 143 },
  { liabilities: 91, reserves: 139 },
  { liabilities: 100, reserves: 148 },
  { liabilities: 109, reserves: 151 },
  { liabilities: 104, reserves: 156 },
  { liabilities: 97, reserves: 149 },
  { liabilities: 102, reserves: 158 },
];
