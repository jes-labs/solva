import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Provenance, ledgerLabel } from "@/components/ui/ledger";
import {
  assetExplorerUrl,
  formatClosedAt,
  wholeUnits,
  type SupplySnapshot,
} from "@/lib/stellar-supply";
import { cn } from "@/lib/utils";

interface SupplyFigureProps {
  snapshot: SupplySnapshot | null;
  className?: string;
}

export function SupplyFigure({ snapshot, className }: SupplyFigureProps) {
  return (
    <div data-reveal className={cn("ruled-marks relative border border-line bg-bg", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-small font-medium text-sec">Read from Stellar when this page loaded</p>
        <p className="text-small text-sec">Mainnet · Horizon</p>
      </div>
      {snapshot ? (
        <table className="w-full text-small">
          <thead>
            <tr className="border-b border-line text-left text-sec">
              <th scope="col" className="px-5 py-2.5 font-medium">
                Asset
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">
                In circulation
              </th>
              <th scope="col" className="hidden px-5 py-2.5 text-right font-medium sm:table-cell">
                Trustlines
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row) => (
              <tr key={row.asset.code} className="border-b border-line last:border-b-0">
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <a
                    href={assetExplorerUrl(row.asset)}
                    className="inline-flex items-center gap-1 text-text underline decoration-line-strong underline-offset-4 hover:decoration-text"
                  >
                    {row.asset.code}
                    <ArrowUpRightIcon aria-hidden="true" className="size-3 text-faint" />
                  </a>
                  <span className="block text-sec">{row.asset.issuerName}</span>
                </th>
                <td className="px-5 py-3 text-right font-mono num">{wholeUnits(row.supply)}</td>
                <td className="hidden px-5 py-3 text-right font-mono num sm:table-cell">
                  {row.holders.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-5 py-6 text-body text-sec">
          Stellar could not be read when this page loaded. Nothing is shown in its place; reload to
          try again.
        </p>
      )}
      <div className="border-t border-line px-5 py-3">
        <Provenance
          parts={
            snapshot
              ? [
                  ledgerLabel(snapshot.ledger),
                  formatClosedAt(snapshot.closedAt),
                  "Supply as Horizon reports it",
                ]
              : ["Horizon unreachable", "No figure shown"]
          }
        />
      </div>
    </div>
  );
}
