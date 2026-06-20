import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Button, Card, Eyebrow, FaqAccordion, CheckIcon, type FaqItem } from "@/components/ui";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Build in the sandbox for free. When you go live, you pay for proofs published on-chain. No seat fees, no data charges.",
};

const sectionX = "mx-auto max-w-site px-7";

interface Tier {
  name: string;
  tagline: string;
  price: string;
  per: string;
  meter: string;
  cta: string;
  href: string;
  popular: boolean;
  features: string[];
}

const tiers: Tier[] = [
  {
    name: "Sandbox",
    tagline: "Build and test against mock data.",
    price: "Free",
    per: "",
    meter: "unlimited in sandbox",
    cta: "Start building",
    href: routes.developers,
    popular: false,
    features: [
      "Mock open-banking sandbox",
      "Unlimited local proofs",
      "TypeScript SDK & CLI",
      "Community support",
    ],
  },
  {
    name: "Starter",
    tagline: "Go live with low volumes.",
    price: "$499",
    per: "/mo",
    meter: "incl. 1,000 published proofs",
    cta: "Start free trial",
    href: "/request-a-demo",
    popular: false,
    features: [
      "Everything in Sandbox",
      "Publish to Stellar mainnet",
      "Public verify widget",
      "Email support",
    ],
  },
  {
    name: "Growth",
    tagline: "Scale continuous proving.",
    price: "$2,400",
    per: "/mo",
    meter: "incl. 10,000 published proofs",
    cta: "Request a demo",
    href: "/request-a-demo",
    popular: true,
    features: [
      "Everything in Starter",
      "Continuous proving",
      "Solvency oracle (MCP + API)",
      "Selective disclosure",
      "Priority support",
    ],
  },
  {
    name: "Institutional",
    tagline: "For regulated, high-volume deployments.",
    price: "Custom",
    per: "",
    meter: "volume & on-prem pricing",
    cta: "Talk to sales",
    href: "/request-a-demo",
    popular: false,
    features: [
      "Everything in Growth",
      "On-prem / VPC deployment",
      "Dedicated SLA & support",
      "Audit & compliance assist",
      "Custom integrations",
    ],
  },
];

// The single billable unit and everything that sits around it for free.
const metered = [
  { tag: "metered", title: "Published proofs", body: "Each proof settled on Stellar." },
  { tag: "included", title: "Proof generation", body: "Unlimited local proving." },
  { tag: "included", title: "Inclusion checks", body: "Unlimited verification." },
  { tag: "included", title: "Seats & data", body: "No per-seat or data fees." },
];

const faqs: FaqItem[] = [
  {
    question: "What counts as a published proof?",
    answer:
      "A proof you settle on-chain in the Stellar contract. Generating proofs locally and running inclusion checks are unlimited and never metered.",
  },
  {
    question: "Do you charge for seats or data volume?",
    answer:
      "No. There are no per-seat fees and no charges based on how many accounts or how much data you process. You pay only for proofs published on-chain.",
  },
  {
    question: "What happens if we exceed the included proofs?",
    answer:
      "Additional published proofs are billed at a simple per-proof rate that decreases with volume. You can set caps and alerts so there are no surprises.",
  },
  {
    question: "Can we run Solva entirely on our own infrastructure?",
    answer:
      "Yes. The Institutional plan supports on-prem and VPC deployment, with the prover running fully inside your environment.",
  },
];

export default function PricingPage() {
  return (
    <main className="relative z-[1]">
      {/* Hero */}
      <header className={`${sectionX} pb-9 pt-40 text-center`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">Pricing</Eyebrow>
          <h1 className="h1 mx-auto max-w-[760px]">
            Start free. Pay as you <span className="font-serif italic text-acc-text">prove</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-lg leading-relaxed text-sec">
            Build in the sandbox for free. When you go live, you pay for proofs published on-chain.
            No seat fees, no data charges.
          </p>
        </Reveal>
      </header>

      {/* Tiers */}
      <section className={`${sectionX} py-8`}>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <Reveal key={tier.name}>
              <div
                className="relative flex h-full flex-col rounded-panel border p-[26px] pt-[30px]"
                style={
                  tier.popular
                    ? {
                        background: "color-mix(in oklab, var(--acc) 7%, var(--surface))",
                        borderColor: "color-mix(in oklab, var(--acc) 45%, transparent)",
                      }
                    : { background: "var(--surface)", borderColor: "var(--hair)" }
                }
              >
                {tier.popular && (
                  <span className="absolute right-[18px] top-[18px] rounded-pill bg-acc px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-on-acc">
                    Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold tracking-tight">{tier.name}</h3>
                <p className="mb-5 mt-1.5 min-h-[40px] text-[13.5px] leading-snug text-sec">
                  {tier.tagline}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-[-0.03em]">
                    {tier.price}
                  </span>
                  <span className="text-[13px] text-sec">{tier.per}</span>
                </div>
                <p className="mb-[22px] mt-1 font-mono text-[11.5px] text-sec">{tier.meter}</p>
                <Button
                  href={tier.href}
                  variant={tier.popular ? "primary" : "secondary"}
                  className="w-full justify-center"
                >
                  {tier.cta}
                </Button>
                <ul className="mt-[22px] flex flex-col gap-2.5 border-t border-hair pt-5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13.5px] text-fg">
                      <CheckIcon size={15} className="mt-[3px] shrink-0 text-acc-text" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What's metered */}
      <section className={`${sectionX} py-10`}>
        <Reveal>
          <Card className="p-9">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
              <h2 className="h2">What&rsquo;s metered</h2>
              <p className="max-w-[420px] text-sm text-sec">
                One simple unit: a proof published on-chain. Everything around it is included.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metered.map((item) => (
                <div key={item.title} className="border-t border-hair pt-[18px]">
                  <div
                    className={`mb-2 font-mono text-[13px] ${
                      item.tag === "metered" ? "text-acc-text" : "text-sec"
                    }`}
                  >
                    {item.tag}
                  </div>
                  <div className="mb-1 text-[15px] font-semibold text-fg">{item.title}</div>
                  <p className="text-[13px] leading-snug text-sec">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className={`${sectionX} py-8`}>
        <div className="mx-auto max-w-[820px]">
          <Reveal>
            <h2 className="h2 mb-7 text-center">Pricing questions</h2>
          </Reveal>
          <Reveal>
            <FaqAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className={`${sectionX} pb-24 pt-6`}>
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
                Try it free in the sandbox.
              </h2>
              <p className="mx-auto mt-4 max-w-[460px] text-lg leading-snug text-sec">
                No card required. Talk to us when you&rsquo;re ready for production volumes.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <Button size="lg" href={routes.developers}>
                  Open the sandbox
                </Button>
                <Button size="lg" variant="secondary" href="/request-a-demo">
                  Talk to sales
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
