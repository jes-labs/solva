import type { Source, SourceType } from "@/lib/mock/dashboard";
import { formatRelativeTime } from "@/lib/format";
import { ConnectSourceDialog } from "./connect-source-dialog";

// The reserve sources the institution has connected, plus the connect flow.
export function SourcesPanel({
  sources,
  onConnect,
  canConnect = true,
}: {
  sources: Source[];
  onConnect: (config: { type: SourceType; label: string; settings: string }) => Promise<void>;
  // RBAC: only roles that may connect see the connect flow.
  canConnect?: boolean;
}) {
  return (
    <section className="rounded-card border border-hair bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-hair px-6 py-4">
        <div>
          <h2 className="font-display text-[17px] font-semibold tracking-tight">Reserve sources</h2>
          <p className="mt-0.5 text-[13px] text-sec">Banks and wallets that back your reserves.</p>
        </div>
        {canConnect && <ConnectSourceDialog onConnect={onConnect} />}
      </div>

      {sources.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-sec">
          No sources connected yet. Connect a bank or wallet to begin.
        </p>
      ) : (
        <ul>
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex items-center gap-3.5 border-b border-hair px-6 py-3.5 last:border-b-0"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-btn border border-hair text-sec">
                <SourceIcon type={source.type} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-medium text-fg">{source.label}</div>
                <div className="truncate text-[12.5px] text-sec">{source.detail}</div>
              </div>
              <span className="hidden shrink-0 text-[12px] text-sec sm:inline">
                connected {formatRelativeTime(source.connectedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceIcon({ type }: { type: SourceType }) {
  if (type === "onchain") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M16 14h2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 10 12 4l8 6M5 10v9h14v-9M3 19h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
