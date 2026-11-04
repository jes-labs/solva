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
          lead="Only your team can change what Solva records about you: where reserves are held, who reports them and which assets are listed. Each change is approved with a passkey on a team member's own device, so there is no secret key to copy or leak."
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
