import type { ReactNode } from "react";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { StatusTag } from "@/components/ui/status-tag";
import { AuditorFigure, LendingFigure, WalletFigure } from "./reader-views";

interface Reader {
  id: string;
  name: string;
  reads: string;
  acts: string;
  figure: ReactNode;
}

const READERS: readonly Reader[] = [
  {
    id: "wallet",
    name: "A wallet",
    reads:
      "Will read the state from Stellar for free and show it beside each balance and on every send screen.",
    acts: "Will show stale as unknown, and short with the size of its gap, so a user never sees a stamp the record does not support.",
    figure: <WalletFigure />,
  },
  {
    id: "lending",
    name: "A lending pool",
    reads: "Will check the state on Stellar before it accepts the token as collateral.",
    acts: "Will accept deposits while the asset is covered and pause new deposits while it is short or stale, without anyone having to watch a dashboard.",
    figure: <LendingFigure />,
  },
  {
    id: "auditor",
    name: "An auditor",
    reads: "Reads each proof with its ledger on Stellar between audits.",
    acts: "Will file the record as daily evidence alongside the audit, with a dated row for every day of the period and a visible gap wherever a proof did not arrive.",
    figure: <AuditorFigure />,
  },
];

export function RecordReaders() {
  return (
    <Chapter id="readers" index="03" labelledBy="readers-title">
      <ChapterHead
        id="readers-title"
        label="Three readers"
        title="One record, read three ways."
        lead="A wallet, a lending pool and an auditor each ask the record a different question. None of them needs an account with Solva, and none needs permission from the institution. Reading the verified totals is free today; record states and daily history are coming soon."
      />
      <ul data-rows className="mt-14 border-t border-line">
        {READERS.map((reader) => (
          <li
            key={reader.id}
            className="grid gap-8 border-b border-line py-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:py-14"
          >
            <div>
              <h3 className="flex flex-wrap items-center gap-3 font-display text-h2">
                {reader.name}
                <StatusTag status="coming-soon" />
              </h3>
              <p className="mt-5 text-small font-medium text-sec">What it reads</p>
              <p className="mt-1 max-w-[36rem] text-body text-sec">{reader.reads}</p>
              <p className="mt-5 text-small font-medium text-sec">What it does</p>
              <p className="mt-1 max-w-[36rem] text-body text-sec">{reader.acts}</p>
            </div>
            <div className="min-w-0">{reader.figure}</div>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
