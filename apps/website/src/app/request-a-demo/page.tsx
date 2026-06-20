import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { DemoForm } from "@/components/demo/demo-form";

export const metadata: Metadata = {
  title: "Request a demo",
  description:
    "Tell us about your institution and we'll set up a private walkthrough of Solva against your own data. Nothing sensitive leaves your side.",
  alternates: { canonical: "/request-a-demo" },
  openGraph: { title: "Request a demo", url: "/request-a-demo" },
};

const expectations = [
  {
    n: "01",
    title: "A 30-minute walkthrough",
    body: "We map Solva to your ledgers and compliance needs.",
  },
  {
    n: "02",
    title: "A sandbox you keep",
    body: "Run proofs against mock data the same day.",
  },
  {
    n: "03",
    title: "No data required",
    body: "Nothing sensitive leaves your side, ever.",
  },
];

export default function RequestDemoPage() {
  return (
    <main className="relative z-[1]">
      <div className="mx-auto grid max-w-site grid-cols-1 items-start gap-16 px-7 pb-24 pt-40 lg:grid-cols-[1fr_1.05fr]">
        {/* Left: pitch + what to expect */}
        <Reveal className="lg:sticky lg:top-[130px]">
          <Eyebrow className="mb-5 text-acc-text">Request a demo</Eyebrow>
          <h1 className="font-display text-[clamp(34px,4.4vw,54px)] font-bold leading-[1.03] tracking-[-0.035em]">
            See a proof land on <span className="font-serif italic text-acc-text">your</span> ledger.
          </h1>
          <p className="mt-5 max-w-[420px] text-[17px] leading-relaxed text-sec">
            Tell us a little about your institution and we&rsquo;ll set up a private walkthrough
            against your own data.
          </p>

          <div className="mt-8 flex flex-col gap-[18px]">
            {expectations.map((item) => (
              <div key={item.n} className="flex gap-3.5">
                <span className="shrink-0 pt-0.5 font-mono text-[13px] text-acc-text">{item.n}</span>
                <div>
                  <div className="text-[15px] font-semibold text-fg">{item.title}</div>
                  <p className="mt-0.5 text-sm leading-snug text-sec">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-hair pt-[22px]">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
              Prefer email?
            </p>
            <a
              href="mailto:hello@solva.example"
              className="font-mono text-[15px] text-fg transition-colors hover:text-acc-text"
            >
              hello@solva.example
            </a>
          </div>
        </Reveal>

        {/* Right: form */}
        <Reveal>
          <DemoForm />
        </Reveal>
      </div>
    </main>
  );
}
