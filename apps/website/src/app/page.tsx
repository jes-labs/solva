import { Reveal, Counter } from "@/components/motion";
import {
  Button,
  Card,
  StatusChip,
  VerifiedBadge,
  CodeBlock,
  SegmentedTabs,
  FaqAccordion,
  Eyebrow,
} from "@/components/ui";

const sampleCode = `import { Solva } from "@solva/sdk-ts";

const solva = new Solva({ network: "testnet", tenant });
const id = await solva.runProofCycle();
const ok = await solva.verifyInclusion(ref);`;

// Foundation preview. It exercises the brand, motion, nav, footer, and the UI
// kit end to end. The real Home page is built in a later issue and replaces it.
export default function FoundationPreview() {
  return (
    <main className="mx-auto max-w-site px-7 pb-20 pt-32">
      <Eyebrow className="mb-4">Design system</Eyebrow>
      <h1 className="h1 max-w-3xl">
        Prove <span className="accent-word">solvency</span>, not just reserves.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-sec">
        The shared building blocks of the Solva site: brand tokens, the type scale, motion, and the
        UI kit. Toggle the theme to see the canvas invert and the accent adapt.
      </p>

      <section className="mt-10 flex flex-wrap items-center gap-3">
        <Button href="/request-a-demo">Request a demo</Button>
        <Button variant="secondary" href="/developers">
          Read the docs
        </Button>
        <Button variant="tertiary" href="/how-it-works">
          How it works
        </Button>
      </section>

      <Reveal className="mt-16">
        <Eyebrow className="mb-4">Status and verification</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status="solvent" />
          <StatusChip status="near-breach" />
          <StatusChip status="insolvent" />
          <VerifiedBadge />
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <Eyebrow className="mb-4">Cards</Eyebrow>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="font-mono text-xs text-sec">surface</p>
            <p className="mt-2 text-fg">Cards and panels sit on a hairline border.</p>
          </Card>
          <Card interactive>
            <p className="font-mono text-xs text-sec">interactive</p>
            <p className="mt-2 text-fg">The border strengthens on hover.</p>
          </Card>
          <Card>
            <p className="font-mono text-xs text-acc-text">accent</p>
            <p className="mt-2 text-fg">The chartreuse signal, used sparingly.</p>
          </Card>
        </div>
      </Reveal>

      <Reveal className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <Eyebrow className="mb-4">Tabs and FAQ</Eyebrow>
          <SegmentedTabs
            items={[
              { value: "banks", label: "Banks" },
              { value: "exchanges", label: "Exchanges" },
              { value: "issuers", label: "Stablecoin issuers" },
            ]}
            defaultValue="banks"
          />
          <FaqAccordion
            className="mt-6"
            items={[
              {
                question: "Does Solva see customer balances?",
                answer: "No. Proving runs inside your perimeter and only the proof and totals leave.",
              },
              {
                question: "How often can proofs run?",
                answer: "Daily or hourly, not quarterly. Each cycle publishes one on-chain proof.",
              },
            ]}
          />
        </div>
        <div>
          <Eyebrow className="mb-4">Code</Eyebrow>
          <CodeBlock filename="prove.ts" code={sampleCode} />
        </div>
      </Reveal>

      {/* Stats band. Demonstrates the reveal and counter primitives. The figures
          are protocol facts, not invented metrics. */}
      <Reveal className="mt-24 grid gap-8 border-t border-hair pt-12 sm:grid-cols-3">
        <div>
          <p className="font-mono text-3xl text-acc-text">
            <Counter value={0.014} decimals={3} suffix=" XLM" />
          </p>
          <p className="mt-2 text-sm text-sec">Cost of one on-chain verification.</p>
        </div>
        <div>
          <p className="font-mono text-3xl text-fg">
            <Counter value={100} suffix="%" />
          </p>
          <p className="mt-2 text-sm text-sec">Of liabilities committed, not sampled.</p>
        </div>
        <div>
          <p className="font-mono text-3xl text-fg">
            <Counter value={2} suffix="s" />
          </p>
          <p className="mt-2 text-sm text-sec">To verify a customer inclusion proof.</p>
        </div>
      </Reveal>
    </main>
  );
}
