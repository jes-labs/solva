import type { ReactNode } from "react";
import { PublicNav } from "@/components/public-nav";
import { Footer } from "@/components/footer";

// Chrome for the public, no-auth tools (verify, inclusion). Separate from the
// dashboard so these never show operator navigation.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1 py-10 sm:py-14">
        {/* Same section container as the marketing site: 1200px cap, 28px gutter. */}
        <div className="mx-auto max-w-site px-7">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
