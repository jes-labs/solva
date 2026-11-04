import type { ReactNode } from "react";
import { Chapter, ChapterHead, Provenance, Ruled, ledgerLabel } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { coveragePercent, formatAmount } from "@/lib/amount";
import { KESTREL_ISSUER, kestrelRecord, truncateAddress } from "@/lib/record-history";

interface Field {
  label: string;
  value: ReactNode;
  note: string;
}

export function RecordSheet() {
  const record = kestrelRecord;
  const surplus = record.held > record.owed ? record.held - record.owed : 0n;

  const fields: readonly Field[] = [
    {
      label: "Institution",
      value: <span className="font-sans">{record.institution}</span>,
      note: "Who owes the asset. An anchor that issues it, or a custodial app that holds it for customers.",
    },
    {
      label: "Asset",
      value: (
        <span>
          {record.asset}{" "}
          <span className="text-sec" title={KESTREL_ISSUER}>
            · {truncateAddress(KESTREL_ISSUER)}
          </span>
        </span>
      ),
      note: "The token and its issuing account on Stellar. One record per asset, never a blended figure.",
    },
    {
      label: "Owed",
      value: <span data-count>{formatAmount(record.owed, record.decimals)}</span>,
      note: "The supply of the token, read from Stellar at the ledger named below. For a custodial app, the total of the customer balances it committed that day.",
    },
    {
      label: "Held",
      value: <span data-count>{formatAmount(record.held, record.decimals)}</span>,
      note: "The balance of the reserve accounts, signed by the account that holds them.",
    },
    {
      label: "Coverage",
      value: <span data-count>{coveragePercent(record.owed, record.held)}</span>,
      note: "Held divided by owed, cut off at two decimals. It is never rounded up.",
    },
    {
      label: "Surplus",
      value: <span data-count>{formatAmount(surplus, record.decimals)}</span>,
      note: "Held minus owed. On a short day this line reads shortfall and shows the gap in full.",
    },
    {
      label: "State",
      value: <StateStamp state={record.state} />,
      note: "Covered, short or stale. Nothing in between, and never shown by colour alone.",
    },
    {
      label: "Ledger",
      value: <span data-count>{record.ledger.toLocaleString("en-US")}</span>,
      note: "The ledger at which the contract on Stellar checked the proof. It serves as the timestamp, and anyone can look it up.",
    },
    {
      label: "Proven",
      value: record.provenAgo,
      note: "How old the latest proof is. Once it passes the agreed window, the state turns stale by itself.",
    },
    {
      label: "Schedule",
      value: "Daily, 06:00 UTC",
      note: "The cadence agreed with the institution. Daily by default.",
    },
  ];

  return (
    <Chapter id="field-by-field" index="01" labelledBy="sheet-title">
      <ChapterHead
        id="sheet-title"
        label="Field by field"
        title="Ten lines, and what stands behind each."
        lead="Supply is read from Stellar, reserves are signed by the account that holds them, and a contract on Stellar writes the result every morning. Nothing on this sheet is typed in by hand."
        align="end"
      />
      <Ruled marks className="mt-14 bg-bg">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-small text-sec">Coverage record · Example</p>
            <p className="mt-1 truncate font-display text-h3">
              {record.institution} <span className="text-sec">· {record.asset}</span>
            </p>
          </div>
          <StateStamp state={record.state} />
        </header>
        <dl data-rows>
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-2 border-b border-line px-5 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.4fr)]"
            >
              <dt className="text-small font-medium text-sec">{field.label}</dt>
              <dd className="min-w-0 font-mono text-small break-all text-text num">
                {field.value}
              </dd>
              <dd className="min-w-0 text-small text-sec sm:col-start-2 lg:col-start-3">
                {field.note}
              </dd>
            </div>
          ))}
        </dl>
        <footer className="px-5 py-3">
          <Provenance
            parts={[
              "Example record",
              ledgerLabel(record.ledger),
              record.provenAgo,
              "Proof checked on Stellar",
            ]}
          />
        </footer>
      </Ruled>
    </Chapter>
  );
}
