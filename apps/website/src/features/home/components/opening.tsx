"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Provenance, ledgerLabel } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { StateStamp } from "@/components/ui/state-stamp";
import { routes } from "@/config/navigation";
import { coveragePercent } from "@/lib/amount";
import { heldShare } from "@/lib/coverage";
import { formatDay, kestrelHistory, kestrelRecord } from "@/lib/record-history";
import { useOpeningLoop } from "../hooks/use-opening-loop";
import { useOpeningMotion } from "../hooks/use-opening-motion";

const DAYS = kestrelHistory.slice(-7);

export function Opening() {
  const scope = useRef<HTMLElement>(null);
  useOpeningMotion(scope);
  const index = useOpeningLoop(scope, DAYS.length);
  const day = DAYS[index] ?? DAYS[DAYS.length - 1];
  const record = { ...kestrelRecord, owed: day.owed, held: day.held, state: day.state };
  const percent = coveragePercent(day.owed, day.held) ?? "Unknown";

  return (
    <section
      ref={scope}
      aria-labelledby="hero-title"
      className="relative px-5 pt-14 pb-14 sm:px-8 sm:pt-20 lg:px-12 lg:pt-24 lg:pb-20"
    >
      <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <h1 id="hero-title" className="max-w-[20ch] font-display text-display">
            <span className="sr-only">Reserve coverage, proven every day.</span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.08em]">
              <span data-intro data-line className="block">
                Reserve coverage,
              </span>
            </span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.1em]">
              <span data-intro data-line className="block">
                proven every day.
              </span>
            </span>
          </h1>
          <p data-intro data-fade className="mt-7 max-w-[34rem] text-lead text-sec">
            Solva gives anchors and custodial apps on Stellar a public record that their reserves
            cover what they owe. A contract on Stellar checks every proof, and anyone can read the
            result without asking you. Running on Stellar Testnet today, with daily publishing
            coming soon.
          </p>
          <div data-intro data-fade className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={routes.contact}>
                Talk to us
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#how-a-record-is-made">How a record is made</Link>
            </Button>
          </div>
        </div>

        <figure data-intro data-fade className="min-w-0 lg:justify-self-end">
          <div data-hero-seal>
            <SealInstrument
              mode="meter"
              share={heldShare(record)}
              state={record.state}
              title={`Coverage meter for ${record.asset}, one day at a time`}
              className="mx-auto w-64 sm:w-80 lg:w-[22rem]"
            >
              <span
                data-hero-value={percent.replace("%", "")}
                className="seal-value font-display num"
              >
                {percent}
              </span>
              <span className="mt-2 text-small text-sec">Coverage</span>
              <span data-hero-stamp className="mt-3 inline-flex">
                <StateStamp state={record.state} />
              </span>
            </SealInstrument>
          </div>
          <figcaption className="mt-5 flex flex-col items-center gap-2 text-center lg:items-end lg:text-right">
            <p className="font-display text-h3">
              {record.institution}
              <span className="text-sec"> · {record.asset}</span>
            </p>
            <div data-hero-day>
              <Provenance
                parts={[
                  "Example record",
                  formatDay(day.date),
                  day.ledger ? ledgerLabel(day.ledger) : "No proof that day",
                ]}
              />
            </div>
            <p className="text-small text-sec">
              Day {index + 1} of {DAYS.length}. A new proof, a new line, every day.
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
