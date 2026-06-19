import Link from "next/link";
import { routes } from "@/lib/routes";

// The Solva wordmark with the chevron-into-baseline mark. The mark is drawn in
// the accent so it stays chartreuse in both themes. The brand asset vectors
// replace this inline path once the assets are wired in a later issue.
export function Logo() {
  return (
    <Link href={routes.home} className="flex items-center gap-2" aria-label="Solva home">
      <svg viewBox="24 11 53 78" width="20" height="29" aria-hidden="true">
        <path
          d="M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="14"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-[21px] font-bold tracking-tight text-fg">Solva</span>
    </Link>
  );
}
