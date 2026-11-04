import { LeaderRow, Provenance } from "@/components/ui/ledger";

interface PasskeyApprovalFragmentProps {
  institution: string;
  asset: string;
  change: string;
  requestedBy: string;
}

export function PasskeyApprovalFragment({
  institution,
  asset,
  change,
  requestedBy,
}: PasskeyApprovalFragmentProps) {
  const rows = [
    { label: "Change", value: change },
    { label: "Requested by", value: requestedBy },
    { label: "Takes effect", value: "From the next proof" },
  ] as const;

  return (
    <div className="ruled-marks relative border border-line bg-bg p-5 sm:p-7">
      <p className="text-small text-sec">Approval · example</p>
      <p className="mt-1 font-display text-h3">Approve this change</p>
      <dl className="mt-6 border-t border-line">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-3"
          >
            <dt className="text-small text-sec">{row.label}</dt>
            <dd className="text-small text-text">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-2.5">
        <LeaderRow label="Signed with" value="Passkey on device" />
        <LeaderRow label="Key leaves the device" value="Never" tone="signal" />
        <LeaderRow label="Secret to copy" value="None" />
      </div>
      <Provenance className="mt-6" parts={["Example", `${institution} · ${asset}`]} />
    </div>
  );
}
