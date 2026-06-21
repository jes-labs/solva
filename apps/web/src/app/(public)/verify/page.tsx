import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "Verify a proof",
  description:
    "Paste a proof id to read the totals it published and confirm it was verified on Stellar. No wallet or account needed.",
  alternates: { canonical: "/verify" },
  // Public page: opt back into indexing (the console default is noindex).
  robots: { index: true, follow: true },
  openGraph: { title: "Verify a proof", url: "/verify" },
};

export default function VerifyPage() {
  // The hero is server-rendered for SEO; only the interactive lookup (which reads
  // ?id= via useSearchParams) sits behind the Suspense boundary.
  return (
    <div className="mx-auto max-w-[840px]">
      <header className="text-center">
        <p className="eyebrow text-acc-text">Public verification</p>
        <h1 className="h1 mt-4">
          Don&rsquo;t trust. <span className="accent-word">Verify.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[540px] text-lg leading-relaxed text-sec">
          Paste a proof id to read the totals it published and confirm reserves cover liabilities,
          settled on Stellar. Anyone can check; no wallet, no account.
        </p>
      </header>
      <Suspense
        fallback={<div className="mx-auto mt-10 h-[54px] max-w-[600px] animate-pulse rounded-btn bg-surface" />}
      >
        <VerifyClient />
      </Suspense>
    </div>
  );
}
