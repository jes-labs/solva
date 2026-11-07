import { Chapter, ChapterHead, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { StatusTag } from "@/components/ui/status-tag";
import type { CoverageState } from "@/lib/coverage";
import { exampleRecords } from "@/lib/example-records";
import { dailyHistory, summarizeDays } from "../lib/history";
import { DayTicks } from "./day-ticks";

const record = exampleRecords[0];
const DAYS = dailyHistory(28, { 9: "stale" });

const TOML = `[[CURRENCIES]]
code = "ARSK"
attestation_of_reserve =
  "https://joinsolva.xyz/registry/kestrel-anchor/ARSK"`;

const STATES: readonly { state: CoverageState; shown: string }[] = [
  { state: "covered", shown: "Reserves at or above supply" },
  { state: "short", shown: "Reserves below supply, with the gap" },
  { state: "stale", shown: "No proof inside the expected window" },
];

export function AnchorReaders() {
  return (
    <Chapter id="what-readers-see" index="02" labelledBy="anchor-readers-title">
      <ChapterHead
        id="anchor-readers-title"
        label="What holders and partners see"
        title="One answer for everyone who holds your token."
        lead="Every holder wants to know whether the token is backed. In November 2026, 6 of the 74 anchors in the Stellar Anchor Directory were marked as publishing reserve evidence, and 2 of those links opened a report. Each record answers the question, with the proof behind the answer, and wallets, lending pools and auditors read the same record without asking you."
        align="end"
      />
      <div data-rows className="mt-14 grid border border-line lg:grid-cols-3">
        <div className="min-w-0 border-b border-line p-6 lg:border-r lg:border-b-0">
          <h3 className="flex flex-wrap items-center gap-3 font-display text-h3">
            Holders
            <StatusTag status="coming-soon" />
          </h3>
          <p className="mt-3 text-body text-sec">
            Every token you issue will get a public page at a stable address that you can link from
            your stellar.toml, your site and your exchange listings.
          </p>
          <Provenance className="mt-6" parts={["Planned format"]} />
          <pre className="mt-2 overflow-x-auto border-t border-line pt-4 font-mono text-micro leading-relaxed text-text">
            <code>{TOML}</code>
          </pre>
        </div>
        <div className="min-w-0 border-b border-line p-6 lg:border-r lg:border-b-0">
          <h3 className="flex flex-wrap items-center gap-3 font-display text-h3">
            Wallets and lending pools
            <StatusTag status="coming-soon" />
          </h3>
          <p className="mt-3 text-body text-sec">
            Partners will read the state beside the balance. Short and stale will be shown as
            plainly as covered, each with the ledger it was checked at.
          </p>
          <ul className="mt-6 border-t border-line">
            {STATES.map((item) => (
              <li
                key={item.state}
                className="flex items-center justify-between gap-3 border-b border-line py-3 text-small text-text"
              >
                {item.shown}
                <StateStamp state={item.state} />
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 p-6">
          <h3 className="font-display text-h3">Auditors</h3>
          <p className="mt-3 text-body text-sec">
            Your auditor&apos;s report stays where it is. Between reports, each proof is a dated
            result tied to a Stellar ledger, as evidence your auditor can check. Daily history is
            coming soon.
          </p>
          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <p className="text-small text-sec">Last 28 days</p>
            <p className="font-mono text-micro text-sec num">{summarizeDays(DAYS)}</p>
          </div>
          <DayTicks className="mt-3" days={DAYS} label="Coverage over the last 28 days" />
        </div>
      </div>
      <Provenance
        className="mt-6"
        parts={["Example", `${record.institution} · ${record.asset}`, ledgerLabel(record.ledger)]}
      />
    </Chapter>
  );
}
