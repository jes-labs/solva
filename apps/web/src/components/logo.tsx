import Link from "next/link";

// The Solva mark and wordmark. The mark stays chartreuse in both themes; the
// wordmark follows the foreground. `href` lets the public chrome point home and
// the app chrome point at the dashboard.
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className ?? ""}`} aria-label="Solva">
      <svg viewBox="24 11 53 78" width="18" height="26" aria-hidden="true">
        <path
          d="M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="14"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-[19px] font-bold tracking-tight text-fg">Solva</span>
    </Link>
  );
}
