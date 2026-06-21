import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

// Minimal centered chrome for the gated entry steps (auth, onboarding). No
// dashboard navigation; the focus is one task at a time.
export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">{children}</main>
      <footer className="px-6 py-5 text-center">
        <p className="font-mono text-xs text-sec">© 2026 Solva · reserves ≥ liabilities</p>
      </footer>
    </div>
  );
}
