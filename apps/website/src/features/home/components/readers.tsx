import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Chapter, ChapterHead, LeaderRow } from "@/components/ui/ledger";
import { RecordDocument } from "@/components/ui/record-document";
import { routes } from "@/config/navigation";
import { exampleRecords } from "@/lib/example-records";

function InclusionFigure() {
  return (
    <div className="ruled-marks relative border border-line bg-bg p-5 font-mono text-small num">
      <p className="font-sans text-small text-sec">Holder check · example</p>
      <div className="mt-4 flex flex-col gap-2.5">
        <LeaderRow label="Account" value="GBX7…K4QE" />
        <LeaderRow label="Record" value="Northway Custody · USDC · 2026-11-02" />
        <LeaderRow label="Check" value="Against the commitment" />
        <LeaderRow label="Result" value="Counted" tone="signal" />
      </div>
      <p className="mt-4 font-sans text-small text-sec">
        No other customer is named. The path shows unnamed subtotals, including one neighbouring
        balance.
      </p>
    </div>
  );
}

function PolicyFigure() {
  return (
    <div className="ruled-marks relative border border-line bg-bg p-5 font-mono text-small num">
      <p className="font-sans text-small text-sec">Lending pool rule · example</p>
      <div className="mt-4 flex flex-col gap-2.5">
        <LeaderRow label="Call (planned)" value="is_covered(issuer, asset)" />
        <LeaderRow label="Accept when" value="covered" />
        <LeaderRow label="Record age" value="under 24 hours" />
        <LeaderRow label="Otherwise" value="pause new borrowing" tone="short" />
      </div>
      <p className="mt-4 font-sans text-small text-sec">
        Reading a record is free. The one-call registry interface is planned; today a pool reads the
        latest proof from the institution&apos;s contract.
      </p>
    </div>
  );
}

const READERS = [
  {
    title: "Anchors",
    line: "Show holders and partners the token is backed.",
    body: "You issue a fiat token on Stellar, and its supply is already public. Solva puts your reserve balance, signed by your custodian or read from Stellar, beside what you owe and proves the reserves cover it, so the question of backing gets an answer you did not write yourself. Daily records are coming soon.",
    figure: <RecordDocument record={exampleRecords[0]} variant="compact" />,
    href: routes.anchors,
  },
  {
    title: "Custodial apps",
    line: "Prove your reserves cover what you owe customers, and let each one check.",
    body: "You hold customer money and move it over Stellar. You commit the list of balances as one value and prove that the total is covered. Every customer can then confirm their balance was counted, without any other customer being named.",
    figure: <InclusionFigure />,
    href: routes.custodialApps,
  },
  {
    title: "Partners",
    line: "Wallets, lending pools and auditors read coverage for free.",
    body: "A lending pool reads the latest verified totals before it accepts an asset as collateral. A wallet shows them next to a balance. An auditor reads each dated proof. None of them needs the issuer's permission. A one-call verdict and a daily evidence export are coming soon.",
    figure: <PolicyFigure />,
    href: routes.partners,
  },
] as const;

export function Readers() {
  return (
    <Chapter id="who-reads-it" index="04" labelledBy="readers-title">
      <ChapterHead
        id="readers-title"
        label="Who reads it"
        title="Written once, read by everyone who relies on the number."
        align="end"
      />
      <div data-rows className="mt-14 border-t border-line">
        {READERS.map((reader, index) => (
          <details
            key={reader.title}
            name="readers"
            open={index === 0}
            className="group border-b border-line"
          >
            <summary className="flex cursor-pointer list-none items-center gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-micro tracking-[0.08em] text-faint uppercase num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-display text-h2">{reader.title}</span>
                <span className="text-body text-sec">{reader.line}</span>
              </span>
              <span
                aria-hidden="true"
                className="font-mono text-h3 text-faint transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="grid gap-8 pb-10 pl-0 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:pl-12">
              <div>
                <p className="max-w-[40rem] text-body text-sec">{reader.body}</p>
                <Link
                  href={reader.href}
                  className="mt-6 inline-flex items-center gap-2 text-small font-medium underline decoration-line-strong underline-offset-4 hover:decoration-text"
                >
                  For {reader.title.toLowerCase()}
                  <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
              <div>{reader.figure}</div>
            </div>
          </details>
        ))}
      </div>
    </Chapter>
  );
}
