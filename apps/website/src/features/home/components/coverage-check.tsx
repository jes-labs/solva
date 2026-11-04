"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ChapterHead, LeaderRow, Provenance } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { StateStamp } from "@/components/ui/state-stamp";
import { routes } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useCoverageCheck } from "../hooks/use-coverage-check";

const MIN = 8500;
const MAX = 11500;

const STATES = [
  {
    state: "covered",
    body: "Reserves are at least what is owed, at a ledger anyone can look up.",
    effect: "Partners keep accepting the asset.",
  },
  {
    state: "short",
    body: "Reserves are below what is owed. The record shows the gap in full and never rounds it away.",
    effect: "Lending pools pause new borrowing against it.",
  },
  {
    state: "stale",
    body: "No new proof arrived inside the expected window. Readers treat coverage as unknown until one does.",
    effect: "Wallets show the asset as unverified.",
  },
] as const;

export function CoverageCheck() {
  const check = useCoverageCheck();
  const progress = ((check.basisPoints - MIN) / (MAX - MIN)) * 100;

  return (
    <section
      id="check-it-yourself"
      aria-labelledby="check-title"
      className="chapter relative border-t border-line"
    >
      <span aria-hidden="true" className="chapter-index">
        05
      </span>
      <div className="px-5 py-[clamp(4.5rem,9vw,8.5rem)] sm:px-8 lg:px-12">
        <ChapterHead
          id="check-title"
          label="Check it yourself"
          title="Three answers: covered, short or stale."
          lead="Move the reserves up and down and watch the record change, the way a holder, a wallet or a lending pool would see it."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <ol data-rows className="flex flex-col border-t border-line">
            {STATES.map((item) => {
              const active = check.state === item.state;
              return (
                <li
                  key={item.state}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative flex flex-col gap-2 border-b border-line py-5 pl-6 transition-opacity",
                    active ? "opacity-100" : "opacity-50",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-5 bottom-5 left-0 w-0.5",
                      active ? "bg-signal" : "bg-transparent",
                    )}
                  />
                  <StateStamp state={item.state} className="self-start" />
                  <p className="text-body text-sec">{item.body}</p>
                  <p className="text-small text-sec">{item.effect}</p>
                </li>
              );
            })}
            <li className="py-5 text-small text-sec">
              Custodial apps add one more check: each customer can confirm that their own balance
              was counted.{" "}
              <Link
                href={`${routes.custodialApps}#inclusion`}
                className="text-text underline decoration-link-line underline-offset-4"
              >
                Try the holder check
              </Link>
              .
            </li>
          </ol>

          <div className="ruled-marks relative border border-line bg-bg p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-small text-sec">Instrument · example · ARSK</p>
                <p className="mt-1 font-display text-h3">Kestrel Anchor</p>
              </div>
              <StateStamp state={check.state} />
            </div>

            <div className="mt-8 grid items-center gap-8 sm:grid-cols-[13rem_1fr]">
              <SealInstrument
                mode="meter"
                share={check.share}
                state={check.state}
                className="mx-auto w-48 sm:w-full"
              >
                <output
                  htmlFor="reserves"
                  aria-live="polite"
                  className={cn(
                    "seal-value font-display num",
                    check.state === "short" && "text-short",
                    check.state === "stale" && "text-stale",
                  )}
                >
                  {check.state === "stale" ? "Unknown" : check.percent}
                </output>
                <span className="mt-1.5 text-small text-sec">
                  {check.state === "stale" ? "No recent proof" : "Coverage"}
                </span>
              </SealInstrument>

              <div className="flex flex-col gap-3">
                <LeaderRow label="Owed to holders" value={check.owed} />
                <LeaderRow label="Held in reserve" value={check.held} />
                <LeaderRow
                  label={check.state === "short" ? "Shortfall" : "Surplus"}
                  value={check.state === "short" ? check.shortfall : check.surplus}
                  tone={check.state === "short" ? "short" : "signal"}
                />
              </div>
            </div>

            <label
              htmlFor="reserves"
              className="mt-8 flex items-center justify-between text-small font-medium text-sec"
            >
              Reserves held
              <span>85% to 115% of owed</span>
            </label>
            <input
              id="reserves"
              type="range"
              min={MIN}
              max={MAX}
              step={5}
              value={check.basisPoints}
              onChange={(event) => check.setBasisPoints(Number(event.target.value))}
              aria-valuetext={`${check.percent} of what is owed`}
              className="gauge-range mt-2 w-full"
              style={{ "--progress": `${progress}%` } as CSSProperties}
            />

            <fieldset className="mt-6">
              <legend className="text-small font-medium text-sec">Last proof</legend>
              <div className="mt-2 grid grid-cols-2 border border-line">
                {[
                  { fresh: true, label: "2 hours ago" },
                  { fresh: false, label: "3 days ago" },
                ].map((option) => (
                  <label
                    key={option.label}
                    className={cn(
                      "cursor-pointer px-4 py-2.5 text-center text-small font-medium transition-colors first:border-r first:border-line has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                      check.fresh === option.fresh ? "bg-text text-bg" : "text-sec hover:bg-raised",
                    )}
                  >
                    <input
                      type="radio"
                      name="freshness"
                      className="sr-only"
                      checked={check.fresh === option.fresh}
                      onChange={() => check.setFresh(option.fresh)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Provenance
              parts={[
                "Example figures",
                "Ledger 3,412,088",
                check.fresh ? "Proof 2 h ago" : "Proof 3 d ago",
              ]}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
