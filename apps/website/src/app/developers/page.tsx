import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import {
  Button,
  Card,
  Eyebrow,
  CodeBlock,
  CheckIcon,
  FileTextIcon,
  BracketsIcon,
} from "@/components/ui";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Prove, publish, and verify inclusion with a typed SDK, a mock open-banking sandbox, and an on-chain registry, without ever touching a circuit.",
};

const sectionX = "mx-auto max-w-site px-7";

const quickstartShell = `# install
$ npm i @solva/sdk

# start a local sandbox (mock open-banking)
$ npx solva sandbox up

# first proof in ~30s
$ npx solva prove --demo
✓ proof 0x7a3f…e3f1 · reserves ≥ liabilities`;

const proveSample = `import { Solva } from "@solva/sdk";

const solva = new Solva({ apiKey: process.env.SOLVA_KEY });

// build a proof from your ledger snapshot
const proof = await solva.prove({
  reserves:    ledger.reserves,      // stays on-prem
  liabilities: ledger.liabilities,   // never leaves
});

// settle it on Stellar
const receipt = await solva.publish(proof);

console.log(receipt.url); // public, verifiable`;

const endpoints = [
  { method: "POST", path: "/v1/prove", name: "prove", body: "Generate a zero-knowledge proof that reserves cover liabilities, locally." },
  { method: "POST", path: "/v1/publish", name: "publish", body: "Settle a proof inside the Stellar contract and write it to the registry." },
  { method: "GET", path: "/v1/verify", name: "verify-inclusion", body: "Confirm a balance was counted, or re-check any published proof." },
];

// A mono panel of terminal output. Children carry the per-line coloring.
function Terminal({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-[14px] border border-hair bg-bg p-[22px] font-mono text-[12.5px] leading-[1.9] text-sec">
      {children}
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <main className="relative z-[1]">
      {/* Hero + quickstart terminal */}
      <header className={`${sectionX} grid grid-cols-1 items-center gap-12 pb-12 pt-40 lg:grid-cols-[1.05fr_.95fr]`}>
        <Reveal>
          <Eyebrow className="mb-5 text-acc-text">Developers</Eyebrow>
          <h1 className="h1">
            Three calls to a <span className="font-serif italic text-acc-text">proof</span>.
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-sec">
            A typed SDK, a mock open-banking sandbox, and an on-chain registry you can query. Prove,
            publish, and verify inclusion without ever touching a circuit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/request-a-demo">Open the sandbox</Button>
            <Button variant="secondary" href="#api">
              API reference
            </Button>
          </div>
        </Reveal>
        <Reveal>
          <CodeBlock filename="quickstart.sh" language="bash" code={quickstartShell} />
        </Reveal>
      </header>

      {/* Quickstart code */}
      <section className={`${sectionX} py-10`}>
        <div className="grid grid-cols-1 items-start gap-12 border-t border-hair pt-12 lg:grid-cols-[.85fr_1.15fr]">
          <Reveal>
            <Eyebrow className="mb-4 text-acc-text">Quickstart</Eyebrow>
            <h2 className="h2">Prove and publish in one file.</h2>
            <p className="mt-4 text-base leading-relaxed text-sec">
              The SDK runs the prover locally against your data and returns a proof you can publish to
              Stellar. Reserves and liabilities stay on your machine.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-[14.5px] text-fg">
              {[
                "Typed end to end (TypeScript)",
                "Works in Node and edge runtimes",
                "No circuit knowledge required",
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5">
                  <CheckIcon size={15} className="shrink-0 text-acc-text" />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <CodeBlock filename="prove.ts" code={proveSample} />
          </Reveal>
        </div>
      </section>

      {/* The API */}
      <section id="api" className={`${sectionX} py-12`}>
        <Reveal>
          <h2 className="h2 mb-2">The API</h2>
          <p className="mb-8 max-w-[520px] text-base text-sec">
            Three primitives. Everything else is built on top.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {endpoints.map((ep) => (
            <Reveal key={ep.path}>
              <Card className="h-full p-[26px]">
                <div className="mb-4 flex items-center gap-2.5">
                  <span
                    className={`rounded-chip px-2 py-0.5 font-mono text-[11px] font-semibold ${
                      ep.method === "GET"
                        ? "border border-hair-strong text-fg"
                        : "bg-acc text-on-acc"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-[13px] text-fg">{ep.path}</span>
                </div>
                <h3 className="font-display text-[18px] font-semibold">{ep.name}</h3>
                <p className="mt-2 text-[14.5px] leading-snug text-sec">{ep.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Sandbox */}
      <section className={`${sectionX} pb-12`}>
        <Reveal>
          <Card className="grid grid-cols-1 items-center gap-12 p-10 lg:grid-cols-2">
            <div>
              <Eyebrow className="mb-4 text-acc-text">Sandbox</Eyebrow>
              <h2 className="h2">A mock open-banking world to build against.</h2>
              <p className="mt-4 text-base leading-relaxed text-sec">
                Spin up synthetic institutions, ledgers, and customer balances. Generate proofs
                against fake data, then point the same code at production.
              </p>
              <div className="mt-6">
                <Button href="/request-a-demo">Launch sandbox</Button>
              </div>
            </div>
            <Terminal>
              $ solva sandbox seed --bank demo
              <br />
              <span className="text-fg">→ created 12,480 mock accounts</span>
              <br />
              <span className="text-fg">→ reserves $48.2M · liabilities $41.7M</span>
              <br />$ solva prove --bank demo
              <br />
              <span className="text-acc-text">✓ reserves ≥ liabilities (margin 1,240 bps)</span>
              <br />
              <span className="text-acc-text">✓ published 0x91b4…c2a0</span>
            </Terminal>
          </Card>
        </Reveal>
      </section>

      {/* Docs / reference / status */}
      <section className={`${sectionX} pb-12`}>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          <Reveal>
            <a href={routes.docs} className="block h-full">
              <Card interactive className="h-full p-7">
                <FileTextIcon size={24} className="mb-4 text-acc-text" />
                <h3 className="font-display text-[18px] font-semibold">Docs &amp; guides</h3>
                <p className="mt-1.5 text-sm leading-snug text-sec">
                  Concepts, integration guides, and recipes.
                </p>
              </Card>
            </a>
          </Reveal>
          <Reveal>
            <a href="#api" className="block h-full">
              <Card interactive className="h-full p-7">
                <BracketsIcon size={24} className="mb-4 text-acc-text" />
                <h3 className="font-display text-[18px] font-semibold">API reference</h3>
                <p className="mt-1.5 text-sm leading-snug text-sec">Every endpoint, type, and error.</p>
              </Card>
            </a>
          </Reveal>
          <Reveal>
            <a href={routes.status} className="block h-full">
              <Card interactive className="h-full p-7">
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-acc"
                    style={{ boxShadow: "0 0 10px 1px var(--acc)" }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-acc-text">all systems operational</span>
                </div>
                <h3 className="font-display text-[18px] font-semibold">Status &amp; changelog</h3>
                <p className="mt-1.5 text-sm leading-snug text-sec">
                  Uptime, incidents, and what shipped.
                </p>
              </Card>
            </a>
          </Reveal>
        </div>
      </section>

      {/* Solvency oracle (MCP) */}
      <section className={`${sectionX} pb-14`}>
        <Reveal>
          <Card className="grid grid-cols-1 items-center gap-12 p-10 lg:grid-cols-2">
            <div>
              <Eyebrow className="mb-4 text-acc-text">Solvency oracle · MCP</Eyebrow>
              <h2 className="h2">A solvency feed your agents can trust.</h2>
              <p className="mt-4 text-base leading-relaxed text-sec">
                Expose verified solvency over the Model Context Protocol. An autonomous agent can
                check a counterparty before it moves funds, and get a cryptographic answer rather than
                a claim.
              </p>
              <a
                href={routes.oracle}
                className="footer-link mt-5 inline-block font-semibold text-acc-text"
              >
                Read about the oracle →
              </a>
            </div>
            <Terminal>
              <span className="text-sec">// MCP tool call</span>
              <br />
              solva.check_solvency(&#123;
              <br />
              &nbsp;&nbsp;entity: <span className="text-acc-text">&quot;meridian-bank&quot;</span>
              <br />
              &#125;)
              <br />
              <span className="text-fg">→ &#123;</span>
              <br />
              &nbsp;&nbsp;solvent: <span className="text-acc-text">true</span>,
              <br />
              &nbsp;&nbsp;margin_bps: <span className="text-fg">1240</span>,
              <br />
              &nbsp;&nbsp;proof: <span className="text-fg">&quot;0x7a3f…e3f1&quot;</span>
              <br />
              <span className="text-fg">&#125;</span>
            </Terminal>
          </Card>
        </Reveal>
      </section>

      {/* CTA */}
      <section className={`${sectionX} pb-24 pt-2`}>
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
                Ship your first proof today.
              </h2>
              <p className="mx-auto mt-4 max-w-[460px] text-lg leading-snug text-sec">
                Free in the sandbox. No customer data, no circuit knowledge.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <Button size="lg" href="/request-a-demo">
                  Open the sandbox
                </Button>
                <Button size="lg" variant="secondary" href={routes.docs}>
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
