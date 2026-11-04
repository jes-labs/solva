import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { PasskeyApprovalFragment } from "./passkey-approval-fragment";

export function AnchorControl() {
  return (
    <Chapter id="control" index="03" labelledBy="anchor-control-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
        <ChapterHead
          id="anchor-control-title"
          label="Control"
          title="Your passkey controls your entry."
          lead="Only your team's passkey can own the entry and grant the key that publishes proofs, and it never leaves a team member's own device. Approving changes to reserve sources and listed assets with a passkey is coming soon."
        />
        <div className="min-w-0">
          <PasskeyApprovalFragment
            institution="Kestrel Anchor"
            asset="ARSK"
            change="Add a reserve account at Halcyon Trust"
            requestedBy="Treasury team, Kestrel Anchor"
          />
        </div>
      </div>
    </Chapter>
  );
}
