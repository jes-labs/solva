import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Button, Card, Eyebrow, CheckIcon, ShieldCheckIcon, NodesIcon } from "@/components/ui";
import { EdgeProvingDiagram } from "@/components/shared/edge-proving-diagram";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Security & architecture",
  description:
    "Solva is designed so you never have to trust Solva. Proofs are generated inside your perimeter, verified on a public chain, and reveal nothing but the result.",
};

const sectionX = "mx-auto max-w-site px-7";

const trustModel = [
  { title: "Trust the proof", body: "A valid proof is valid no matter who produced it. Solva can't fake a result, and can't be coerced into one." },
  { title: "Trust the chain", body: "Verification is the consensus of the Stellar network, not a claim on our status page." },
  { title: "Don't trust Solva", body: "We never hold your data and never sign off on your numbers. There's nothing to take our word for." },
];

const neverRevealed = ["Customer balances", "Identities & KYC", "Reserve composition", "Exact totals"];

export default function SecurityPage() {
  return (
    <main className="relative z-[1]">
      <header className={`${sectionX} pb-12 pt-40`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">Security & architecture</Eyebrow>
          <h1 className="h1 max-w-[820px]">
            Trust the <span className="font-serif italic text-acc-text">math</span>, not the
            messenger.
          </h1>
          <p className="mt-6 max-w-[600px] text-lg leading-relaxed text-sec">
            Solva is designed so that you never have to trust Solva. Proofs are generated inside your
            perimeter, verified on a public chain, and reveal nothing but the result.
          </p>
        </Reveal>
      </header>

      {/* Trust model */}
      <section className={`${sectionX} py-8`}>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {trustModel.map((t) => (
            <Reveal key={t.title}>
              <Card className="h-full p-7">
                <div className="mb-3.5 font-mono text-[13px] text-acc-text">trust model</div>
                <h3 className="font-display text-[19px] font-semibold">{t.title}</h3>
                <p className="mt-2 text-[14.5px] leading-snug text-sec">{t.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Zero-knowledge guarantees */}
      <section className={`${sectionX} py-10`}>
        <div className="grid grid-cols-1 gap-12 border-t border-hair pt-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow className="mb-4 text-acc-text">Zero-knowledge guarantees</Eyebrow>
            <h2 className="h2">What is never revealed.</h2>
            <p className="mt-4 text-base leading-relaxed text-sec">
              The circuit outputs a single boolean and a commitment. Everything that goes into the
              proof stays sealed inside it, mathematically.
            </p>
          </Reveal>
          <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {neverRevealed.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 rounded-xl border border-hair bg-surface p-[18px]"
              >
                <span className="font-mono text-red">✕</span>
                <span className="text-sm text-fg">{item}</span>
              </div>
            ))}
            <div
              className="flex items-center gap-2.5 rounded-xl p-[18px] sm:col-span-2"
              style={{
                background: "color-mix(in oklab, var(--acc) 10%, var(--surface))",
                border: "1px solid color-mix(in oklab, var(--acc) 35%, transparent)",
              }}
            >
              <span className="font-mono text-acc-text">✓</span>
              <span className="text-sm text-fg">
                Revealed: reserves ≥ liabilities, and a timestamp
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Edge proving */}
      <section className={`${sectionX} py-10`}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow className="mb-4 text-acc-text">Edge proving</Eyebrow>
            <h2 className="h2">No data leaves the building.</h2>
            <p className="mt-4 text-base leading-relaxed text-sec">
              The prover deploys inside your own infrastructure. It reads balances locally, builds the
              proof on your hardware, and emits only the proof. There is no central store of customer
              data to subpoena or breach.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 text-[14.5px] text-fg">
              {[
                "Runs in your VPC, behind your firewall",
                "Outbound traffic is the proof only",
                "No customer PII in Solva systems, ever",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5">
                  <CheckIcon size={15} className="shrink-0 text-acc-text" />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <EdgeProvingDiagram />
          </Reveal>
        </div>
      </section>

      {/* Audited contracts + compliance */}
      <section className={`${sectionX} py-8`}>
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <Reveal>
            <Card className="h-full p-9">
              <ShieldCheckIcon size={28} className="mb-5 text-acc-text" />
              <h3 className="font-display text-[22px] font-semibold tracking-tight">
                Audited contracts
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-sec">
                The verifier contract and proving circuits are independently audited and run on
                Stellar. Verification logic is open and reproducible.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5 font-mono text-xs text-sec">
                {["Audited circuits", "On Stellar", "Reproducible builds"].map((tag) => (
                  <span key={tag} className="rounded-pill border border-hair px-3 py-[5px]">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full p-9">
              <NodesIcon size={28} className="mb-5 text-acc-text" />
              <h3 className="font-display text-[22px] font-semibold tracking-tight">
                Compliance & selective disclosure
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-sec">
                Reveal exactly the figure or attribute a supervisor needs, cryptographically attested,
                while everything else stays private. Disclosure is scoped, logged, and revocable.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5 font-mono text-xs text-sec">
                {["Scoped", "Attested", "Audit trail"].map((tag) => (
                  <span key={tag} className="rounded-pill border border-hair px-3 py-[5px]">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Responsible disclosure */}
      <section className={`${sectionX} py-8`}>
        <Reveal>
          <Card className="flex flex-wrap items-center justify-between gap-8 p-9">
            <div className="max-w-[560px]">
              <h3 className="font-display text-[22px] font-semibold tracking-tight">
                Responsible disclosure
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-sec">
                Found something? We run a coordinated disclosure program and publish every incident on
                our status page. Security researchers are credited and rewarded.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" href="/request-a-demo">
                Report a vulnerability
              </Button>
              <Button size="sm" variant="secondary" href={routes.status}>
                View status
              </Button>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* CTA */}
      <section className={`${sectionX} pb-24 pt-4`}>
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
              <h2 className="mx-auto max-w-[560px] font-display text-[clamp(28px,3.6vw,46px)] font-bold leading-tight tracking-tight">
                Verifiable by design.
              </h2>
              <p className="mx-auto mt-4 max-w-[480px] text-lg leading-snug text-sec">
                Walk through the architecture with our team and map it to your environment.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <Button size="lg" href="/request-a-demo">
                  Request a demo
                </Button>
                <Button size="lg" variant="secondary" href={routes.howItWorks}>
                  How it works
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
