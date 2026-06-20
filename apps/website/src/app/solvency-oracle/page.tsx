import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { Button, Card, Eyebrow, CodeBlock, ActivityIcon, ClockIcon } from "@/components/ui";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Solvency oracle",
  description:
    "A machine-verifiable solvency feed over MCP and a public API. Autonomous agents can check a counterparty before moving funds, and get a cryptographic answer.",
};

const sectionX = "mx-auto max-w-site px-7";

const heroCall = `// before settling with a counterparty
agent.useTool("solva.check_solvency", {
  entity: "orbital-pay"
})

→ {
  solvent: true,
  margin_bps: 1240,
  proof: "0x7a3f…e3f1",
  verified_at: "2026-06-19T09:41Z"
}`;

// A small mono code panel used inside the two query cards.
function Snippet({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-hair bg-bg p-4 font-mono text-[12.5px] leading-[1.85] text-sec">
      {children}
    </div>
  );
}

// Treasury icon (a card), kept inline since it is only used here.
function CardIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="18" height="14" rx="2" />
      <path d="M4 10h18M8 15h5" strokeLinecap="round" />
    </svg>
  );
}

const useCases = [
  { title: "Pre-trade checks", body: "A trading agent confirms a venue is solvent before routing an order.", Icon: ActivityIcon },
  { title: "Treasury automation", body: "A treasury bot only parks funds with counterparties that prove solvency.", Icon: CardIcon },
  { title: "Continuous monitoring", body: "A risk agent watches the margin and alerts the moment it nears a breach.", Icon: ClockIcon },
];

export default function SolvencyOraclePage() {
  return (
    <main className="relative z-[1]">
      {/* Hero + agent tool call */}
      <header className={`${sectionX} grid grid-cols-1 items-center gap-12 pb-12 pt-40 lg:grid-cols-[1.05fr_.95fr]`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">Solvency oracle · for agents</Eyebrow>
          <h1 className="h1">
            Solvency an agent can <span className="font-serif italic text-acc-text">query</span>.
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-sec">
            A machine-verifiable solvency feed over MCP and a public API. Before an autonomous agent
            moves funds, it can check the counterparty and get a cryptographic answer, not a claim.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={routes.developers}>Read the docs</Button>
            <Button variant="secondary" href="#query">
              See a query
            </Button>
          </div>
        </Reveal>
        <Reveal>
          <CodeBlock filename="agent · tool call" language="tsx" code={heroCall} />
        </Reveal>
      </header>

      {/* Why agents need it */}
      <section className={`${sectionX} py-10`}>
        <div className="grid grid-cols-1 gap-12 border-t border-hair pt-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <Eyebrow className="mb-4 text-acc-text">Why agents need it</Eyebrow>
            <h2 className="h2">Agents can&rsquo;t read a PDF attestation.</h2>
          </Reveal>
          <p className="self-center text-[16.5px] leading-relaxed text-sec">
            As software starts to move money on its own, it needs counterparty risk it can evaluate in
            code, in real time. A quarterly attestation, a press release, or a logo on a website mean
            nothing to a program. A signed proof on-chain does. Solva turns solvency into a value an
            agent can fetch, check, and act on.
          </p>
        </div>
      </section>

      {/* Two ways to query */}
      <section id="query" className={`${sectionX} pb-10 pt-2`}>
        <Reveal>
          <h2 className="h2 mb-7">Two ways to query it.</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <Reveal>
            <Card className="h-full p-[30px]">
              <div className="mb-2.5 font-mono text-xs text-acc-text">Model Context Protocol</div>
              <h3 className="font-display text-xl font-semibold">MCP tool</h3>
              <p className="mb-[18px] mt-2.5 text-[14.5px] leading-snug text-sec">
                Drop the Solva MCP server into any agent runtime. The model gets a{" "}
                <span className="font-mono text-fg">check_solvency</span> tool with typed inputs and
                verified outputs.
              </p>
              <Snippet>
                &quot;mcpServers&quot;: &#123;
                <br />
                &nbsp;&nbsp;<span className="text-acc-text">&quot;solva&quot;</span>: &#123;
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;command: <span className="text-fg">&quot;npx solva-mcp&quot;</span>
                <br />
                &nbsp;&nbsp;&#125;
                <br />
                &#125;
              </Snippet>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full p-[30px]">
              <div className="mb-2.5 font-mono text-xs text-acc-text">HTTP</div>
              <h3 className="font-display text-xl font-semibold">Public API</h3>
              <p className="mb-[18px] mt-2.5 text-[14.5px] leading-snug text-sec">
                A plain REST endpoint for anything that speaks HTTP. Returns the live solvency status
                and the proof reference to verify independently.
              </p>
              <Snippet>
                GET /v1/solvency/orbital-pay
                <br />
                <span className="text-acc-text">→ &#123; solvent: true, margin_bps: 1240 &#125;</span>
              </Snippet>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Where it's used */}
      <section className={`${sectionX} py-10`}>
        <Reveal>
          <h2 className="h2 mb-7">Where it&rsquo;s used</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {useCases.map(({ title, body, Icon }) => (
            <Reveal key={title}>
              <Card className="h-full p-7">
                <span className="text-acc-text">
                  <Icon size={26} />
                </span>
                <h3 className="mt-4 font-display text-[18px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-snug text-sec">{body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
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
                Give your agents a source of truth.
              </h2>
              <p className="mx-auto mt-4 max-w-[460px] text-lg leading-snug text-sec">
                Wire the solvency oracle into your stack in an afternoon.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <Button size="lg" href={routes.developers}>
                  Read the docs
                </Button>
                <Button size="lg" variant="secondary" href="/request-a-demo">
                  Request a demo
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
