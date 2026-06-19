import { Reveal, Counter } from "@/components/motion";

// Foundation preview. This proves the tokens, fonts, theme, motion, and nav work
// end to end. The real Home page is built in a later issue and replaces this.
export default function FoundationPreview() {
  return (
    <main className="mx-auto max-w-site px-7 pb-20 pt-32">
      <p className="eyebrow mb-4">Design system</p>
      <h1 className="h1 max-w-3xl">
        Prove <span className="accent-word">solvency</span>, not just reserves.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-sec">
        The foundation for the Solva marketing site: brand tokens, the type scale, the dot grid, and
        the dark and light themes. Toggle the theme to see the canvas invert and the accent adapt.
      </p>

      <Reveal className="mt-16">
        <p className="eyebrow mb-4">Surfaces</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-card border border-hair bg-surface p-6">
            <p className="font-mono text-xs text-sec">surface</p>
            <p className="mt-2 text-fg">Cards and panels sit on a hairline border.</p>
          </div>
          <div className="rounded-card border border-hair bg-panel p-6">
            <p className="font-mono text-xs text-sec">panel</p>
            <p className="mt-2 text-fg">Insets use the deeper panel token.</p>
          </div>
          <div className="rounded-card border border-acc-deep bg-surface p-6">
            <p className="font-mono text-xs text-acc-text">accent</p>
            <p className="mt-2 text-fg">The chartreuse signal, used sparingly.</p>
          </div>
        </div>
      </Reveal>

      <section className="mt-12 flex flex-wrap items-center gap-3">
        <button className="rounded-btn bg-acc px-5 py-2.5 font-semibold text-on-acc shadow-cta">
          Request a demo
        </button>
        <button className="rounded-btn border border-hair px-5 py-2.5 font-semibold text-fg transition-colors hover:border-hair-strong">
          Read the docs
        </button>
        <span className="inline-flex items-center gap-2 rounded-pill border border-hair px-3 py-1.5 font-mono text-xs text-sec">
          <span className="h-2 w-2 rounded-full bg-acc" aria-hidden="true" />
          Solvent, verified on Stellar
        </span>
      </section>

      {/* Stats band. Demonstrates the reveal and counter primitives. The figures
          are protocol facts, not invented metrics. */}
      <Reveal className="mt-40 grid gap-8 border-t border-hair pt-12 sm:grid-cols-3">
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
