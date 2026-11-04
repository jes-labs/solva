"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Provenance, ledgerLabel } from "@/components/ui/ledger";
import { cn } from "@/lib/utils";
import { northwaySnapshot } from "../lib/inclusion";
import { useInclusionCheck } from "../hooks/use-inclusion-check";
import { InclusionResultPanel } from "./inclusion-result";

export function InclusionCheck() {
  const snapshot = northwaySnapshot;
  const { query, result, setQuery, pick, submit } = useInclusionCheck(snapshot, "NWC-0418");
  const titleId = useId();
  const inputId = useId();
  const hintId = useId();
  const picked = result.status === "counted" ? result.reference : null;

  return (
    <div
      id="inclusion"
      role="group"
      aria-labelledby={titleId}
      className="ruled-marks relative border border-line bg-bg p-5 text-text sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-small text-sec">Customer check · example</p>
          <p id={titleId} className="mt-1 font-display text-h3">
            {snapshot.institution} <span className="text-sec">· {snapshot.asset}</span>
          </p>
        </div>
        <p className="font-mono text-micro text-sec num">{ledgerLabel(snapshot.ledger)}</p>
      </div>

      <div className="mt-5">
        <InclusionResultPanel result={result} snapshot={snapshot} />
      </div>

      <fieldset className="mt-6">
        <legend className="text-small font-medium text-sec">Check as one of these customers</legend>
        <div className="mt-2 grid grid-cols-2 border-t border-l border-line sm:grid-cols-4">
          {snapshot.customers.map((customer) => (
            <label
              key={customer.reference}
              className={cn(
                "cursor-pointer border-r border-b border-line px-3 py-2.5 text-center font-mono text-small num transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                picked === customer.reference ? "bg-text text-bg" : "text-sec hover:bg-raised",
              )}
            >
              <input
                type="radio"
                name="inclusion-customer"
                value={customer.reference}
                checked={picked === customer.reference}
                onChange={() => pick(customer.reference)}
                className="sr-only"
              />
              {customer.reference}
            </label>
          ))}
        </div>
      </fieldset>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="block text-small font-medium text-sec">
          Or enter an account reference
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={inputId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={hintId}
            aria-invalid={result.status === "invalid"}
            className="h-11 min-w-0 flex-1 rounded-btn border border-line-strong bg-transparent px-4 font-mono text-small text-text uppercase num outline-none focus-visible:border-text aria-invalid:border-short-fill"
          />
          <Button type="submit">Check</Button>
        </div>
        <p id={hintId} className="mt-2 text-small text-sec">
          Three letters and four digits, exactly as shown in the customer&apos;s app.
        </p>
      </form>

      <Provenance
        className="mt-6"
        parts={["Example", ledgerLabel(snapshot.ledger), "Proof checked on Stellar"]}
      />
    </div>
  );
}
