import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { PipelineExplainer } from "./pipeline-explainer";
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
            Step through the real Solva pipeline against a mock open-banking bank: connect
            the bank, read a signed balance, prove reserves cover liabilities without
            revealing a single customer, publish the proof on-chain, and verify it. Each
            institution proves to its own contract. The insolvent case is meant to fail.
            That is the point: Solva will not prove a lie.
          </p>
        </Reveal>
      </header>

      <section className={`${sectionX} py-10`}>
        <Reveal>
          <h2 className="h2 max-w-[560px]">How a proof is made, under the hood.</h2>
          <p className="mt-4 max-w-[600px] text-base leading-relaxed text-sec">
            Five steps, end to end. Watch it play, or step through each operation yourself.
          </p>
        </Reveal>
        <div className="mt-8">
          <PipelineExplainer />
        </div>
      </section>

      <section className={`${sectionX} pb-24 pt-10`}>
        <Reveal>
          <h2 className="h2 max-w-[560px]">Now run it for real.</h2>
          <p className="mt-4 max-w-[600px] text-base leading-relaxed text-sec">
            Drive the live pipeline against a running stack: each step makes a real call, with
            the real artifact it returns.
          </p>
        </Reveal>
        <div className="mt-8">
          <SandboxClient />
        </div>
      </section>
    </main>
  );
}
