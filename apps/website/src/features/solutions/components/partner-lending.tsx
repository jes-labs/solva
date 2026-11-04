"use client";

import { Chapter, ChapterHead, LeaderRow, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import type { CoverageState } from "@/lib/coverage";
import { exampleRecords } from "@/lib/example-records";
import { cn } from "@/lib/utils";
import { useCollateralRule } from "../hooks/use-collateral-rule";

const record = exampleRecords[0];

const OPTIONS: readonly { value: CoverageState; label: string }[] = [
  { value: "covered", label: "Covered" },
  { value: "short", label: "Short" },
  { value: "stale", label: "Stale" },
];

export function PartnerLending() {
  const { state, setState, decision } = useCollateralRule(record.asset);

  return (
    <Chapter id="lending-pools" index="02" labelledBy="lending-title">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <ChapterHead
            id="lending-title"
            label="Lending pools"
            title="Accept collateral while it is covered."
            lead="A lending pool checks the verdict before each deposit. Covered assets are accepted. Short or stale assets wait until a new proof shows them covered again."
          />
          <fieldset className="mt-10">
            <legend className="text-small font-medium text-sec">
              Set the verdict for {record.asset}
            </legend>
            <div className="mt-2 grid grid-cols-3 border border-line">
              {OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer px-4 py-2.5 text-center text-small font-medium transition-colors border-r border-line last:border-r-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                    state === option.value ? "bg-text text-bg" : "text-sec hover:bg-raised",
                  )}
                >
                  <input
                    type="radio"
                    name="lending-state"
                    value={option.value}
                    checked={state === option.value}
                    onChange={() => setState(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div
          aria-live="polite"
          className="ruled-marks relative border border-line bg-bg p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-small text-sec">Lending pool rule · example</p>
              <p className="mt-1 font-display text-h3">{record.asset} deposits</p>
            </div>
            <StateStamp state={state} />
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <LeaderRow label="Call (planned)" value="is_covered(issuer, asset)" />
            <LeaderRow label="Verdict" value={state} />
            <LeaderRow label="Accept when" value="covered" />
            <LeaderRow
              label="Decision"
              value={decision.status}
              tone={decision.isAccepting ? "signal" : "short"}
            />
          </div>
          <p className="mt-5 text-small text-sec">{decision.reason}</p>
          <Provenance
            className="mt-6"
            parts={[
              "Example",
              `${record.institution} · ${record.asset}`,
              ledgerLabel(record.ledger),
            ]}
          />
        </div>
      </div>
    </Chapter>
  );
}
