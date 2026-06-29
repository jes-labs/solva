import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { SandboxClient } from "./sandbox-client";

export const metadata: Metadata = {
  title: "Sandbox",
  description:
    "Watch the full Solva flow run live against mock open-banking data: connect a bank, prove reserves cover liabilities, and publish a proof to Stellar. Each institution proves to its own contract.",
  alternates: { canonical: "/sandbox" },
  openGraph: { title: "Sandbox", url: "/sandbox" },
};

const sectionX = "mx-auto max-w-site px-7";

export default function SandboxPage() {
  return (
    <main className="relative z-[1]">
      <header className={`${sectionX} pb-12 pt-40`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">Sandbox</Eyebrow>
          <h1 className="h1 max-w-[860px]">
            Watch a proof of reserves land on{" "}
            <span className="font-serif italic text-acc-text">Stellar</span>.
          </h1>
          <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-sec">
            This runs the real Solva pipeline against a mock open-banking bank: fetch a
            signed balance, prove reserves cover liabilities without revealing a single
            customer, and publish the proof on-chain. The insolvent case is meant to
            fail. That is the point: Solva will not prove a lie.
          </p>
        </Reveal>
      </header>

      <section className={`${sectionX} pb-24`}>
        <SandboxClient />
      </section>
    </main>
  );
}
