import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Solva's privacy policy, terms of service, and security policy. Plain-language templates covering the limited data we collect and our security commitments.",
  alternates: { canonical: "/legal" },
  openGraph: { title: "Legal", url: "/legal" },
};

// Rendered per request so the ?doc= deep link resolves to the right policy on the
// server, not just after hydration.
export const dynamic = "force-dynamic";

export default function LegalPage() {
  return (
    <main className="relative z-[1]">
      <Suspense>
        <LegalShell />
      </Suspense>
    </main>
  );
}
