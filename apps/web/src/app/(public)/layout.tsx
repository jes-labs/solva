import type { ReactNode } from "react";
import { PublicNav } from "@/components/public-nav";
import { Footer } from "@/components/footer";

// Chrome for the public, no-auth tools (verify, inclusion). Separate from the
// dashboard so these never show operator navigation.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1 px-6 py-10 sm:py-14">{children}</main>
      <Footer />
    </div>
  );
}
