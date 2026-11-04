import { Chapter, ChapterHead, Provenance } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import type { CoverageState } from "@/lib/coverage";

const ALERTS: readonly { title: string; state: CoverageState; body: string; when: string }[] = [
  {
    title: "EURC at Arden Pay turned short",
    state: "short",
    body: "Reserves were 98.50% of what is owed at ledger 3,411,640. The gap is 43,545.90 EURC.",
    when: "4 hours ago",
  },
  {
    title: "USDC at Halden Exchange is stale",
    state: "stale",
    body: "No proof in the last 24 hours. The last result was covered, at ledger 3,389,212.",
    when: "7 hours ago",
  },
  {
    title: "ARSK at Kestrel Anchor is covered",
    state: "covered",
    body: "Reserves were 103.61% of the tokens in circulation at ledger 3,412,088.",
    when: "2 hours ago",
  },
];

export function PartnerAlerts() {
  return (
    <Chapter id="alerts" index="04" labelledBy="alerts-title" tone="tint">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
        <ChapterHead
          id="alerts-title"
          label="Alerts"
          title="Know the moment an asset turns."
          lead="Partners watch the assets they hold or accept, and act the moment one turns short or stale, before their own customers start asking. Alerts are coming soon."
        />
        <div className="ruled-marks relative border border-line bg-bg">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
            <p className="text-small text-sec">Watched assets · example</p>
            <p className="font-mono text-micro text-sec num">{ALERTS.length} watched</p>
          </div>
          <ul>
            {ALERTS.map((alert) => (
              <li key={alert.title} className="border-b border-line px-5 py-4 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-h3">{alert.title}</p>
                  <StateStamp state={alert.state} />
                </div>
                <p className="mt-2 text-small text-sec">{alert.body}</p>
                <Provenance className="mt-3" parts={[alert.when]} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Chapter>
  );
}
