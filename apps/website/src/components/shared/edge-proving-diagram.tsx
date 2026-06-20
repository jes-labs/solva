import { Card } from "@/components/ui";

// The edge-proving diagram: ledgers and the prover sit inside the institution's
// dashed perimeter, and only the proof leaves to the Stellar registry. Shared by
// the How It Works and Security pages.
export function EdgeProvingDiagram({
  registryLabel = "Stellar contract → public registry",
}: {
  registryLabel?: string;
}) {
  return (
    <Card className="p-8">
      <div className="rounded-[14px] border border-dashed border-hair-strong p-[22px]">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
          Your perimeter
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[110px] flex-1 rounded-[10px] border border-hair bg-bg p-3.5 text-center text-[13px] text-sec">
            Ledgers & custody
          </div>
          <span className="text-sec">→</span>
          <div className="min-w-[110px] flex-1 rounded-[10px] border border-acc-deep bg-bg p-3.5 text-center text-[13px] text-fg">
            Solva prover
          </div>
        </div>
      </div>
      <div className="py-4 text-center font-mono text-xs text-sec">proof only ↓</div>
      <div className="rounded-[10px] border border-hair bg-bg p-3.5 text-center text-[13px] text-acc-text">
        {registryLabel}
      </div>
    </Card>
  );
}
