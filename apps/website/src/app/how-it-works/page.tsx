import type { Metadata } from "next";
import { Reveal, Counter } from "@/components/motion";
import { Button, Card, Eyebrow, CheckIcon, LockIcon } from "@/components/ui";
import { StepDiagram } from "@/components/how-it-works/step-diagram";
import { InclusionCheck } from "@/components/how-it-works/inclusion-check";
import { steps, guarantees } from "@/components/how-it-works/how-it-works-data";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a private ledger to a public proof in four steps: attest, commit, prove, verify. See exactly how Solva proves solvency without moving customer data.",
};

const sectionX = "mx-auto max-w-site px-7";

export default function HowItWorksPage() {
  return (
    <main className="relative z-[1]">
      <header className={`${sectionX} pb-16 pt-40`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">How it works</Eyebrow>
          <h1 className="h1 max-w-[840px]">
            From a private ledger to a public proof, in{" "}
            <span className="font-serif italic text-acc-text">four</span> steps.
          </h1>
          <p className="mt-6 max-w-[600px] text-lg leading-relaxed text-sec">
            Solva turns the question &ldquo;are you solvent?&rdquo; into a yes that anyone can check,
            without ever moving your customers&rsquo; data. Here is exactly what happens, end to end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/request-a-demo">Request a demo</Button>
            <Button variant="secondary" href="/developers">
              Read the docs
            </Button>
          </div>
        </Reveal>
      </header>

      {/* The four steps */}
      <section className={`${sectionX} py-10`}>
        {steps.map((step, i) => (
          <Reveal
            key={step.no}
            className="grid grid-cols-1 items-center gap-10 border-t border-hair py-12 md:grid-cols-[64px_1fr_1fr]"
          >
            <div className="font-mono text-sm text-acc-text">{step.no}</div>
            <div>
              <div className="mb-3 font-mono text-xs text-sec">{step.tag}</div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">{step.title}</h2>
              <p className="mt-3 max-w-[460px] text-base leading-relaxed text-sec">{step.body}</p>
            </div>
            <div className="flex justify-center md:justify-end">
              <StepDiagram index={i} />
            </div>
          </Reveal>
        ))}
        <div className="border-t border-hair" />
      </section>

      {/* What the proof guarantees */}
      <section className={`${sectionX} py-16`}>
        <Reveal>
          <h2 className="h2 mb-9 max-w-[560px]">What a Solva proof actually guarantees.</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {guarantees.map((g) => (
            <Reveal key={g.no}>
              <Card className="h-full p-7">
                <div className="mb-3.5 font-mono text-[13px] text-acc-text">{g.no}</div>
                <h3 className="font-display text-[19px] font-semibold">{g.title}</h3>
                <p className="mt-2 text-[14.5px] leading-snug text-sec">{g.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Private vs public */}
      <section className={`${sectionX} pb-16`}>
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <Reveal>
            <Card className="priv-card h-full p-9">
              <div className="mb-4 flex items-center gap-2.5">
                <LockIcon size={18} className="text-sec" />
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-sec">
                  Stays private
                </span>
              </div>
              <div className="priv-blur font-mono text-[13.5px] leading-loose text-fg">
                acct_8842 → $1,204,889.21
                <br />
                acct_2291 → $84,005.00
                <br />
                acct_5530 → $3,920,114.77
                <br />
                reserves_total → $ — — —
                <br />
                customer names, KYC, ledgers
              </div>
              <p className="mt-4 text-sm text-sec">
                Hover to see what Solva would have to expose with an old-style attestation. It never
                does.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full p-9">
              <div className="mb-4 flex items-center gap-2.5">
                <CheckIcon size={18} className="text-acc-text" />
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-acc-text">
                  Goes public
                </span>
              </div>
              <div className="font-mono text-[13.5px] leading-loose text-fg">
                solvent: <span className="text-acc-text">true</span>
                <br />
                proof: 0x7a3f…e3f1
                <br />
                contract: GSOLVA…STELLAR
                <br />
                verified_at: 2026-06-19T09:41Z
                <br />
                cost: &lt; $0.01
              </div>
              <p className="mt-4 text-sm text-sec">
                A single boolean, a proof hash, and an on-chain record. That is all anyone ever sees.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* On-chain verification */}
      <section className={`${sectionX} pb-10`}>
        <Reveal>
          <Card className="grid grid-cols-1 items-center gap-12 p-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Eyebrow className="mb-4 text-acc-text">On-chain verification</Eyebrow>
              <h2 className="h2">Verified by a contract, not a press release.</h2>
              <p className="mt-4 text-base leading-relaxed text-sec">
                Each proof is checked inside a Stellar smart contract and written to a public
                registry. The verification is the consensus of the network, so anyone can re-run it
                and reach the same answer.
              </p>
              <div className="mt-6 flex gap-8">
                <div>
                  <p className="font-mono text-[28px] text-fg">
                    <Counter value={5} suffix="s" />
                  </p>
                  <p className="mt-1.5 text-[13px] text-sec">to finality</p>
                </div>
                <div>
                  <p className="font-mono text-[28px] text-acc-text">&lt;$0.01</p>
                  <p className="mt-1.5 text-[13px] text-sec">per proof</p>
                </div>
                <div>
                  <p className="font-mono text-[28px] text-fg">
                    <Counter value={100} suffix="%" />
                  </p>
                  <p className="mt-1.5 text-[13px] text-sec">independently checkable</p>
                </div>
              </div>
            </div>
            <div className="rounded-[14px] border border-hair bg-bg p-[22px] font-mono text-[12.5px] leading-[1.9] text-sec">
              <span className="text-sec">// anyone can run this</span>
              <br />$ solva verify <span className="text-fg">0x7a3f…e3f1</span>
              <br />
              <span className="text-fg">→ reading Stellar registry…</span>
              <br />
              <span className="text-fg">→ checking SNARK…</span>
              <br />
              <span className="text-acc-text">✓ valid · reserves ≥ liabilities</span>
              <br />
              <span className="text-acc-text">✓ 100% of liabilities included</span>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Inclusion check (interactive) */}
      <section id="verify" className={`${sectionX} py-10`}>
        <Reveal>
          <Card className="p-10">
            <InclusionCheck />
          </Card>
        </Reveal>
      </section>

      {/* Architecture: edge proving */}
      <section className={`${sectionX} py-16`}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow className="mb-4 text-acc-text">Architecture · edge proving</Eyebrow>
            <h2 className="h2">The prover runs inside your walls.</h2>
            <p className="mt-4 text-base leading-relaxed text-sec">
              Solva deploys as a prover inside your own infrastructure. It reads balances locally,
              builds the commitment and proof on your hardware, and emits only the proof. Raw data
              has no path out.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 text-[14.5px] text-fg">
              {[
                "No customer data crosses your perimeter",
                "Nothing to subpoena from Solva, nothing to breach",
                "Works behind your existing firewall and VPC",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5">
                  <CheckIcon size={15} className="shrink-0 text-acc-text" />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <Card className="p-8">
              <div className="rounded-[14px] border border-dashed border-hair-strong p-[22px]">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
                  Your perimeter
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[120px] flex-1 rounded-[10px] border border-hair bg-bg p-3.5 text-center text-[13px] text-sec">
                    Ledgers
                    <br />& custody
                  </div>
                  <div className="text-sec">→</div>
                  <div className="min-w-[120px] flex-1 rounded-[10px] border border-acc-deep bg-bg p-3.5 text-center text-[13px] text-fg">
                    Solva
                    <br />
                    prover
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2.5 py-4 font-mono text-xs text-sec">
                proof only ↓
              </div>
              <div className="rounded-[10px] border border-hair bg-bg p-3.5 text-center text-[13px] text-acc-text">
                Stellar smart contract → public registry
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className={`${sectionX} pb-24 pt-8`}>
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
              <h2 className="mx-auto max-w-[620px] font-display text-[clamp(28px,3.6vw,46px)] font-bold leading-tight tracking-tight">
                See it run on your ledger.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-lg leading-snug text-sec">
                Spin up a private sandbox and watch a proof land on Stellar. No customer data
                required.
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
