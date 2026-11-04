"use client";

import { SourcesPanel } from "@/components/dashboard/sources-panel";
import { useDashboard } from "@/lib/dashboard/provider";
import { useSession } from "@/lib/session/provider";
import { can } from "@/lib/session/permissions";

export function SourcesSection() {
  const { data, connectSource } = useDashboard();
  const { session } = useSession();
  const canConnect = session ? can(session.role, "source.connect") : false;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[14px] leading-relaxed text-sec">
          Connect the custodian accounts and on-chain wallets that back your reserves. Custodian
          balances are signed at the source and read with your authorization; nothing is moved.
        </p>
      </div>
      <SourcesPanel sources={data.sources} onConnect={connectSource} canConnect={canConnect} />
    </div>
  );
}
