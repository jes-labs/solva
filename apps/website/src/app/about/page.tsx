import type { Metadata } from "next";
import Image from "next/image";
import { Reveal, Counter } from "@/components/motion";
import { Button, Card, Eyebrow } from "@/components/ui";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "About",
  description:
    "Solva replaces the promise of solvency with a proof, so reserves meeting liabilities is something anyone can check rather than something they have to believe.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About", url: "/about" },
};

const sectionX = "mx-auto max-w-site px-7";

// founded counts without grouping so it reads 2024, not 2,024.
const stats = [
  { value: 2024, suffix: "", grouping: false, accent: false, label: "founded" },
  { value: 3, suffix: "", grouping: true, accent: true, label: "continents" },
  { value: 100, suffix: "%", grouping: true, accent: false, label: "data kept on-prem" },
  { value: 1, suffix: "", grouping: true, accent: false, label: "invariant: R ≥ L" },
];

const values = [
  {
    n: "01",
    title: "Proof over promises",
    body: "If it can't be verified, it shouldn't be trusted. We ship math, not assurances.",
  },
  {
    n: "02",
    title: "Privacy is not optional",
    body: "Transparency about solvency should never cost customers their privacy.",
  },
  {
    n: "03",
    title: "Built to be checked",
    body: "We'd rather you verify us than trust us. Everything important is on-chain.",
  },
];

const team = [
  { name: "Josh", role: "Co-founder · ZK & protocol engineer", image: "/team/josh.png" },
  { name: "Sogo", role: "Co-founder · ZK & software engineer", image: "/team/sogo.jpeg" },
  { name: "Emmanuel", role: "Co-founder · Researcher & software engineer", image: "/team/emmanuel.jpg" },
];

const backers = ["Ledger Ventures", "Aperture", "Northgate", "Stellar Foundation", "Kestrel"];

export default function AboutPage() {
  return (
    <main className="relative z-[1]">
      {/* Hero / mission */}
      <header className={`${sectionX} pb-12 pt-44`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">About Solva</Eyebrow>
          <h1 className="h1 max-w-[920px]">
            We&rsquo;re building <span className="font-serif italic text-acc-text">verifiable</span>{" "}
            trust for finance.
          </h1>
          <p className="mt-6 max-w-[640px] text-lg leading-relaxed text-sec">
            Money runs on trust, and trust has been running on paperwork. Solva replaces the promise
            with a proof, so solvency is something anyone can check rather than something they have
            to believe.
          </p>
        </Reveal>
      </header>

      {/* Stats band */}
      <section className={`${sectionX} pb-10 pt-2`}>
        <Reveal>
          <div className="grid grid-cols-2 gap-5 border-y border-hair py-10 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  useGrouping={stat.grouping}
                  className={`font-display text-[clamp(28px,3.2vw,42px)] font-bold tracking-[-0.03em] ${
                    stat.accent ? "text-acc-text" : ""
                  }`}
                />
                <p className="mt-2 text-[13.5px] text-sec">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Story */}
      <section className={`${sectionX} py-10`}>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <Eyebrow className="mb-4 text-acc-text">Our story</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3vw,38px)] font-semibold leading-tight tracking-tight">
              From a failure everyone saw coming.
            </h2>
          </Reveal>
          <Reveal className="text-[17px] leading-[1.66] text-sec">
            <p className="mb-[18px]">
              After watching institutions pass audits and collapse weeks later, our founders kept
              asking the same question: why can a company prove it holds assets but not that it can
              cover what it owes? The tools to answer it existed, in cryptography, but no one had
              pointed them at solvency.
            </p>
            <p>
              Solva started as a proving circuit and a stubborn belief that trust in finance should
              be checkable by anyone, anywhere. We built it for global markets, where that gap costs
              the most.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className={`${sectionX} py-10`}>
        <Reveal>
          <h2 className="h2 mb-7">What we believe</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {values.map((value) => (
            <Reveal key={value.n}>
              <Card className="h-full p-7">
                <div className="mb-3 font-mono text-[13px] text-acc-text">{value.n}</div>
                <h3 className="font-display text-[19px] font-semibold">{value.title}</h3>
                <p className="mt-[7px] text-[14.5px] leading-snug text-sec">{value.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className={`${sectionX} py-10`}>
        <Reveal>
          <h2 className="h2 mb-7">The team</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3">
          {team.map((member) => (
            <Reveal key={member.name}>
              <Card className="h-full p-6">
                <div className="mb-4 size-[54px] overflow-hidden rounded-full border border-hair">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={54}
                    height={54}
                    className="size-full object-cover"
                  />
                </div>
                <h3 className="font-display text-[17px] font-semibold">{member.name}</h3>
                <p className="mt-[3px] text-[13.5px] text-sec">{member.role}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Backers */}
      <section className={`${sectionX} py-10`}>
        <Reveal>
          <Card className="p-10">
            <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-sec">
              Backed by people who&rsquo;ve built financial infrastructure
            </p>
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 opacity-60">
              {backers.map((backer) => (
                <span
                  key={backer}
                  className="font-display text-xl font-bold tracking-tight"
                >
                  {backer}
                </span>
              ))}
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Careers + contact */}
      <section className={`${sectionX} pb-24 pt-10`}>
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-panel border border-hair bg-surface p-12">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage: "radial-gradient(var(--hair) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <h2 className="font-display text-[clamp(24px,3vw,38px)] font-bold tracking-tight">
                  Come build the proof layer.
                </h2>
                <p className="mt-3 max-w-[420px] text-base leading-relaxed text-sec">
                  We&rsquo;re hiring cryptographers, distributed-systems engineers, and people who
                  love regulated finance.
                </p>
                <div className="mt-6">
                  <Button href="mailto:support@joinsolva.xyz?subject=Open%20roles">
                    See open roles
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <Card className="flex h-full flex-col justify-center p-10">
              <h3 className="font-display text-[22px] font-semibold tracking-tight">Get in touch</h3>
              <p className="mt-2.5 text-[15px] leading-snug text-sec">
                Press, partnerships, or just curious.
              </p>
              <a
                href="mailto:support@joinsolva.xyz"
                className="mt-4 font-mono text-[15px] text-fg transition-colors hover:text-acc-text"
              >
                support@joinsolva.xyz
              </a>
              <a
                href={routes.demo}
                className="mt-2 text-[15px] font-semibold text-acc-text transition-opacity hover:opacity-80"
              >
                Request a demo →
              </a>
            </Card>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
