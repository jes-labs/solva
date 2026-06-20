export interface Stat {
  k: string;
  v: string;
  accent?: boolean;
}

export interface Fit {
  n: string;
  h: string;
  b: string;
}

export interface IntegrationStep {
  n: string;
  t: string;
}

export interface Segment {
  label: string;
  kicker: string;
  title: string;
  sub: string;
  cta: string;
  statLabel: string;
  stats: Stat[];
  probTitle: string;
  probBody: string;
  fits: Fit[];
  outcomes: string[];
  integration: IntegrationStep[];
}

export const segments: Segment[] = [
  {
    label: "Banks & fintechs",
    kicker: "for banks & fintechs",
    title: "Solvency your supervisor can check in real time.",
    sub: "Report capital adequacy as a live, verifiable fact instead of a lagging spreadsheet, without ever shipping customer data outside the bank.",
    cta: "Talk to our team",
    statLabel: "what changes",
    stats: [
      { k: "Reporting lag", v: "real-time", accent: true },
      { k: "Customer data shared", v: "$0" },
      { k: "Audit prep", v: "continuous" },
    ],
    probTitle: "Capital adequacy is reported in arrears.",
    probBody:
      "Supervisors get a picture of the balance sheet weeks after the fact, assembled by hand and impossible to independently check. Between filings, no one outside the bank can confirm that reserves still cover deposits.",
    fits: [
      { n: "01", h: "Continuous proof", b: "Prove reserves are at least liabilities every block, straight from the core ledger." },
      { n: "02", h: "Edge proving", b: "Runs inside the bank. Deposit data never crosses the perimeter." },
      { n: "03", h: "Selective disclosure", b: "Hand a supervisor a verifiable figure without opening the whole book." },
    ],
    outcomes: [
      "Real-time evidence of solvency for supervisors",
      "Lower cost and effort of periodic audits",
      "Customer and counterparty trust by default",
      "No new honeypot of customer data",
    ],
    integration: [
      { n: "01", t: "Connect your core banking ledger and custody feeds inside your VPC." },
      { n: "02", t: "Deploy the Solva prover behind your firewall." },
      { n: "03", t: "Publish proofs to Stellar on the cadence your regulator expects." },
    ],
  },
  {
    label: "Exchanges",
    kicker: "for exchanges",
    title: "Proof of reserves is not proof of solvency.",
    sub: "Showing wallets full of assets says nothing about what you owe users. Solva proves reserves actually exceed liabilities, and lets every user check it.",
    cta: "Request a demo",
    statLabel: "reserves vs solvency",
    stats: [
      { k: "Liabilities included", v: "100%", accent: true },
      { k: "Snapshot gaming", v: "none" },
      { k: "User can self-verify", v: "yes" },
    ],
    probTitle: "A wallet screenshot is not a solvency statement.",
    probBody:
      "Classic proof of reserves shows assets exist on some date. It says nothing about customer liabilities, can be staged with borrowed funds, and goes stale immediately. Users learned the hard way that this gap is where exchanges fail.",
    fits: [
      { n: "01", h: "Liabilities in the proof", b: "The circuit sums every user balance and proves reserves clear it." },
      { n: "02", h: "Always current", b: "Continuous proofs, so there is no quarterly window to game." },
      { n: "03", h: "User inclusion", b: "Each user can confirm their balance was counted, privately." },
    ],
    outcomes: [
      "Trust grounded in math, not marketing",
      "Users verify their own inclusion",
      "A clear answer to “are you another FTX?”",
      "Differentiation on transparency",
    ],
    integration: [
      { n: "01", t: "Connect hot and cold wallet balances plus the liabilities ledger." },
      { n: "02", t: "Run the prover; publish a continuous solvency proof on Stellar." },
      { n: "03", t: "Embed the public verify widget for your users." },
    ],
  },
  {
    label: "Stablecoin issuers",
    kicker: "for stablecoin issuers",
    title: "Prove full backing, every block.",
    sub: "Replace the monthly attestation PDF with a continuous, on-chain proof that circulating supply is fully backed by reserves.",
    cta: "Request a demo",
    statLabel: "backing proof",
    stats: [
      { k: "Attestation cadence", v: "every block", accent: true },
      { k: "Backing proven", v: "≥ 100%" },
      { k: "Reserve detail leaked", v: "none" },
    ],
    probTitle: "Monthly attestations lag the moments that matter.",
    probBody:
      "Confidence in a stablecoin is tested in minutes, not months. A signed PDF from weeks ago cannot answer a depeg scare in real time, and publishing full reserve composition exposes commercially sensitive positions.",
    fits: [
      { n: "01", h: "Continuous backing", b: "Prove circulating supply is at most reserves on an ongoing basis." },
      { n: "02", h: "On-chain record", b: "Anyone can verify backing in a Stellar contract, anytime." },
      { n: "03", h: "Private reserves", b: "Prove sufficiency without revealing the exact reserve mix." },
    ],
    outcomes: [
      "Peg confidence backed by live evidence",
      "A credible answer during market stress",
      "Less reliance on slow attestation cycles",
      "Composition stays private",
    ],
    integration: [
      { n: "01", t: "Connect reserve custody accounts and the on-chain supply feed." },
      { n: "02", t: "Prove supply is fully backed inside your environment." },
      { n: "03", t: "Publish continuous backing proofs to Stellar." },
    ],
  },
  {
    label: "Regulators & auditors",
    kicker: "for regulators & auditors",
    title: "Verify solvency without holding the data.",
    sub: "Move from sampling spreadsheets after the fact to continuous, cryptographic oversight, with disclosure scoped to exactly what you need.",
    cta: "Talk to our team",
    statLabel: "oversight model",
    stats: [
      { k: "Coverage", v: "100%", accent: true },
      { k: "Bulk data held", v: "none" },
      { k: "Verification", v: "independent" },
    ],
    probTitle: "Bulk data requests are slow, risky, and partial.",
    probBody:
      "Gathering raw customer data to test solvency creates a liability for everyone and still only samples a moment in time. By the time it is reviewed, the picture has already moved.",
    fits: [
      { n: "01", h: "Selective disclosure", b: "Receive exactly the attribute you need, cryptographically attested." },
      { n: "02", h: "Independent verify", b: "Re-run any proof against the Stellar registry yourself." },
      { n: "03", h: "Continuous coverage", b: "Oversight that updates every block, not every quarter." },
    ],
    outcomes: [
      "Continuous, verifiable supervision",
      "No custody of sensitive bulk data",
      "Faster, cheaper examination cycles",
      "Tamper-evident, on-chain audit trail",
    ],
    integration: [
      { n: "01", t: "Receive proofs and disclosures through the Solva registry." },
      { n: "02", t: "Verify independently against Stellar, no vendor trust required." },
      { n: "03", t: "Request scoped disclosures from supervised institutions." },
    ],
  },
];
