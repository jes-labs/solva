import { Reveal, Counter } from "@/components/motion";
import {
  Button,
  Card,
  CodeBlock,
  Eyebrow,
  FaqAccordion,
  CheckIcon,
  ShieldIcon,
  NodesIcon,
} from "@/components/ui";
import { InstitutionsMarquee } from "./institutions-marquee";
import { MarginChart } from "./margin-chart";
import { differentiators, audiences, homeFaqs } from "./home-data";

const sectionX = "mx-auto max-w-site px-7";

const proveSample = `import { Solva } from "@solva/sdk";

const solva = new Solva({ apiKey: process.env.SOLVA_KEY });

// prove reserves >= liabilities, privately
const proof = await solva.prove({
  reserves:    ledger.reserves,     // stays on-prem
  liabilities: ledger.liabilities,  // never leaves
});

await solva.publish(proof);  // -> Stellar, ~5s`;

export function InstitutionsSection() {
  return (
    <section className={`${sectionX} relative z-[1] pb-16 pt-3.5`}>
      <Reveal>
        <p className="mb-7 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-sec">
          Built for the institutions that move money
        </p>
        <InstitutionsMarquee />
      </Reveal>
    </section>
  );
}

export function Problem() {
  return (
    <section className={`${sectionX} relative z-[1] py-20`}>
      <div className="grid grid-cols-1 gap-14 border-t border-hair pt-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Eyebrow className="mb-4 text-acc-text">The problem</Eyebrow>
          <Reveal>
            <h2 className="h2">
              Attestations are stale, partial, and{" "}
              <span className="font-serif italic">gameable</span>.
            </h2>
          </Reveal>
        </div>
        <Reveal className="text-[17px] leading-relaxed text-sec">
          <p className="mb-[18px]">
            A quarterly PDF signed by an auditor tells you what a balance sheet looked like on one
            day, months ago. It shows that reserves <span className="text-fg">exist</span>, not that
            they cover what is owed. Funds can be borrowed for the snapshot and gone by the next
            morning.
          </p>
          <p>
            FTX passed its audits. Reserves without a liabilities check are theatre. Solvency is a
            live property, so it should be proven continuously, in math, and in the open.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Differentiators() {
  return (
    <section className={`${sectionX} relative z-[1] py-20`}>
      <Reveal>
        <h2 className="h2 mb-11 max-w-[620px]">
          Not proof of reserves. Proof of <span className="accent-word">solvency</span>.
        </h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {differentiators.map((item) => (
          <Reveal key={item.title}>
            <Card interactive className="h-full p-7">
              <item.icon size={26} className="mb-[18px] text-acc-text" />
              <h3 className="font-display text-[19px] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-[14.5px] leading-snug text-sec">{item.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function AudienceGrid() {
  return (
    <section className={`${sectionX} relative z-[1] pb-20 pt-8`}>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((item) => (
          <Reveal key={item.title}>
            <Card className="h-full p-6">
              <p className="mb-2.5 font-mono text-xs text-sec">for</p>
              <h3 className="font-display text-[18px] font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-snug text-sec">{item.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function MarginSection() {
  return (
    <section className={`${sectionX} relative z-[1] pb-20 pt-10`}>
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <Eyebrow className="mb-4 text-acc-text">Reserves ≥ Liabilities</Eyebrow>
          <h2 className="h2">The one invariant, held every block.</h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-sec">
            Solva tracks the margin between what you hold and what you owe. The proof only succeeds
            while the green line stays above the grey, and that result is what lands on-chain.
          </p>
          <div className="mt-5 flex gap-7 font-mono text-[13px] text-sec">
            <span className="flex items-center gap-2">
              <span className="h-[3px] w-3.5 rounded-sm bg-acc" />
              Reserves
            </span>
            <span className="flex items-center gap-2">
              <span className="h-[3px] w-3.5 rounded-sm bg-sec" />
              Liabilities
            </span>
          </div>
        </Reveal>
        <Reveal>
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs text-sec">margin · live</span>
              <span className="inline-flex items-center gap-2 rounded-pill border border-acc-deep px-2.5 py-1 font-mono text-xs text-acc-text">
                <span className="h-1.5 w-1.5 rounded-full bg-acc" />
                Solvent
              </span>
            </div>
            <MarginChart />
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-8">
        <Card className="grid grid-cols-1 items-center gap-8 p-9 sm:grid-cols-3">
          <div>
            <h3 className="font-display text-[22px] font-semibold tracking-tight">
              Verified on Stellar
            </h3>
            <p className="mt-2 text-[15px] leading-snug text-sec">
              Every proof is settled in a public smart contract. Do not trust Solva, verify the math
              yourself.
            </p>
          </div>
          <div className="border-hair sm:border-l sm:pl-7">
            <p className="font-mono text-3xl text-fg">
              <Counter value={5} suffix="s" />
            </p>
            <p className="mt-1.5 text-[13px] text-sec">to verify on-chain</p>
          </div>
          <div className="border-hair sm:border-l sm:pl-7">
            <p className="font-mono text-3xl text-acc-text">&lt;$0.01</p>
            <p className="mt-1.5 text-[13px] text-sec">per published proof</p>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}

export function Developers() {
  return (
    <section id="developers" className={`${sectionX} relative z-[1] py-16`}>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
        <Reveal>
          <Eyebrow className="mb-4 text-acc-text">Developers</Eyebrow>
          <h2 className="h2">Three calls to a proof.</h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-sec">
            A typed SDK, a mock open-banking sandbox, and a registry you can query. Prove, publish,
            and verify inclusion, without ever touching a circuit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="sm" href="/developers">
              Open the sandbox
            </Button>
            <Button size="sm" variant="secondary" href="/developers#api">
              API reference
            </Button>
          </div>
        </Reveal>
        <Reveal>
          <CodeBlock filename="prove.ts" code={proveSample} />
        </Reveal>
      </div>
    </section>
  );
}

export function SecurityOracle() {
  return (
    <section id="security" className={`${sectionX} relative z-[1] py-16`}>
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Reveal>
          <Card className="h-full p-9">
            <ShieldIcon size={28} className="mb-5 text-acc-text" />
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              Your data never leaves
            </h3>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-sec">
              Proving happens at the edge, inside your own infrastructure. Solva sees commitments and
              proofs, never raw balances, names, or accounts. There is no honeypot to breach.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 text-[14.5px] text-fg">
              {[
                "Trust the math, not the vendor",
                "Audited circuits and Stellar contracts",
                "Nothing revealed beyond R ≥ L",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5">
                  <CheckIcon size={15} className="shrink-0 text-acc-text" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
        <Reveal>
          <Card className="flex h-full flex-col p-9">
            <NodesIcon size={28} className="mb-5 text-acc-text" />
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              A solvency oracle for agents
            </h3>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-sec">
              Solva exposes a machine-verifiable solvency feed over MCP and a public API. Autonomous
              agents can check counterparty solvency before they transact. No trust assumptions, no
              phone calls.
            </p>
            <div className="mt-auto rounded-[10px] border border-hair bg-bg p-3.5 pt-4 font-mono text-[12.5px] text-sec">
              GET /v1/solvency/meridian-bank
              <br />
              <span className="text-acc-text">{"→ { solvent: true, margin_bps: 1240, ✓ }"}</span>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

export function StatsBand() {
  const numberClass = "font-display text-[clamp(30px,3.6vw,46px)] font-bold tracking-tight";
  return (
    <section className={`${sectionX} relative z-[1] py-12`}>
      <Reveal className="grid grid-cols-2 gap-5 border-y border-hair py-12 text-center lg:grid-cols-4">
        <div>
          <Counter className={numberClass} value={0} prefix="$" />
          <p className="mt-2 text-[13.5px] text-sec">customer data exposed</p>
        </div>
        <div>
          <Counter className={`${numberClass} text-acc-text`} value={100} suffix="%" />
          <p className="mt-2 text-[13.5px] text-sec">of liabilities included</p>
        </div>
        <div>
          <Counter className={numberClass} value={24} suffix="/7" />
          <p className="mt-2 text-[13.5px] text-sec">continuous proving</p>
        </div>
        <div>
          <Counter className={numberClass} value={5} suffix="s" />
          <p className="mt-2 text-[13.5px] text-sec">on-chain verification</p>
        </div>
      </Reveal>
    </section>
  );
}

export function HomeFaq() {
  return (
    <section className="relative z-[1] mx-auto max-w-narrow px-7 py-16">
      <Reveal>
        <h2 className="h2 mb-8 text-center">Questions, answered.</h2>
      </Reveal>
      <FaqAccordion items={homeFaqs} />
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="demo" className={`${sectionX} relative z-[1] pb-24 pt-16`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-panel border border-hair bg-surface px-12 py-[72px] text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: "radial-gradient(var(--hair) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <svg viewBox="24 11 53 78" className="mx-auto mb-5 w-10" aria-hidden="true">
              <path
                d="M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80"
                fill="none"
                stroke="var(--acc)"
                strokeWidth="14"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <h2 className="mx-auto max-w-[680px] font-display text-[clamp(30px,4vw,52px)] font-bold leading-[1.04] tracking-tight">
              Prove it. Continuously.
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-lg leading-snug text-sec">
              See Solva run against your own ledger in a private sandbox. No customer data required.
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
  );
}
