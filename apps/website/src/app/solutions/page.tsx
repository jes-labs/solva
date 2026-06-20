import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Button, Eyebrow } from "@/components/ui";
import { SolutionsTabs } from "@/components/solutions/solutions-tabs";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "One proof, built for banks and fintechs, exchanges, stablecoin issuers, and regulators. See how Solva fits each, with continuous, private, on-chain solvency.",
};

const sectionX = "mx-auto max-w-site px-7";

export default function SolutionsPage() {
  return (
    <main className="relative z-[1]">
      <header className={`${sectionX} pb-8 pt-40`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">Solutions</Eyebrow>
          <h1 className="h1 max-w-[780px]">
            One proof. Built for everyone who has to{" "}
            <span className="font-serif italic text-acc-text">trust</span> the number.
          </h1>
        </Reveal>
      </header>

      <SolutionsTabs />

      {/* CTA */}
      <section className={`${sectionX} pb-24 pt-5`}>
        <Reveal>
          <div className="relative overflow-hidden rounded-panel border border-hair bg-surface px-12 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage: "radial-gradient(var(--hair) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-[600px] font-display text-[clamp(28px,3.6vw,46px)] font-bold leading-tight tracking-tight">
                Make solvency something people can check.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-lg leading-snug text-sec">
                Whoever you answer to, Solva turns solvency into a fact anyone can verify on Stellar.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <Button size="lg" href="/request-a-demo">
                  Request a demo
                </Button>
                <Button size="lg" variant="secondary" href="/developers">
                  Read the docs
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
