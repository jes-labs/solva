// The Solva docs wordmark: the brand mark (chartreuse in both themes) plus the
// name and a small "docs" tag, used as the Fumadocs nav title.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="24 11 53 78" width="17" height="25" aria-hidden="true">
        <path
          d="M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="14"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-fd-foreground">Solva</span>
      <span className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[10px] text-fd-muted-foreground">
        docs
      </span>
    </span>
  );
}
