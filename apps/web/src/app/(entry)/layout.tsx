import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExternalLink } from "@/components/external-link";
import { siteUrl } from "@/lib/links";

// The selling points shown on the brand panel. Generic to the console, so the
// same panel frames both the auth and the onboarding step.
const points = [
  {
    title: "Zero-knowledge proofs",
    body: "Prove reserves cover liabilities without exposing a single customer balance.",
  },
  {
    title: "Verified on Stellar",
    body: "Every proof is published on-chain, so anyone can check it independently.",
  },
  {
    title: "Passkey sign-in",
    body: "No seed phrase. We provision a smart wallet for your institution on first sign-in.",
  },
];

// Two-column shell for the gated entry steps (auth, onboarding). The left is a
// brand panel; the right holds the task. On small screens the brand panel drops
// away and the form takes the full width with a compact top bar.
export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden overflow-hidden border-r border-hair bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(var(--hair) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden="true"
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-[440px]">
          <p className="eyebrow mb-4 text-acc-text">Proof of reserves</p>
          <h2 className="font-display text-[clamp(28px,3vw,40px)] font-bold leading-[1.08] tracking-tight">
            Prove solvency. Not promises.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-sec">
            The Solva console lets your institution prove that reserves meet liabilities, every
            block, and publish the proof on Stellar.
          </p>
          <ul className="mt-8 space-y-5">
            {points.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-acc text-on-acc">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">{point.title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-sec">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between">
          <p className="font-mono text-xs text-sec">© 2026 Solva · reserves ≥ liabilities</p>
          <ExternalLink href={siteUrl} className="text-xs text-sec transition-colors hover:text-fg">
            joinsolva.xyz ↗
          </ExternalLink>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-4">
          <span className="lg:invisible">
            <Logo />
          </span>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-10">{children}</main>
        <footer className="px-6 py-5 text-center lg:hidden">
          <p className="font-mono text-xs text-sec">© 2026 Solva · reserves ≥ liabilities</p>
        </footer>
      </div>
    </div>
  );
}
