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
          Connect the bank accounts and on-chain wallets that back your reserves. Bank balances are
          read over open banking with your authorization; nothing is moved.
        </p>
      </div>
      <SourcesPanel sources={data.sources} onConnect={connectSource} canConnect={canConnect} />
    </div>
  );
}
