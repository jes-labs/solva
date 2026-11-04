import { Chapter, ChapterHead, Provenance } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import type { CoverageState } from "@/lib/coverage";

interface Verdict {
  state: CoverageState;
  meaning: string;
  wallet: string;
  pool: string;
  auditor: string;
}

const VERDICTS: readonly Verdict[] = [
  {
    state: "covered",
    meaning: "Reserves were at least what is owed at the last proof.",
    wallet: "Show the mark beside the balance, with the percentage and when it was proven.",
    pool: "Accept the asset as collateral and record the ledger it was checked at.",
    auditor: "One more dated result for the file, tied to a ledger.",
  },
  {
    state: "short",
    meaning: "Reserves were below what is owed. The record shows the gap.",
    wallet: "Show the gap, so holders know before they send or swap.",
    pool: "Pause new borrowing against it until a proof shows it covered again.",
    auditor: "A dated shortfall with its size, never rounded away.",
  },
  {
    state: "stale",
    meaning: "No new proof arrived inside the expected window.",
    wallet: "Say that no recent proof arrived. Never show the last result as current.",
    pool: "Treat coverage as unknown and pause until the next proof lands.",
    auditor: "A missing day, visible as a gap in the daily evidence.",
  },
];

const READERS = [
  { key: "wallet", label: "For a wallet" },
  { key: "pool", label: "For a lending pool" },
  { key: "auditor", label: "For an auditor" },
] as const;

export function PartnerVerdicts() {
  return (
    <Chapter id="verdicts" index="01" labelledBy="verdicts-title">
      <ChapterHead
        id="verdicts-title"
        label="Reading a verdict"
        title="Three verdicts, and what each reader does with them."
        lead="Each record will carry one of three verdicts. Read it, check the ledger it was made at, and act on it. Verdicts are coming soon: today a reader gets the verified totals and works out the verdict itself."
      />
      <div className="mt-14 border-t border-line">
        {VERDICTS.map((verdict) => (
          <div
            key={verdict.state}
            className="grid gap-5 border-b border-line py-6 md:grid-cols-[11rem_1fr_1fr_1fr] md:gap-8"
          >
            <div>
              <StateStamp state={verdict.state} />
              <p className="mt-3 text-small text-sec">{verdict.meaning}</p>
            </div>
            {READERS.map((reader) => (
              <div key={reader.key} className="min-w-0">
                <p className="text-small font-medium text-sec">{reader.label}</p>
                <p className="mt-1 text-body text-text">{verdict[reader.key]}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Provenance className="mt-6" parts={["Coming soon", "One verdict per record"]} />
    </Chapter>
  );
}
